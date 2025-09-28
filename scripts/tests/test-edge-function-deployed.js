#!/usr/bin/env node

/**
 * Test de l'Edge Function déployée
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, serviceKey);

async function testDeployedEdgeFunction() {
  console.log('🧪 TEST DE L\'EDGE FUNCTION DÉPLOYÉE');
  console.log('=' .repeat(50));

  try {
    // 1. Test simple de l'Edge Function
    console.log('\n📡 1. Test de connectivité...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/handle-email-confirmation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceKey
      },
      body: JSON.stringify({
        type: 'TEST',
        table: 'users',
        schema: 'auth',
        record: { test: true }
      })
    });

    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Edge Function accessible');
      console.log('📋 Réponse:', result);
    } else {
      const error = await response.text();
      console.log('⚠️ Réponse:', error);
    }

    // 2. Tester avec un utilisateur existant
    console.log('\n👤 2. Test avec utilisateur existant...');
    
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users.users.find(u => u.email && !u.email_confirmed_at);
    
    if (testUser) {
      console.log(`📧 Utilisateur de test: ${testUser.email}`);
      
      // Vérifier s'il a une invitation
      const { data: invitation } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', testUser.email)
        .eq('invitation_type', 'tenant_owner')
        .single();
      
      if (invitation) {
        console.log('✅ Invitation trouvée:', invitation.status);
        
        // Tester l'Edge Function avec cet utilisateur
        const testResponse = await fetch(`${supabaseUrl}/functions/v1/handle-email-confirmation`, {
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

        const testResult = await testResponse.json();
        console.log('📊 Résultat test:', testResult);
        
        if (testResult.success) {
          console.log('🎉 Edge Function fonctionne parfaitement !');
        } else {
          console.log('⚠️ Edge Function a des problèmes:', testResult.error);
        }
      } else {
        console.log('❌ Pas d\'invitation tenant_owner pour ce test');
      }
    } else {
      console.log('❌ Aucun utilisateur non confirmé trouvé pour le test');
    }

    console.log('\n✅ Test terminé');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testDeployedEdgeFunction();
