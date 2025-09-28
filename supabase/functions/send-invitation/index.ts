import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Helper to generate a secure random token
function generateSecureToken(length = 40) {
  const

array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Authenticate the user (must be super_admin)
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: isSuperAdmin, error: roleError } = await supabaseAdmin.rpc('is_super_admin', { user_id: user.id });
    if (roleError || !isSuperAdmin) {
      return new Response(JSON.stringify({ error: 'Accès Super Admin requis' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. Get data from the request body
    const { email, fullName, siteUrl } = await req.json();
    if (!email || !fullName || !siteUrl) {
      return new Response(JSON.stringify({ error: 'Email, nom complet et siteUrl sont requis' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Generate a unique tenant ID and a secure invitation token
    const futureTenantId = crypto.randomUUID();
    const invitationToken = generateSecureToken();

    // 4. Create the invitation record in the database
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .insert({
        token: invitationToken,
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        tenant_id: futureTenantId,
        invitation_type: 'tenant_owner',
        invited_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Erreur création invitation:', invitationError);
      throw new Error('Erreur lors de la création de l\'invitation.');
    }

    // 5. Send the invitation email
    const invitationUrl = `${siteUrl}/signup/tenant-owner?token=${invitationToken}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Invitation à rejoindre Wadashaqeen</h1>
        <p>Bonjour ${fullName},</p>
        <p>Vous êtes invité à créer votre compte entreprise sur Wadashaqeen.</p>
        <p>Pour accepter l'invitation et créer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
        <a href="${invitationUrl}">Créer mon compte entreprise</a>
        <p>Ce lien expirera dans 7 jours.</p>
        <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
      </body>
      </html>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Wadashaqeen <onboarding@resend.dev>',
        to: [email], // FIX: Send to the invited user's email
        subject: `🎉 Invitation à rejoindre Wadashaqeen - ${fullName}`,
        html: emailHtml
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Erreur envoi email Resend:', errorText);
      throw new Error('Erreur lors de l\'envoi de l\'email d\'invitation.');
    }

    console.log(`Invitation envoyée avec succès à ${email}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Invitation envoyée avec succès',
      invitation_id: invitation.id,
      tenant_id: futureTenantId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erreur générale dans send-invitation:', error);
    return new Response(JSON.stringify({ error: error.message || 'Erreur interne du serveur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});