#!/usr/bin/env node

import { Client } from 'pg';
import fs from 'fs';
import { config } from 'dotenv';

// Charger les variables d'environnement
config();

// Extraire les informations de connexion depuis .env
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const projectId = process.env.VITE_SUPABASE_PROJECT_ID;

// Construire l'URL de la base de données
const dbConfig = {
  host: `db.${projectId}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'bykg4k993NDF1!', // Mot de passe fourni
  ssl: { rejectUnauthorized: false }
};

const testEmail = 'medtest1@yahoo.com';

async function testTriggerWithEnv() {
  const client = new Client(dbConfig);

  try {
    console.log('🔗 Connexion à Supabase via .env...');
    console.log(`📍 Host: ${dbConfig.host}`);
    console.log(`📧 Test email: ${testEmail}`);
    
    await client.connect();
    console.log('✅ Connecté !');

    // 1. Vérifier utilisateur existant
    console.log('\n=== 1. UTILISATEUR ===');
    const userResult = await client.query(
      'SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email = $1',
      [testEmail]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Utilisateur non trouvé - créer d\'abord l\'utilisateur');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('Utilisateur trouvé:', {
      id: user.id,
      email: user.email,
      confirmed: user.email_confirmed_at ? '✅' : '❌'
    });

    // 2. Vérifier invitation
    console.log('\n=== 2. INVITATION ===');
    const invResult = await client.query(
      'SELECT id, email, status, tenant_id, invitation_type FROM public.invitations WHERE email = $1',
      [testEmail]
    );
    
    if (invResult.rows.length === 0) {
      console.log('❌ Invitation non trouvée - créer d\'abord l\'invitation');
      return;
    }
    
    const invitation = invResult.rows[0];
    console.log('Invitation trouvée:', {
      id: invitation.id,
      status: invitation.status,
      type: invitation.invitation_type,
      tenant_id: invitation.tenant_id
    });

    // 3. Vérifier triggers
    console.log('\n=== 3. TRIGGERS ===');
    const triggerResult = await client.query(`
      SELECT trigger_name, event_manipulation, action_timing
      FROM information_schema.triggers 
      WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
        AND trigger_name LIKE '%confirmation%'
    `);
    
    console.log(`Triggers trouvés: ${triggerResult.rows.length}`);
    triggerResult.rows.forEach(trigger => {
      console.log(`  - ${trigger.trigger_name} (${trigger.event_manipulation} ${trigger.action_timing})`);
    });

    if (triggerResult.rows.length === 0) {
      console.log('⚠️  Aucun trigger de confirmation - installer d\'abord le trigger');
      console.log('💡 Exécuter: psql "postgresql://postgres:bykg4k993NDF1!@db.qliinxtanjdnwxlvnxji.supabase.co:5432/postgres" -f fix-trigger-on-email-confirmation.sql');
      return;
    }

    // 4. Vérifier état avant trigger
    console.log('\n=== 4. ÉTAT AVANT TRIGGER ===');
    const beforeProfile = await client.query('SELECT COUNT(*) as count FROM public.profiles WHERE email = $1', [testEmail]);
    const beforeEmployee = await client.query('SELECT COUNT(*) as count FROM public.employees WHERE email = $1', [testEmail]);
    
    console.log(`Profil existant: ${beforeProfile.rows[0].count > 0 ? '✅' : '❌'}`);
    console.log(`Employé existant: ${beforeEmployee.rows[0].count > 0 ? '✅' : '❌'}`);

    // 5. Simuler confirmation si pas déjà confirmé
    if (!user.email_confirmed_at) {
      console.log('\n=== 5. SIMULATION CONFIRMATION ===');
      const confirmResult = await client.query(`
        UPDATE auth.users 
        SET email_confirmed_at = now()
        WHERE email = $1
        RETURNING id, email, email_confirmed_at
      `, [testEmail]);
      
      console.log('Email confirmé:', confirmResult.rows[0].email_confirmed_at);
      
      // Attendre trigger
      console.log('⏳ Attente 5 secondes pour le trigger...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log('\n=== 5. EMAIL DÉJÀ CONFIRMÉ ===');
      console.log('Email déjà confirmé, trigger déjà exécuté');
    }

    // 6. Vérifier résultats
    console.log('\n=== 6. RÉSULTATS FINAUX ===');
    
    const profileResult = await client.query(
      'SELECT id, email, full_name, tenant_id, role FROM public.profiles WHERE email = $1',
      [testEmail]
    );
    
    const employeeResult = await client.query(
      'SELECT id, employee_id, email, full_name FROM public.employees WHERE email = $1',
      [testEmail]
    );
    
    const invUpdatedResult = await client.query(
      'SELECT status, accepted_at FROM public.invitations WHERE email = $1',
      [testEmail]
    );

    const rolesResult = await client.query(`
      SELECT r.name as role_name, r.description
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      JOIN auth.users u ON u.id = ur.user_id
      WHERE u.email = $1
    `, [testEmail]);

    // Résultats
    const results = {
      profil: profileResult.rows.length > 0,
      employee: employeeResult.rows.length > 0,
      invitation: invUpdatedResult.rows[0]?.status === 'accepted',
      roles: rolesResult.rows.length > 0
    };

    console.log('📊 RÉSULTATS:');
    console.log(`  Profil créé: ${results.profil ? '✅' : '❌'}`);
    console.log(`  Employé créé: ${results.employee ? '✅' : '❌'}`);
    console.log(`  Invitation acceptée: ${results.invitation ? '✅' : '❌'}`);
    console.log(`  Rôles créés: ${results.roles ? '✅' : '❌'}`);

    // Score final
    const score = Object.values(results).filter(Boolean).length;
    console.log(`\n🎯 Score: ${score}/4`);
    
    if (score === 4) {
      console.log('🎉 TRIGGER FONCTIONNE PARFAITEMENT !');
    } else if (score > 0) {
      console.log('⚠️  TRIGGER PARTIELLEMENT FONCTIONNEL');
    } else {
      console.log('❌ TRIGGER NE FONCTIONNE PAS');
    }

    // Détails si créés
    if (results.profil) {
      console.log('\n📋 Détails profil:', profileResult.rows[0]);
    }
    if (results.employee) {
      console.log('👤 Détails employé:', employeeResult.rows[0]);
    }
    if (results.roles) {
      console.log('🔐 Rôles:', rolesResult.rows);
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code) console.error('Code:', error.code);
    if (error.stack) console.error('Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
  } finally {
    await client.end();
    console.log('\n🔌 Déconnecté');
  }
}

testTriggerWithEnv().catch(console.error);
