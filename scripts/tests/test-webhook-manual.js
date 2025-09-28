import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testWebhookManual() {
  console.log('🧪 TEST MANUEL DU WEBHOOK');
  console.log('========================');
  
  try {
    // 1. Créer une invitation de test
    console.log('\n1️⃣ Création invitation de test...');
    
    const testEmail = `test-webhook-${Date.now()}@example.com`;
    const testTenantId = crypto.randomUUID();
    
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email: testEmail,
        full_name: 'Test Webhook User',
        tenant_id: testTenantId,
        invitation_type: 'tenant_owner',
        status: 'pending',
        token: crypto.randomUUID().replace(/-/g, ''),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        invited_by: '5c5731ce-75d0-4455-8184-bc42c626cb17',
        metadata: {
          company_name: 'Test Company Webhook'
        }
      })
      .select()
      .single();
    
    if (invitationError) {
      console.error('❌ Erreur création invitation:', invitationError);
      return;
    }
    
    console.log('✅ Invitation créée:', invitation.id);
    
    // 2. Créer un utilisateur de test
    console.log('\n2️⃣ Création utilisateur de test...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true, // Email déjà confirmé
      user_metadata: {
        full_name: 'Test Webhook User'
      }
    });
    
    if (authError) {
      console.error('❌ Erreur création utilisateur:', authError);
      return;
    }
    
    console.log('✅ Utilisateur créé:', authUser.user.id);
    console.log('   Email confirmé:', authUser.user.email_confirmed_at ? 'OUI' : 'NON');
    
    // 3. Déclencher manuellement le webhook
    console.log('\n3️⃣ Déclenchement manuel du webhook...');
    
    const webhookPayload = {
      type: 'UPDATE',
      table: 'users',
      schema: 'auth',
      record: {
        id: authUser.user.id,
        email: testEmail,
        email_confirmed_at: authUser.user.email_confirmed_at,
        created_at: authUser.user.created_at
      },
      old_record: {
        id: authUser.user.id,
        email: testEmail,
        email_confirmed_at: null, // Simule qu'il n'était pas confirmé avant
        created_at: authUser.user.created_at
      }
    };
    
    const webhookResponse = await fetch('https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify(webhookPayload)
    });
    
    const webhookResult = await webhookResponse.json();
    console.log('📥 Réponse webhook:', webhookResult);
    
    if (webhookResponse.ok && webhookResult.success) {
      console.log('✅ Webhook exécuté avec succès !');
      
      // 4. Vérifier que tout a été créé
      console.log('\n4️⃣ Vérification des données créées...');
      
      // Vérifier le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.user.id)
        .single();
      
      console.log('👤 Profil:', profile ? '✅ CRÉÉ' : '❌ MANQUANT');
      if (profile) {
        console.log(`   Tenant ID: ${profile.tenant_id}`);
        console.log(`   Role: ${profile.role}`);
      }
      
      // Vérifier l'employé
      const { data: employee } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', authUser.user.id)
        .single();
      
      console.log('👨‍💼 Employé:', employee ? '✅ CRÉÉ' : '❌ MANQUANT');
      if (employee) {
        console.log(`   Employee ID: ${employee.employee_id}`);
      }
      
      // Vérifier les rôles
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('*, roles(name)')
        .eq('user_id', authUser.user.id);
      
      console.log('🔐 Rôles:', userRoles?.length || 0);
      userRoles?.forEach(role => {
        console.log(`   - ${role.roles.name}`);
      });
      
    } else {
      console.error('❌ Webhook échoué:', webhookResult);
    }
    
    // 5. Nettoyage
    console.log('\n5️⃣ Nettoyage...');
    
    // Supprimer l'utilisateur de test
    await supabase.auth.admin.deleteUser(authUser.user.id);
    
    // Supprimer l'invitation
    await supabase.from('invitations').delete().eq('id', invitation.id);
    
    console.log('✅ Nettoyage terminé');
    
  } catch (err) {
    console.error('💥 Erreur test:', err);
  }
}

testWebhookManual();
