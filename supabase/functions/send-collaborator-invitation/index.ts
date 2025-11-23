import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- HELPERS ---
function sendError(
  message: string,
  code: string,
  status: number,
  suggestion?: string,
  details?: any
) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      errorCode: code,
      suggestion: suggestion,
      technicalDetails: details,
    }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. AUTH & PERMISSIONS
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return sendError('Non connecté', 'UNAUTHORIZED', 401);

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user: inviter },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !inviter) return sendError('Session expirée', 'SESSION_EXPIRED', 401);

    // 2. CHECK DROITS (RPC)
    const { data: canInvite } = await supabaseClient.rpc('can_invite_collaborators', {
      user_id: inviter.id,
    });
    if (!canInvite)
      return sendError('Permissions insuffisantes', 'FORBIDDEN', 403, 'Contactez votre admin.');

    const { data: tenantId } = await supabaseClient.rpc('get_user_tenant_id', {
      user_uuid: inviter.id,
    });
    if (!tenantId) return sendError('Aucune entreprise associée', 'NO_TENANT', 400);

    // 3. VALIDATION INPUT
    const { email, fullName, roleToAssign, department, siteUrl } = await req.json();

    if (!email || !fullName || !roleToAssign) {
      return sendError('Champs manquants', 'MISSING_FIELDS', 400, 'Email, Nom et Rôle requis.');
    }

    // 4. CHECK EMAIL CONFLICT (RPC)
    const { data: exists } = await supabaseClient.rpc('is_email_in_tenant', {
      email_param: email,
      tenant_id_param: tenantId,
    });
    if (exists)
      return sendError(
        "Email déjà dans l'équipe",
        'EMAIL_EXISTS',
        409,
        'Cet utilisateur est déjà membre.'
      );

    console.log(`🚀 Adding collaborator ${email} to tenant ${tenantId}`);

    // 5. CRÉATION INVITATION (Pattern "Invitation First")
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

    const { data: invitation, error: inviteError } = await supabaseClient
      .from('invitations')
      .insert({
        email,
        full_name: fullName,
        tenant_id: tenantId, // Le VRAI tenant ID existant
        token: 'PENDING', // Token temporaire - sera mis à jour après génération du magic link
        invitation_type: 'collaborator',
        invited_by: inviter.id,
        role_to_assign: roleToAssign,
        department: department,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          temp_password: tempPassword,
          invited_by_email: inviter.email,
          role: roleToAssign,
        },
      })
      .select()
      .single();

    if (inviteError)
      return sendError('Erreur DB Invitation', 'DB_ERROR', 500, undefined, inviteError.message);

    const realInvitationId = invitation.id;

    // 6. GESTION USER AUTH & ROLLBACK
    let targetUserId;
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email.toLowerCase());

    const userMetadata = {
      full_name: fullName,
      invitation_id: realInvitationId, // ✅ Lien solide
      tenant_id: tenantId,
      invitation_type: 'collaborator',
      role_to_assign: roleToAssign,
      temp_password: tempPassword,
      ready_for_confirmation: true,
    };

    if (existingUser) {
      // User existe déjà (peut-être dans un autre tenant)
      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: { ...existingUser.user_metadata, ...userMetadata },
        }
      );
      if (updateError) {
        await supabaseClient.from('invitations').delete().eq('id', realInvitationId); // ROLLBACK
        return sendError('Erreur update user', 'USER_UPDATE_FAIL', 500);
      }
      targetUserId = existingUser.id;
    } else {
      // Création nouvel user
      const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: userMetadata,
      });
      if (createError) {
        await supabaseClient.from('invitations').delete().eq('id', realInvitationId); // ROLLBACK
        return sendError(
          'Erreur création user',
          'USER_CREATE_FAIL',
          500,
          undefined,
          createError.message
        );
      }
      targetUserId = newUser.user.id;
    }

    // 7. MAGIC LINK & UPDATE
    const origin = req.headers.get('origin');
    const referer = req.headers.get('referer');

    let baseUrl;
    if (origin) {
      baseUrl = origin.replace(/\/$/, '');
    } else if (referer) {
      const refererUrl = new URL(referer);
      baseUrl = `${refererUrl.protocol}//${refererUrl.host}`;
    } else if (siteUrl) {
      baseUrl = siteUrl.replace(/\/$/, '');
    } else {
      const port = frontendPort || Deno.env.get('FRONTEND_PORT') || '8080';
      baseUrl = `http://localhost:${port}`;
    }

    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'invite', // ✅ 'invite' fonctionne avec email_confirm: false
      email: email,
      options: {
        redirectTo: `${baseUrl}/auth/callback?email=${encodeURIComponent(email)}&type=invite&invitation=collaborator`,
      },
    });

    if (linkError) return sendError('Erreur Link', 'LINK_ERROR', 500);

    const confirmationUrl = linkData.properties.action_link;
    const confirmationToken = confirmationUrl.match(/token=([^&]+)/)?.[1];

    await supabaseClient
      .from('invitations')
      .update({
        token: confirmationToken,
        metadata: {
          ...invitation.metadata,
          confirmation_url: confirmationUrl,
          supabase_user_id: targetUserId,
        },
      })
      .eq('id', realInvitationId);

    // 8. EMAIL (Resend)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Wadashaqayn <onboarding@wadashaqayn.org>',
          to: [email],
          subject: `Invitation: Rejoindre l'équipe sur Wadashaqayn`,
          html: `
                  <h2>Bonjour ${fullName}</h2>
                  <p>Vous avez été invité à rejoindre l'équipe en tant que <strong>${roleToAssign}</strong>.</p>
                  <p>Login: ${email}<br>Pass temporaire: ${tempPassword}</p>
                  <a href="${confirmationUrl}" style="background:#667eea;color:white;padding:10px 20px;text-decoration:none;border-radius:4px;">Rejoindre l'équipe</a>
                `,
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Collaborateur invité avec succès',
        data: { invitation_id: realInvitationId, email },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return sendError('Erreur critique', 'CRITICAL_ERROR', 500, undefined, error.message);
  }
});
