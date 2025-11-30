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

    // Handle GET: Retrieve Invitation Details (Public)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const token = url.searchParams.get('token');

      if (!token) {
        return new Response(JSON.stringify({ error: 'Token required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: invitation, error } = await supabaseAdmin
        .from('invitations')
        .select('id, email, full_name, tenant_id, tenant_name, invitation_type, status, expires_at')
        .eq('token', token)
        .single();

      if (error || !invitation) {
        return new Response(JSON.stringify({ error: 'Invitation not found or invalid' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (invitation.status !== 'pending') {
        return new Response(JSON.stringify({ error: 'Invitation already accepted or expired' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: 'Invitation expired' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify(invitation), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle POST: Accept Invitation (Authenticated)
    if (req.method === 'POST') {
      // 1. Verify Auth
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.replace('Bearer ', '');
      const {
        data: { user },
        error: authError,
      } = await supabaseAdmin.auth.getUser(token);

      if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Invalid user token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 2. Parse Body
      const { token: invitationToken } = await req.json();

      // 3. Get Invitation
      const { data: invitation, error: invError } = await supabaseAdmin
        .from('invitations')
        .select('*')
        .eq('token', invitationToken)
        .single();

      if (invError || !invitation) {
        return new Response(JSON.stringify({ error: 'Invitation not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 4. Verify Email Match (Security)
      if (invitation.email.toLowerCase() !== user.email?.toLowerCase()) {
        return new Response(JSON.stringify({ error: 'Email mismatch' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 5. Create Tenant (if needed) & Profile
      // Transaction-like operations

      // Create Tenant (if it doesn't exist yet - idempotency)
      const { error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert({
          id: invitation.tenant_id,
          name: invitation.tenant_name,
          slug:
            invitation.tenant_name.toLowerCase().replace(/[^a-z0-9]/g, '-') +
            '-' +
            Math.floor(Math.random() * 1000),
          status: 'active',
        })
        .select()
        .single();

      if (tenantError && !tenantError.message.includes('duplicate key')) {
        throw tenantError;
      }

      // Create Profile
      const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: user.id,
        first_name: invitation.full_name.split(' ')[0],
        last_name: invitation.full_name.split(' ').slice(1).join(' ') || '',
        email: user.email,
        tenant_id: invitation.tenant_id,
        role: 'tenant_admin',
        status: 'active',
      });

      if (profileError && !profileError.message.includes('duplicate key')) {
        throw profileError;
      }

      // 6. Mark Invitation as Accepted
      await supabaseAdmin
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          user_id: user.id, // Link the user ID here
        })
        .eq('id', invitation.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
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
