import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. AUTH & PERMISSIONS
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non connecté' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user: caller },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Session expirée' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify caller has permission (HR or Admin)
    // For simplicity, we check if they have a tenant_id.
    // Ideally, check for specific role 'manager_hr' or 'tenant_admin'.
    const { data: tenantId } = await supabaseClient.rpc('get_user_tenant_id', {
      user_uuid: caller.id,
    });

    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'Aucune entreprise associée' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. PARSE INPUT
    const { employees } = await req.json();

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucune donnée fournie' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as any[],
    };

    // 3. PROCESS EMPLOYEES
    for (const emp of employees) {
      const { email, fullName, roleId, department, jobTitle, phone, hireDate, salary } = emp;

      if (!email || !fullName) {
        results.failed++;
        results.errors.push({ email, error: 'Email ou Nom manquant' });
        continue;
      }

      try {
        // A. Create Auth User
        // Check if user exists first to avoid error or handle update
        const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === email.toLowerCase());

        let targetUserId = existingUser?.id;
        let isNewUser = false;
        let tempPassword = '';

        if (!targetUserId) {
          tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
          const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true, // Auto-confirm for immediate access
            user_metadata: {
              full_name: fullName,
              tenant_id: tenantId,
            },
          });

          if (createError) throw createError;
          targetUserId = newUser.user.id;
          isNewUser = true;
        }

        // B. Create/Update Profile
        const { error: profileError } = await supabaseClient.from('profiles').upsert(
          {
            id: targetUserId,
            user_id: targetUserId,
            email: email,
            full_name: fullName,
            tenant_id: tenantId,
            role: 'employee', // Default role string for profiles table
            phone: phone || null,
            job_title: jobTitle || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (profileError) throw new Error(`Profile Error: ${profileError.message}`);

        // C. Create/Update Employee Record
        const { error: employeeError } = await supabaseClient.from('employees').upsert(
          {
            user_id: targetUserId,
            tenant_id: tenantId,
            full_name: fullName, // Required field
            email: email, // Required field
            department_id: department || null,
            job_title: jobTitle || null,
            phone: phone || null,
            hire_date: hireDate || null,
            salary: salary ? parseFloat(salary) : null,
            status: 'active',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (employeeError) throw new Error(`Employee Error: ${employeeError.message}`);

        // D. Assign Role
        // Use roleId directly or default to employee role ID
        const DEFAULT_EMPLOYEE_ROLE_ID = '3733965a-d485-4cdc-87a4-ae8f5abc5cd9';
        const finalRoleId = roleId || DEFAULT_EMPLOYEE_ROLE_ID;

        // Check if role assignment exists
        const { data: existingRole } = await supabaseClient
          .from('user_roles')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('tenant_id', tenantId)
          .single();

        if (!existingRole) {
          const { error: roleError } = await supabaseClient.from('user_roles').insert({
            user_id: targetUserId,
            role_id: finalRoleId,
            tenant_id: tenantId,
            context_type: 'tenant',
            context_id: tenantId,
            is_active: true,
          });
          if (roleError) throw new Error(`Role Error: ${roleError.message}`);
        }

        // E. Send Email with Credentials
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (resendApiKey) {
          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Wadashaqayn <onboarding@wadashaqayn.org>',
              to: [email],
              subject: 'Bienvenue chez Wadashaqayn - Vos identifiants',
              html: `
                                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                                    <h2>Bienvenue ${fullName} !</h2>
                                    <p>Votre compte employé a été créé avec succès.</p>
                                    <p>Voici vos identifiants de connexion :</p>
                                    <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                        <p style="margin: 5px 0;"><strong>Email :</strong> ${email}</p>
                                        <p style="margin: 5px 0;"><strong>Mot de passe temporaire :</strong> ${isNewUser ? tempPassword : '(Votre mot de passe existant)'}</p>
                                    </div>
                                    ${isNewUser ? '<p>Nous vous recommandons de changer votre mot de passe dès votre première connexion.</p>' : ''}
                                    <a href="${Deno.env.get('SITE_URL') ?? 'https://wadashaqayn.org'}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Se connecter</a>
                                </div>
                            `,
            }),
          });

          if (!emailRes.ok) {
            console.error(`Failed to send email to ${email}:`, await emailRes.text());
            // We don't fail the import if email fails, but we log it.
            results.errors.push({ email, error: "Compte créé mais échec de l'envoi d'email" });
          }
        }

        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push({ email, error: err.message });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
