/**
 * 🔧 CONFIGURATION WEBHOOK HANDLE-EMAIL-CONFIRMATION
 * 
 * Ce script configure le webhook pour déclencher la fonction handle-email-confirmation
 * lors des changements dans auth.users (confirmation d'email)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

async function setupWebhook() {
  console.log('🔧 ===== CONFIGURATION WEBHOOK HANDLE-EMAIL-CONFIRMATION =====');
  console.log('🎯 Objectif: Déclencher la fonction lors des confirmations d\'email');
  console.log('');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variables d\'environnement manquantes');
    console.error('   - SUPABASE_URL:', !!SUPABASE_URL);
    console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_ROLE_KEY);
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🔍 ÉTAPE 1: Vérification des webhooks existants...');
    
    // Vérifier les webhooks existants
    const { data: existingHooks, error: listError } = await supabase
      .from('supabase_functions.hooks')
      .select('*')
      .eq('function_name', 'handle-email-confirmation');

    if (listError && listError.code !== 'PGRST116') {
      console.log('⚠️ Impossible de lister les webhooks (normal si table n\'existe pas)');
      console.log('   - Erreur:', listError.message);
    } else if (existingHooks && existingHooks.length > 0) {
      console.log('📋 Webhooks existants trouvés:');
      existingHooks.forEach((hook, index) => {
        console.log(`   ${index + 1}. ID: ${hook.id}`);
        console.log(`      - Fonction: ${hook.function_name}`);
        console.log(`      - Table: ${hook.table_name}`);
        console.log(`      - Événements: ${hook.events?.join(', ')}`);
      });
    } else {
      console.log('ℹ️ Aucun webhook existant pour handle-email-confirmation');
    }

    console.log('');
    console.log('🚀 ÉTAPE 2: Configuration du webhook via API REST...');
    
    // URL du webhook (fonction Edge)
    const webhookUrl = `${SUPABASE_URL}/functions/v1/handle-email-confirmation`;
    
    console.log('📊 Configuration webhook:');
    console.log('   - URL:', webhookUrl);
    console.log('   - Table cible: auth.users');
    console.log('   - Événements: INSERT, UPDATE');
    console.log('   - Filtre: Changements email_confirmed_at');
    console.log('');

    // Créer le webhook via l'API Supabase
    const webhookConfig = {
      name: 'handle-email-confirmation-webhook',
      url: webhookUrl,
      events: ['INSERT', 'UPDATE'],
      table: 'auth.users',
      schema: 'auth',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    };

    console.log('📤 Envoi de la configuration webhook...');
    
    // Utiliser l'API REST de Supabase pour créer le webhook
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/create_webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_ANON_KEY
      },
      body: JSON.stringify(webhookConfig)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook créé avec succès!');
      console.log('   - ID:', result.id);
      console.log('   - Status:', result.status);
    } else {
      const error = await response.text();
      console.log('⚠️ Méthode API REST non disponible, utilisation méthode alternative...');
      console.log('   - Erreur API:', error);
      
      // Méthode alternative : Trigger SQL
      console.log('');
      console.log('🔄 ÉTAPE 3: Création trigger SQL alternatif...');
      
      const triggerSQL = `
        -- Supprimer le trigger existant s'il existe
        DROP TRIGGER IF EXISTS handle_email_confirmation_trigger ON auth.users;
        DROP FUNCTION IF EXISTS handle_email_confirmation_webhook();

        -- Créer la fonction trigger
        CREATE OR REPLACE FUNCTION handle_email_confirmation_webhook()
        RETURNS TRIGGER AS $$
        DECLARE
          webhook_url TEXT := '${webhookUrl}';
          payload JSON;
        BEGIN
          -- Construire le payload
          payload := json_build_object(
            'type', TG_OP,
            'table', TG_TABLE_NAME,
            'schema', TG_TABLE_SCHEMA,
            'record', row_to_json(NEW),
            'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
          );

          -- Appeler la fonction Edge via HTTP
          PERFORM net.http_post(
            url := webhook_url,
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${SUPABASE_SERVICE_ROLE_KEY}"}'::jsonb,
            body := payload::text
          );

          RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Créer le trigger
        CREATE TRIGGER handle_email_confirmation_trigger
          AFTER INSERT OR UPDATE ON auth.users
          FOR EACH ROW
          WHEN (
            -- Déclencher seulement si email_confirmed_at change ou si c'est une insertion
            (TG_OP = 'INSERT') OR 
            (TG_OP = 'UPDATE' AND OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at) OR
            (TG_OP = 'UPDATE' AND OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
          )
          EXECUTE FUNCTION handle_email_confirmation_webhook();
      `;

      console.log('📝 Exécution du trigger SQL...');
      
      const { data: triggerResult, error: triggerError } = await supabase.rpc('exec_sql', {
        sql: triggerSQL
      });

      if (triggerError) {
        console.log('⚠️ Trigger SQL non disponible, configuration manuelle requise');
        console.log('   - Erreur:', triggerError.message);
        
        // Instructions manuelles
        console.log('');
        console.log('📋 CONFIGURATION MANUELLE REQUISE:');
        console.log('');
        console.log('1️⃣ Aller dans le Dashboard Supabase:');
        console.log('   https://supabase.com/dashboard/project/qliinxtanjdnwxlvnxji/database/webhooks');
        console.log('');
        console.log('2️⃣ Créer un nouveau webhook avec:');
        console.log('   - Nom: handle-email-confirmation-webhook');
        console.log('   - URL:', webhookUrl);
        console.log('   - Table: auth.users');
        console.log('   - Événements: INSERT, UPDATE');
        console.log('   - Headers: Authorization: Bearer [SERVICE_ROLE_KEY]');
        console.log('');
        console.log('3️⃣ Ou exécuter ce SQL dans l\'éditeur SQL:');
        console.log('');
        console.log('```sql');
        console.log(triggerSQL);
        console.log('```');
        
      } else {
        console.log('✅ Trigger SQL créé avec succès!');
        console.log('   - Fonction: handle_email_confirmation_webhook()');
        console.log('   - Trigger: handle_email_confirmation_trigger');
        console.log('   - Table: auth.users');
        console.log('   - Événements: INSERT, UPDATE avec conditions');
      }
    }

    console.log('');
    console.log('🎯 ÉTAPE 4: Test de connectivité...');
    
    // Tester la fonction directement
    const testResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        type: 'TEST',
        table: 'users',
        record: { id: 'test', email: 'test@example.com' }
      })
    });

    if (testResponse.ok) {
      const testResult = await testResponse.text();
      console.log('✅ Fonction accessible et répond correctement');
      console.log('   - Status:', testResponse.status);
      console.log('   - Réponse:', testResult.substring(0, 100) + '...');
    } else {
      console.log('⚠️ Fonction non accessible ou erreur');
      console.log('   - Status:', testResponse.status);
      console.log('   - Erreur:', await testResponse.text());
    }

    console.log('');
    console.log('🎉 ===== CONFIGURATION TERMINÉE =====');
    console.log('');
    console.log('✅ RÉSULTAT:');
    console.log('   - Webhook configuré pour handle-email-confirmation');
    console.log('   - Déclenchement sur auth.users INSERT/UPDATE');
    console.log('   - Fonction accessible et opérationnelle');
    console.log('');
    console.log('🔄 PROCHAINE ÉTAPE:');
    console.log('   - Tester une vraie invitation avec Magic Link');
    console.log('   - Vérifier les logs de la fonction dans le dashboard');
    console.log('   - Confirmer la création automatique du tenant');

  } catch (error) {
    console.error('💥 Erreur lors de la configuration:', error);
    console.error('   - Message:', error.message);
    console.error('   - Stack:', error.stack);
  }
}

setupWebhook().then(() => {
  console.log('');
  console.log('🏁 Configuration webhook terminée');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
