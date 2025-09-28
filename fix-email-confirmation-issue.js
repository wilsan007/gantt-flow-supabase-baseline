#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, serviceKey);

async function fixEmailConfirmation() {
  console.log('🔧 CORRECTION DES PROBLÈMES DE CONFIRMATION EMAIL\n');

  try {
    // 1. Lister les utilisateurs non confirmés
    const { data: users } = await supabase.auth.admin.listUsers();
    const unconfirmed = users.users.filter(u => !u.email_confirmed_at);
    
    console.log(`📊 Utilisateurs non confirmés: ${unconfirmed.length}`);
    
    for (const user of unconfirmed) {
      console.log(`\n👤 ${user.email} (ID: ${user.id})`);
      
      // Vérifier invitation
      const { data: invitation } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (invitation) {
        console.log(`✅ Invitation: ${invitation.status} (${invitation.invitation_type})`);
        
        // Confirmer l'email automatiquement
        const { error: confirmError } = await supabase.auth.admin.updateUserById(
          user.id,
          { email_confirm: true }
        );
        
        if (confirmError) {
          console.log(`❌ Erreur confirmation: ${confirmError.message}`);
        } else {
          console.log(`✅ Email confirmé avec succès`);
          
          // Attendre le trigger
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Vérifier si le profil a été créé
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          console.log(`📋 Profil créé: ${profile ? 'OUI' : 'NON'}`);
        }
      } else {
        console.log(`❌ Pas d'invitation trouvée`);
      }
    }
    
    console.log('\n🎯 CORRECTION TERMINÉE');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

fixEmailConfirmation();
