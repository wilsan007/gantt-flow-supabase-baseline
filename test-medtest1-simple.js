#!/usr/bin/env node

import { Client } from 'pg';
import fs from 'fs';

// Configuration directe pour éviter les problèmes IPv6
const config = {
  host: 'db.qliinxtanjdnwxlvnxji.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'bykg4k993NDF1!',
  ssl: { rejectUnauthorized: false },
  // Forcer IPv4
  family: 4
};

const testEmail = 'medtest1@yahoo.com';

async function testTrigger() {
  const client = new Client(config);

  try {
    console.log('🔗 Connexion à Supabase...');
    await client.connect();
    console.log('✅ Connecté !');

    // 1. Vérifier utilisateur
    console.log('\n=== UTILISATEUR ===');
    const userResult = await client.query(
      'SELECT id, email, email_confirmed_at FROM auth.users WHERE email = $1',
      [testEmail]
    );
    console.log('Utilisateur:', userResult.rows[0] || 'NON TROUVÉ');

    // 2. Vérifier invitation
    console.log('\n=== INVITATION ===');
    const invResult = await client.query(
      'SELECT id, email, status, tenant_id FROM public.invitations WHERE email = $1',
      [testEmail]
    );
    console.log('Invitation:', invResult.rows[0] || 'NON TROUVÉE');

    // 3. Vérifier triggers
    console.log('\n=== TRIGGERS ===');
    const triggerResult = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers 
      WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
        AND trigger_name LIKE '%confirmation%'
    `);
    console.log('Triggers confirmation:', triggerResult.rows);

    // 4. Installer le trigger si nécessaire
    if (triggerResult.rows.length === 0) {
      console.log('\n⚠️  Aucun trigger de confirmation trouvé');
      console.log('📝 Vous devez d\'abord exécuter: \\i fix-trigger-on-email-confirmation.sql');
      return;
    }

    // 5. Simuler confirmation
    console.log('\n=== SIMULATION CONFIRMATION ===');
    const confirmResult = await client.query(`
      UPDATE auth.users 
      SET email_confirmed_at = COALESCE(email_confirmed_at, now())
      WHERE email = $1
      RETURNING id, email, email_confirmed_at
    `, [testEmail]);
    
    if (confirmResult.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé pour confirmation');
      return;
    }
    
    console.log('Confirmation:', confirmResult.rows[0]);

    // 6. Attendre trigger
    console.log('\n⏳ Attente 5 secondes...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 7. Vérifier résultats
    console.log('\n=== RÉSULTATS ===');
    
    const profileResult = await client.query(
      'SELECT id, email, full_name, tenant_id FROM public.profiles WHERE email = $1',
      [testEmail]
    );
    
    const employeeResult = await client.query(
      'SELECT id, employee_id, email FROM public.employees WHERE email = $1',
      [testEmail]
    );
    
    const invUpdatedResult = await client.query(
      'SELECT status, accepted_at FROM public.invitations WHERE email = $1',
      [testEmail]
    );

    console.log('Profil créé:', profileResult.rows.length > 0 ? '✅ OUI' : '❌ NON');
    console.log('Employé créé:', employeeResult.rows.length > 0 ? '✅ OUI' : '❌ NON');
    console.log('Invitation acceptée:', invUpdatedResult.rows[0]?.status === 'accepted' ? '✅ OUI' : '❌ NON');

    // 8. Résumé
    const success = [
      profileResult.rows.length > 0,
      employeeResult.rows.length > 0,
      invUpdatedResult.rows[0]?.status === 'accepted'
    ].filter(Boolean).length;

    console.log(`\n📊 Score: ${success}/3`);
    
    if (success === 3) {
      console.log('🎉 TRIGGER FONCTIONNE PARFAITEMENT !');
    } else {
      console.log('⚠️  TRIGGER INCOMPLET');
      if (profileResult.rows.length > 0) console.log('  ✅ Profil OK');
      if (employeeResult.rows.length > 0) console.log('  ✅ Employé OK');
      if (invUpdatedResult.rows[0]?.status === 'accepted') console.log('  ✅ Invitation OK');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code) console.error('Code:', error.code);
  } finally {
    await client.end();
    console.log('\n🔌 Déconnecté');
  }
}

testTrigger().catch(console.error);
