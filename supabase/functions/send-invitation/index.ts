import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Edge Function: send-invitation (GOLD STANDARD) started');

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { email, fullName, invitedBy } = await req.json();

    if (!email || !fullName) {
      return new Response(JSON.stringify({ error: 'Email and fullName are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`📝 Processing invitation for: ${email}`);

    // 1. Generate Secure Token (Custom)
    // This token is for the invitation link, NOT a Supabase Auth token.
    const tokenArray = new Uint8Array(32);
    crypto.getRandomValues(tokenArray);
    const token = Array.from(tokenArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // 2. Prepare Data
    const tenantId = crypto.randomUUID();
    const companyName = `${fullName.split(' ')[0]}'s Company`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // 3. Insert into 'invitations' table
    console.log('💾 Saving invitation to database...');
    const { data: invitation, error: insertError } = await supabaseAdmin
      .from('invitations')
      .insert({
        token: token,
        email: email,
        full_name: fullName,
        tenant_id: tenantId,
        tenant_name: companyName,
        invitation_type: 'tenant_owner',
        invited_by: invitedBy || null, // ID of the admin sending the invite
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        metadata: {
          company_name: companyName,
          security_level: 'standard',
          invitation_source: 'admin_panel',
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting invitation:', insertError);
      throw insertError;
    }

    console.log('✅ Invitation saved:', invitation.id);

    // 4. Send Email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL');
    const siteUrl =
      Deno.env.get('SITE_URL') || req.headers.get('origin') || 'https://wadashaqayn.org';

    // Clean trailing slash
    const baseUrl = siteUrl.replace(/\/$/, '');
    const acceptUrl = `${baseUrl}/invite/accept?token=${token}`;

    console.log(`📧 Sending email to ${email} with link: ${acceptUrl}`);

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bonjour ${fullName},</h2>
        <p>Vous avez été invité à créer votre espace sur <strong>Wadashaqayn</strong>.</p>
        <p>Pour accepter cette invitation et configurer votre compte, cliquez sur le bouton ci-dessous :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${acceptUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Accepter l'invitation
          </a>
        </div>
        <p>Ce lien est valide pendant 7 jours.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          Si vous ne pouvez pas cliquer sur le bouton, copiez ce lien :<br/>
          <a href="${acceptUrl}">${acceptUrl}</a>
        </p>
      </div>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [email],
        subject: 'Invitation à rejoindre Wadashaqayn',
        html: emailHtml,
      }),
    });

    console.log('✅ Email sent successfully');

    return new Response(JSON.stringify({ success: true, invitationId: invitation.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('🚨 Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
