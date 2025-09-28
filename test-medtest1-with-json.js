#!/usr/bin/env node

import { Client } from 'pg';
import fs from 'fs';

// Charger la configuration depuis le fichier JSON
const config = JSON.parse(fs.readFileSync('./db-config.json', 'utf8'));

async function testMedtest1Confirmation() {
  const client = new Client({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.username,
    password: config.database.password,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔗 Connexion à la base de données établie');

    // 1. Vérifier l'état initial
    console.log('\n=== 1. ÉTAT INITIAL ===');
    const userQuery = `
      SELECT id, email, email_confirmed_at, created_at, raw_user_meta_data
      FROM auth.users 
      WHERE email = $1
    `;
    const userResult = await client.query(userQuery, [config.test_user.email]);
    console.log('Utilisateur:', userResult.rows[0] || 'NON TROUVÉ');

    // 2. Vérifier l'invitation
    console.log('\n=== 2. INVITATION ===');
    const invitationQuery = `
      SELECT id, email, full_name, tenant_id, invitation_type, status, expires_at
      FROM public.invitations 
      WHERE email = $1
    `;
    const invitationResult = await client.query(invitationQuery, [config.test_user.email]);
    console.log('Invitation:', invitationResult.rows[0] || 'NON TROUVÉE');

    // 3. Vérifier les triggers existants
    console.log('\n=== 3. TRIGGERS ===');
    const triggerQuery = `
      SELECT trigger_name, event_manipulation, event_object_table, action_timing
      FROM information_schema.triggers 
      WHERE event_object_schema = 'auth' 
        AND event_object_table = 'users'
      ORDER BY trigger_name
    `;
    const triggerResult = await client.query(triggerQuery);
    console.log('Triggers:', triggerResult.rows);

    // 4. Simuler la confirmation d'email
    console.log('\n=== 4. SIMULATION CONFIRMATION ===');
    const confirmQuery = `
      UPDATE auth.users 
      SET email_confirmed_at = COALESCE(email_confirmed_at, now())
      WHERE email = $1
      RETURNING id, email, email_confirmed_at
    `;
    const confirmResult = await client.query(confirmQuery, [config.test_user.email]);
    console.log('Confirmation:', confirmResult.rows[0]);

    // 5. Attendre que le trigger s'exécute
    console.log('\n⏳ Attente de 3 secondes pour le trigger...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 6. Vérifier les résultats
    console.log('\n=== 5. RÉSULTATS APRÈS TRIGGER ===');
    
    // Profil
    const profileQuery = `
      SELECT id, email, full_name, tenant_id, role, created_at
      FROM public.profiles 
      WHERE email = $1
    `;
    const profileResult = await client.query(profileQuery, [config.test_user.email]);
    console.log('Profil créé:', profileResult.rows.length > 0 ? '✅ OUI' : '❌ NON');
    if (profileResult.rows.length > 0) {
      console.log('Détails profil:', profileResult.rows[0]);
    }

    // Employé
    const employeeQuery = `
      SELECT id, employee_id, email, full_name, tenant_id, created_at
      FROM public.employees 
      WHERE email = $1
    `;
    const employeeResult = await client.query(employeeQuery, [config.test_user.email]);
    console.log('Employé créé:', employeeResult.rows.length > 0 ? '✅ OUI' : '❌ NON');
    if (employeeResult.rows.length > 0) {
      console.log('Détails employé:', employeeResult.rows[0]);
    }

    // Invitation mise à jour
    const updatedInvitationResult = await client.query(invitationQuery, [config.test_user.email]);
    const invitation = updatedInvitationResult.rows[0];
    console.log('Invitation acceptée:', invitation?.status === 'accepted' ? '✅ OUI' : '❌ NON');
    if (invitation) {
      console.log('Statut invitation:', invitation.status);
    }

    // Rôles
    const rolesQuery = `
      SELECT ur.id, r.name as role_name, r.description, ur.created_at
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      JOIN auth.users u ON u.id = ur.user_id
      WHERE u.email = $1
    `;
    const rolesResult = await client.query(rolesQuery, [config.test_user.email]);
    console.log('Rôles créés:', rolesResult.rows.length > 0 ? '✅ OUI' : '❌ NON');
    if (rolesResult.rows.length > 0) {
      console.log('Rôles:', rolesResult.rows);
    }

    // 7. Résumé final
    console.log('\n=== 6. RÉSUMÉ FINAL ===');
    const success = {
      profil: profileResult.rows.length > 0,
      employee: employeeResult.rows.length > 0,
      invitation: invitation?.status === 'accepted',
      roles: rolesResult.rows.length > 0
    };

    console.log('✅ Succès:', Object.values(success).filter(Boolean).length, '/ 4');
    console.log('❌ Échecs:', Object.values(success).filter(v => !v).length, '/ 4');

    if (Object.values(success).every(Boolean)) {
      console.log('🎉 TRIGGER FONCTIONNE PARFAITEMENT !');
    } else {
      console.log('⚠️  TRIGGER INCOMPLET - Vérifier la configuration');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécuter le test
testMedtest1Confirmation().catch(error => {
  console.error('❌ Erreur fatale:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
});
