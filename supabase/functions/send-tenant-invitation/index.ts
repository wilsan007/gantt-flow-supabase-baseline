import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers defined directly within the function file.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This function simulates sending an email.
async function sendInvitationEmail(email, fullName, invitationLink) {
    // This part remains unchanged, assuming environment variables are set for a real email service.
    console.log(`Simulating email send to ${email} with link: ${invitationLink}`);
    return { success: true };
}


serve(async (req) => {
  // Handle the preflight 'OPTIONS' request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase Admin Client.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2. Authenticate the user and verify they are a Super Admin.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Missing Authorization header.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid token.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: isSuperAdmin, error: rpcError } = await supabaseAdmin.rpc('is_super_admin', { user_id: user.id });
    if (rpcError || !isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Access denied. Super Admin role required.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Extract parameters from the request body.
    const { email, full_name } = await req.json();
    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: 'Email and full_name are required.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Generate necessary data for the invitation.
    const { data: invitationToken, error: tokenError } = await supabaseAdmin.rpc('generate_invitation_token');
    if (tokenError) throw tokenError;

    const newTenantId = crypto.randomUUID();

    // 5. Insert the invitation into the database.
    const { error: insertError } = await supabaseAdmin.from('invitations').insert({
      email: email,
      full_name: full_name,
      token: invitationToken,
      tenant_id: newTenantId,
      invitation_type: 'tenant_owner',
      invited_by: user.id,
      status: 'pending',
    });

    if (insertError) throw insertError;

    // 6. Send the invitation email.
    const appBaseUrl = Deno.env.get('APP_BASE_URL') || 'http://localhost:8080';
    const invitationLink = `${appBaseUrl}/signup/tenant-owner?token=${invitationToken}`;
    await sendInvitationEmail(email, full_name, invitationLink);

    // 7. Return a success response.
    return new Response(JSON.stringify({ success: true, message: 'Invitation sent successfully.' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});