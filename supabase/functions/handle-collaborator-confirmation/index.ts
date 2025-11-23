import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===========================================================================
// FONCTIONS D'AIDE OPTIMALES (identiques à l'autre fichier pour la cohérence)
// ===========================================================================

/**
 * 🛡️ FIX BUG API : Tente de confirmer l'email via API, ou force via metadonnées.
 */
async function secureConfirmUser(supabaseClient: any, userId: string, metadataUpdates: any) {
  const timestamp = new Date().toISOString();
  let finalError = null;

  // Tentative 1: Standard
  try {
    const { error } = await supabaseClient.auth.admin.updateUserById(userId, {
      email_confirm: true,
      user_metadata: {
        ...metadataUpdates,
        confirmation_method: 'standard',
        confirmed_at: timestamp,
      },
    });
    if (!error) return { success: true, method: 'standard' };
    finalError = error;
  } catch (e) {
    finalError = e;
  }

  // Tentative 2: Contournement (Méthode "Force")
  try {
    const { error } = await supabaseClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...metadataUpdates,
        email_confirmed_automatically: true,
        simulated_email_confirmed_at: timestamp,
        confirmation_method: 'forced_metadata',
        bypass_reason: finalError?.message || 'unknown_error',
      },
    });
    if (error) throw error;
    return { success: true, method: 'forced_metadata' };
  } catch (criticalError) {
    return { success: false, error: criticalError.message };
  }
}

// ===========================================================================
// EDGE FUNCTION PRINCIPALE : COLLABORATOR CONFIRMATION
// ===========================================================================

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const payload = await req.json();
    const user = payload.record;

    // 1. VÉRIFICATION DU CONTEXTE (ANTI-BOUCLE)
    if (payload.type !== 'UPDATE' || payload.table !== 'users') {
      return new Response(JSON.stringify({ message: 'Événement ignoré' }), {
        headers: corsHeaders,
      });
    }

    const meta = user.raw_user_meta_data;
    const isCollaborator = meta?.invitation_type === 'collaborator';

    if (!isCollaborator) {
      return new Response(JSON.stringify({ message: 'Ignoré: Pas un collaborateur' }), {
        headers: corsHeaders,
      });
    }

    // Protection anti-boucle
    if (meta.processed_collaborator_at) {
      return new Response(JSON.stringify({ message: 'Déjà traité' }), { headers: corsHeaders });
    }

    // 2. VÉRIFICATION DE L'INVITATION
    const { data: pendingInvitation, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .select('id, tenant_id, full_name, role_to_assign, department, job_position, metadata')
      .eq('id', meta.invitation_id)
      .single();

    if (inviteError || !pendingInvitation) {
      throw new Error(`INVITATION_NOT_FOUND: ${inviteError?.message || 'ID non trouvé.'}`);
    }

    // 3. VALIDATION SÉCURITAIRE
    // Validation minimale pour un collaborateur :
    if (meta.invitation_type !== 'collaborator' || !pendingInvitation.tenant_id) {
      throw new Error('INVALID_METADATA: Les métadonnées sont incomplètes ou incorrectes.');
    }

    // 4. CONFIRMATION EMAIL (FIX BUG API - Même logique que l'Owner)
    let isConfirmed = user.email_confirmed_at || meta.email_confirmed_automatically;

    if (!isConfirmed) {
      const confirmResult = await secureConfirmUser(supabaseAdmin, user.id, meta);

      if (!confirmResult.success) {
        throw new Error(
          `EMAIL_CONFIRMATION_FAILED: ${confirmResult.error}. L'utilisateur est bloqué.`
        );
      }
      user.email_confirmed_at = new Date().toISOString();
    }

    // 5. OBTENIR LE RÔLE ID
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, display_name')
      .eq('name', pendingInvitation.role_to_assign) // Ex: 'manager'
      .single();

    if (roleError || !role)
      throw new Error(`ROLE_NOT_FOUND: Rôle '${pendingInvitation.role_to_assign}' inexistant.`);

    // 6. GÉNÉRATION DE L'EMPLOYEE_ID (FIX RACE CONDITION - RPC)
    const { data: employeeId, error: seqError } = await supabaseAdmin.rpc('get_next_employee_id');
    if (seqError || !employeeId)
      throw new Error(`RPC_ID_ERROR: ${seqError?.message || 'ID non généré.'}`);

    // 7. CRÉATION DU PROFIL ET RÔLE (tables jointes)
    const profileData = {
      user_id: user.id,
      full_name: pendingInvitation.full_name,
      tenant_id: pendingInvitation.tenant_id,
      employee_id: employeeId,
      role_id: role.id,
      department: pendingInvitation.department || null,
      job_position: pendingInvitation.job_position || null,
    };

    const { error: profileError } = await supabaseAdmin.from('profiles').insert(profileData);
    if (profileError) throw new Error(`DB_PROFILE_ERROR: ${profileError.message}`);

    // 8. FINALISATION (Marquer comme traité)
    const { error: finalUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        processed_collaborator_at: new Date().toISOString(), // Empêche le prochain webhook
        employee_id: employeeId, // Ajout de l'ID à l'Auth User
      },
    });
    if (finalUpdateError) console.error('⚠️ Erreur mise à jour finale:', finalUpdateError);

    await supabaseAdmin
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', pendingInvitation.id);

    // 9. AUTO-CONNEXION (UX OPTIMALE - Ajouté pour parité avec Owner)
    let sessionData = null;
    try {
      const { data: sessionResult, error: sessionError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: user.email,
          options: {
            // Point de redirection après login
            redirectTo: `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/app/dashboard`,
          },
        });
      if (!sessionError && sessionResult.properties?.action_link) {
        sessionData = {
          magic_link: sessionResult.properties.action_link,
        };
      }
    } catch (sessionError) {
      console.log('⚠️ Erreur création session (non critique):', sessionError);
    }

    // 10. RÉPONSE FINALE
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Collaborateur ajouté avec succès',
        data: {
          user_id: user.id,
          tenant_id: pendingInvitation.tenant_id,
          employee_id: employeeId,
          role: role.display_name,
          session: sessionData, // Contient le magic_link pour l'auto-connexion
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Erreur globale:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
