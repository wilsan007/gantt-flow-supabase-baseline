#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';
const supabase = createClient(supabaseUrl, serviceKey);

const TEST_EMAIL = 'test0071@yahoo.com';

async function debugWebhookTrigger() {
  console.log('🔍 DEBUG WEBHOOK/TRIGGER SYSTÈME');
  console.log('=' .repeat(50));

  try {
    // 1. Vérifier l'utilisateur
    console.log('\n👤 1. VÉRIFICATION UTILISATEUR...');
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find(u => u.email === TEST_EMAIL);
    
    if (!testUser) {
      console.log('❌ Utilisateur non trouvé');
      return;
    }

    console.log(`✅ Utilisateur: ${testUser.id}`);
    console.log(`📧 Email confirmé: ${testUser.email_confirmed_at ? 'OUI' : 'NON'}`);

    // 2. Vérifier les webhooks configurés
    console.log('\n🔗 2. VÉRIFICATION WEBHOOKS...');
    
    // Note: On ne peut pas lister les webhooks via l'API, mais on peut vérifier s'ils existent
    console.log('⚠️ Les webhooks doivent être vérifiés manuellement dans Supabase Dashboard');
    console.log('📍 Aller à: Database > Webhooks');
    console.log('🎯 Rechercher: webhook sur auth.users avec événement UPDATE');

    // 3. Vérifier les triggers SQL
    console.log('\n🎯 3. VÉRIFICATION TRIGGERS SQL...');
    
    const checkTriggersQuery = `
      SELECT 
        trigger_name,
        event_manipulation,
        action_timing,
        action_statement
      FROM information_schema.triggers 
      WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
        AND trigger_name LIKE '%email%';
    `;

    try {
      const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
        sql: checkTriggersQuery
      });

      if (triggerError) {
        console.log('❌ Erreur vérification triggers:', triggerError);
      } else if (triggers && triggers.length > 0) {
        console.log('✅ Triggers trouvés:');
        triggers.forEach(trigger => {
          console.log(`   - ${trigger.trigger_name}: ${trigger.event_manipulation} ${trigger.action_timing}`);
        });
      } else {
        console.log('❌ Aucun trigger email trouvé sur auth.users');
      }
    } catch (e) {
      console.log('⚠️ Impossible de vérifier les triggers via SQL');
    }

    // 4. Test manuel de confirmation email
    console.log('\n🔐 4. TEST CONFIRMATION EMAIL MANUELLE...');
    
    if (!testUser.email_confirmed_at) {
      console.log('📧 Confirmation de l\'email...');
      
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        testUser.id,
        { email_confirm: true }
      );

      if (updateError) {
        console.log('❌ Erreur confirmation:', updateError);
      } else {
        console.log('✅ Email confirmé avec succès');
        console.log('⏳ Attente 10 secondes pour voir si l\'Edge Function se déclenche...');
        
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Vérifier si quelque chose a été créé
        const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', testUser.id).single();
        const { data: employee } = await supabase.from('employees').select('*').eq('user_id', testUser.id).single();
        
        console.log(`👤 Profil créé: ${profile ? 'OUI' : 'NON'}`);
        console.log(`👨‍💼 Employé créé: ${employee ? 'OUI' : 'NON'}`);
        
        if (!profile && !employee) {
          console.log('❌ PROBLÈME: L\'Edge Function ne s\'est pas déclenchée automatiquement');
          console.log('🔧 Solutions possibles:');
          console.log('   1. Le webhook n\'est pas configuré');
          console.log('   2. Le trigger SQL n\'existe pas');
          console.log('   3. L\'URL du webhook est incorrecte');
          console.log('   4. Les permissions sont insuffisantes');
        }
      }
    } else {
      console.log('ℹ️ Email déjà confirmé');
    }

    // 5. Test direct de l'Edge Function
    console.log('\n🚀 5. TEST DIRECT EDGE FUNCTION...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/handle-email-confirmation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({
        type: 'UPDATE',
        table: 'users',
        schema: 'auth',
        record: {
          id: testUser.id,
          email: testUser.email,
          email_confirmed_at: new Date().toISOString()
        },
        old_record: {
          id: testUser.id,
          email: testUser.email,
          email_confirmed_at: null
        }
      })
    });

    const result = await response.json();
    console.log('📊 Résultat Edge Function:', result);

    if (result.success) {
      console.log('✅ Edge Function fonctionne correctement en direct');
      console.log('❌ PROBLÈME IDENTIFIÉ: Le déclenchement automatique ne fonctionne pas');
    } else {
      console.log('❌ Edge Function a des erreurs:', result.error);
    }

    // 6. Diagnostic final
    console.log('\n📋 6. DIAGNOSTIC FINAL...');
    console.log('─'.repeat(50));
    
    console.log('🔍 PROBLÈMES IDENTIFIÉS:');
    console.log('1. ❌ L\'Edge Function n\'est pas appelée automatiquement');
    console.log('2. ⚠️ Le webhook ou trigger ne fonctionne pas');
    console.log('3. 🔧 Configuration manquante dans Supabase Dashboard');
    
    console.log('\n🛠️ ACTIONS REQUISES:');
    console.log('1. 📍 Vérifier Database > Webhooks dans Supabase Dashboard');
    console.log('2. 🎯 Créer un webhook sur auth.users pour événement UPDATE');
    console.log('3. 🔗 URL webhook: https://qliinxtanjdnwxlvnxji.supabase.co/functions/v1/handle-email-confirmation');
    console.log('4. ⚡ Condition: email_confirmed_at IS NOT NULL');

  } catch (error) {
    console.error('💥 Erreur:', error);
  }
}

debugWebhookTrigger();
