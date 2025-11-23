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
    console.log('🚀 Edge Function: handle-email-confirmation (REWRITTEN) started');

    // 1. Init Supabase Admin Client
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

    // 2. Parse Webhook Payload
    const payload = await req.json();
    console.log('📦 Payload received type:', payload.type);

    // Only process UPDATE events on auth.users
    if (payload.type !== 'UPDATE' || payload.table !== 'users' || payload.schema !== 'auth') {
      console.log('⏭️ Ignoring non-UPDATE event or wrong table');
      return new Response(JSON.stringify({ message: 'Ignored' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newUser = payload.record;
    const oldUser = payload.old_record;

    // 3. Check if email was just confirmed
    const wasConfirmed = !oldUser.email_confirmed_at && newUser.email_confirmed_at;

    if (!wasConfirmed) {
      console.log('⏭️ Email not confirmed in this update (or already confirmed)');
      return new Response(JSON.stringify({ message: 'Ignored: Not a confirmation event' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Email confirmation detected for user: ${newUser.id} (${newUser.email})`);

    // 4. Check Invitation Type & Dispatch
    const metadata = newUser.raw_user_meta_data || {};

    // A. Dispatch to Collaborator Handler
    if (metadata.invitation_type === 'collaborator') {
      console.log('🔀 Dispatching to handle-collaborator-confirmation...');

      // Construct URL for the other function
      // We assume they are in the same project, so we can use the same base URL logic or env vars
      const projectUrl = Deno.env.get('SUPABASE_URL');
      // Extract project ref from URL (e.g. https://xyz.supabase.co -> xyz)
      // Or just append /functions/v1/handle-collaborator-confirmation if it's the standard structure

      // Robust way: Use the same host as the current request if possible, or build from SUPABASE_URL
      const targetUrl = `${projectUrl}/functions/v1/handle-collaborator-confirmation`;

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.get('Authorization') || '', // Pass through the key
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('✅ Collaborator handler response:', response.status, result);

      return new Response(JSON.stringify(result), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // B. Handle Tenant Owner (Default Logic)
    if (metadata.invitation_type !== 'tenant_owner') {
      console.log('⏭️ Unknown invitation type:', metadata.invitation_type);
      return new Response(JSON.stringify({ message: 'Ignored: Unknown type' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Create Tenant and Profile
    console.log('🏗️ Creating Tenant and Profile...');
    const tenantId = metadata.tenant_id;
    const fullName = metadata.full_name;
    const companyName = metadata.company_name || `${fullName}'s Company`;

    // Create Tenant
    const { error: tenantError } = await supabaseAdmin.from('tenants').insert({
      id: tenantId,
      name: companyName,
      slug:
        companyName.toLowerCase().replace(/[^a-z0-9]/g, '-') +
        '-' +
        Math.floor(Math.random() * 1000),
      status: 'active',
    });

    if (tenantError) {
      console.error('❌ Error creating tenant:', tenantError);
      // If tenant already exists (idempotency), we might want to continue or fail.
      // For now, let's log and try to continue to profile creation if it's a duplicate key error
      if (!tenantError.message.includes('duplicate key')) {
        throw tenantError;
      }
      console.log('⚠️ Tenant might already exist, continuing...');
    } else {
      console.log('✅ Tenant created');
    }

    // Create Profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: newUser.id,
      first_name: fullName.split(' ')[0],
      last_name: fullName.split(' ').slice(1).join(' ') || '',
      email: newUser.email,
      tenant_id: tenantId,
      role: 'tenant_admin', // Assign role directly
      status: 'active',
    });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      if (!profileError.message.includes('duplicate key')) {
        throw profileError;
      }
      console.log('⚠️ Profile might already exist');
    } else {
      console.log('✅ Profile created');
    }

    // 6. Assign Role in user_roles (if you have a separate roles table)
    // Assuming 'profiles' table handles the role as per schema seen in previous contexts,
    // but if there is a separate user_roles table or RBAC system, add it here.
    // Based on previous context, roles seem to be in profiles or a separate system.
    // Let's assume profiles.role is the main one for now, or add to user_roles if it exists.

    // Check if user_roles table exists and insert if needed
    // (Skipping for now to keep it simple and robust based on profile role)

    console.log('🎉 Onboarding completed successfully');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('🚨 Unhandled error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
