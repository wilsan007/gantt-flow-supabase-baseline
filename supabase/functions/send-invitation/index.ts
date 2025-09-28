import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({
        error: 'Non autorisé'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Vérifier que l'utilisateur est Super Admin
    const { data: isSuperAdmin, error: roleError } = await supabaseClient.rpc('is_super_admin', {
      user_id: user.id
    });
    if (roleError || !isSuperAdmin) {
      return new Response(JSON.stringify({
        error: 'Accès Super Admin requis'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { email, fullName, invitationType = 'tenant_owner', siteUrl } = await req.json();
    // Validation des données
    if (!email || !fullName) {
      return new Response(JSON.stringify({
        error: 'Email et nom complet requis'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Générer l'UUID du futur tenant
    const futureTenantId = crypto.randomUUID();
    // Générer un mot de passe temporaire
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '1!';
    console.log('Generated temp password:', tempPassword);
    // Vérifier d'abord si l'utilisateur existe déjà
    console.log('Checking if user already exists for email:', email);
    let userData;
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u)=>u.email === email.toLowerCase());
    if (existingUser) {
      console.log('User already exists, using existing user:', existingUser.id);
      userData = {
        user: existingUser
      };
    } else {
      // Créer un utilisateur temporaire avec Supabase Auth
      console.log('Creating temporary user for email:', email);
      const { data: newUserData, error: userError } = await supabaseClient.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: false,
        user_metadata: {
          full_name: fullName,
          invitation_type: 'tenant_owner',
          temp_user: true,
          temp_password: tempPassword
        }
      });
      if (userError) {
        console.error('Error creating user:', userError);
        console.error('User error details:', JSON.stringify(userError, null, 2));
        throw userError;
      } else {
        userData = newUserData;
        console.log('User created successfully:', userData.user?.id);
      }
    }
    // Générer un lien de confirmation avec token
    // Utiliser 'signup' car l'utilisateur doit confirmer son email
    const { data: linkData, error: linkError } = await supabaseClient.auth.admin.generateLink({
      type: 'signup',
      email: email,
      password: tempPassword,
      options: {
        redirectTo: `${siteUrl}/auth/callback`
      }
    });
    if (linkError) {
      console.error('Error generating link:', linkError);
      throw linkError;
    }
    console.log('Generated link data:', linkData);
    // Extraire le token du lien généré
    const url = new URL(linkData.properties.action_link);
    const supabaseToken = url.searchParams.get('token');
    if (!supabaseToken) {
      throw new Error('No token found in generated link');
    }
    // Créer l'invitation avec le token Supabase Auth
    const { data: invitation, error: invitationError } = await supabaseClient.from('invitations').insert({
      token: supabaseToken,
      email: email.toLowerCase(),
      full_name: fullName,
      tenant_id: futureTenantId,
      invitation_type: invitationType,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        supabase_user_id: userData.user?.id,
        confirmation_url: linkData.properties.action_link,
        temp_password: tempPassword
      }
    }).select().single();
    if (invitationError) {
      console.error('Erreur création invitation:', invitationError);
      return new Response(JSON.stringify({
        error: 'Erreur lors de la création de l\'invitation'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Utiliser directement le lien généré par Supabase Auth
    const invitationUrl = linkData.properties.action_link;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invitation Wadashaqeen</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Invitation Wadashaqeen</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Plateforme de gestion d'entreprise</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
          <h2 style="color: #333; margin-top: 0;">Message d'invitation</h2>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px; font-weight: bold;">
              📧 <strong>Une invitation a été envoyée à l'adresse :</strong><br>
              <span style="font-size: 16px; color: #333;">${email}</span>
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            <strong>Veuillez transmettre ce message à l'adresse ${email}</strong>
          </p>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            Bonjour <strong>${fullName}</strong>,<br><br>
            Vous êtes invité(e) à créer votre compte entreprise sur <strong>Wadashaqeen</strong>, 
            la plateforme complète de gestion d'entreprise.
          </p>
          
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            En tant que propriétaire d'entreprise, vous aurez accès à tous nos modules :
          </p>
          
          <ul style="color: #666; line-height: 1.8;">
            <li>📊 Gestion des projets et tâches</li>
            <li>👥 Gestion des ressources humaines</li>
            <li>📈 Tableaux de bord et analytics</li>
            <li>🔔 Système d'alertes intelligent</li>
            <li>⚙️ Administration complète</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: bold; 
                      font-size: 16px;
                      display: inline-block;">
              🚀 Créer mon compte entreprise
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              🔑 <strong>Mot de passe temporaire :</strong><br>
              <span style="font-size: 18px; font-weight: bold; color: #333; background: white; padding: 5px 10px; border-radius: 4px; display: inline-block; margin: 5px 0;">${tempPassword}</span><br><br>
              <small>Ce mot de passe sera utilisé pour valider votre compte. Vous pourrez le changer lors de l'inscription.</small>
            </p>
          </div>
          
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1565c0; font-size: 14px;">
              ⏰ <strong>Cette invitation expire dans 7 jours.</strong><br>
              📧 <strong>Votre email (${email}) sera pré-rempli dans le formulaire d'inscription.</strong><br><br>
              Si le lien ne fonctionne pas, copiez-collez cette URL dans votre navigateur :<br>
              <code style="background: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${invitationUrl}</code>
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #999; font-size: 14px;">
          <p>© 2024 Wadashaqeen - Plateforme de gestion d'entreprise</p>
          <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
        </div>
      </body>
      </html>
    `;
    console.log('📧 Préparation envoi email via Resend...');
    console.log('   - Destinataire:', email);
    console.log('   - Clé API Resend disponible:', Deno.env.get('RESEND_API_KEY') ? 'OUI' : 'NON');
    // Utiliser Resend pour envoyer l'email
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Wadashaqeen <onboarding@resend.dev>',
        to: [
          'osman.awaleh.adn@gmail.com'
        ],
        subject: `🎉 Invitation à rejoindre Wadashaqeen - ${fullName}`,
        html: emailHtml
      })
    });
    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('❌ Erreur envoi email Resend:');
      console.error('   - Status:', resendResponse.status);
      console.error('   - Response:', errorText);
      return new Response(JSON.stringify({
        error: 'Erreur lors de l\'envoi de l\'email'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const resendResult = await resendResponse.json();
    console.log('✅ Email envoyé avec succès via Resend:');
    console.log('   - ID email:', resendResult.id);
    console.log('   - Destinataire:', email);
    return new Response(JSON.stringify({
      success: true,
      message: 'Invitation envoyée avec succès',
      invitation_id: invitation.id,
      tenant_id: futureTenantId
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Erreur générale:', error);
    return new Response(JSON.stringify({
      error: 'Erreur interne du serveur'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
