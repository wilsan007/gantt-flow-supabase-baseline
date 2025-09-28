import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers are now defined directly within the function file
// to ensure they are always included during deployment.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle the preflight 'OPTIONS' request.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Extract required parameters from the request body.
    const { invitation_token, company_name, password } = await req.json();
    if (!invitation_token || !company_name || !password) {
      return new Response(JSON.stringify({ error: 'Missing required parameters.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Create a Supabase admin client.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Validate the invitation token.
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from('invitations')
      .select('email, status, expires_at')
      .eq('token', invitation_token)
      .single();

    if (invitationError || !invitation) {
      return new Response(JSON.stringify({ error: 'Invalid invitation token.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (invitation.status !== 'pending') {
      return new Response(JSON.stringify({ error: 'This invitation has already been used.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'This invitation has expired.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Create the new user in Supabase Auth.
    let newUserId = null;
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return new Response(JSON.stringify({ error: 'A user with this email is already registered.' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`Auth Error: ${authError.message}`);
    }
    newUserId = authData.user.id;

    // 5. Call the atomic PostgreSQL function.
    const { error: rpcError } = await supabaseAdmin.rpc('create_tenant_and_owner_atomic', {
      p_invitation_token: invitation_token,
      p_company_name: company_name,
      p_user_id: newUserId,
    });

    if (rpcError) {
      // CRITICAL ROLLBACK: Delete the orphaned auth user.
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      throw new Error(`RPC Error: ${rpcError.message}. Orphaned user was deleted.`);
    }

    // 6. Return success.
    return new Response(JSON.stringify({ success: true, message: 'Tenant and owner created successfully.' }), {
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