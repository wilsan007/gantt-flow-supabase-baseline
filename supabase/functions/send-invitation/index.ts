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

    // 1. Prepare Data
    const tenantId = crypto.randomUUID();
    const companyName = `${fullName.split(' ')[0]}'s Company`;
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';

    // 2. Create or Update User
    console.log('👤 Creating/Updating Auth User...');
    let userId;

    // Check if user exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers.users.find(u => u.email === email.toLowerCase());

    const userMetadata = {
      full_name: fullName,
      company_name: companyName,
      tenant_id: tenantId,
      invitation_type: 'tenant_owner',
      role: 'tenant_admin',
    };

    if (existingUser) {
      console.log('ℹ️ User already exists, updating metadata...');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { user_metadata: { ...existingUser.user_metadata, ...userMetadata } }
      );
      if (updateError) throw updateError;
      userId = existingUser.id;
    } else {
      console.log('🆕 Creating new user...');
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: false, // We will confirm via the magic link
        user_metadata: userMetadata,
      });
      if (createError) throw createError;
      userId = newUser.user.id;
    }

    // 3. Generate Magic Link
    console.log('🔗 Generating Magic Link...');
    const siteUrl =
      Deno.env.get('SITE_URL') || req.headers.get('origin') || 'https://wadashaqayn.org';
    const baseUrl = siteUrl.replace(/\/$/, '');

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: `${baseUrl}/auth/callback?email=${encodeURIComponent(email)}&type=invite&invitation=tenant_owner`,
        data: userMetadata,
      },
    });

    if (linkError) throw linkError;

    const actionLink = linkData.properties.action_link;
    // Extract token from link for database record (optional but good for tracking)
    const token = actionLink.match(/token=([^&]+)/)?.[1] || 'MAGIC_LINK';

    // 4. Insert into 'invitations' table (for tracking purposes)
    console.log('💾 Saving invitation record...');
    const { data: invitation, error: insertError } = await supabaseAdmin
      .from('invitations')
      .insert({
        token: token,
        email: email,
        full_name: fullName,
        tenant_id: tenantId,
        tenant_name: companyName,
        invitation_type: 'tenant_owner',
        invited_by: invitedBy || null,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: {
          company_name: companyName,
          confirmation_url: actionLink,
          supabase_user_id: userId,
        },
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 5. Send Email via Resend
    console.log(`📧 Sending email to ${email}`);
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL');

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bonjour ${fullName},</h2>
        <p>Votre espace <strong>${companyName}</strong> est prêt sur Wadashaqayn.</p>
        <p>Cliquez ci-dessous pour y accéder directement (pas de mot de passe requis pour l'instant) :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${actionLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
            Accéder à mon espace
          </a>
        </div>
        <p>Ce lien est valide pendant 7 jours.</p>
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
        subject: 'Bienvenue sur Wadashaqayn !',
        html: emailHtml,
      }),
    });

    console.log('✅ Invitation process completed successfully');

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
