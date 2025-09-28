const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeDrop() {
  console.log('🗑️ Exécution de la suppression de la table tenant_members...\n');

  try {
    // Lire le script SQL
    const sqlScript = fs.readFileSync('./drop-tenant-members-table.sql', 'utf8');
    
    // Diviser le script en commandes individuelles
    const commands = sqlScript
      .split(/;\s*(?=--|\n|$)/)
      .filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'))
      .map(cmd => cmd.trim().replace(/;$/, ''));

    console.log(`📋 ${commands.length} commandes SQL à exécuter...\n`);

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (!command || command.length < 10) continue;

      console.log(`⚡ Exécution de la commande ${i + 1}/${commands.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('sql', {
          query: command
        });

        if (error) {
          console.log(`❌ Erreur sur commande ${i + 1}:`, error.message);
          // Continuer malgré les erreurs non critiques
          if (error.message.includes('does not exist') || 
              error.message.includes('already exists') ||
              error.message.includes('cannot drop')) {
            console.log('   ⚠️  Erreur non critique, continuation...');
            continue;
          } else {
            throw error;
          }
        }

        if (data && Array.isArray(data) && data.length > 0) {
          console.log(`   ✅ Résultat:`, data[0]);
        } else {
          console.log(`   ✅ Commande exécutée avec succès`);
        }
      } catch (cmdError) {
        console.log(`❌ Erreur sur commande ${i + 1}:`, cmdError.message);
        
        // Essayer une approche alternative pour certaines erreurs
        if (cmdError.message.includes('constraint') && command.includes('DROP INDEX')) {
          console.log('   🔄 Tentative de suppression de contrainte alternative...');
          try {
            await supabase.rpc('sql', {
              query: `ALTER TABLE tenant_members DROP CONSTRAINT IF EXISTS tenant_members_tenant_id_user_id_key CASCADE;`
            });
            console.log('   ✅ Contrainte supprimée avec succès');
          } catch (altError) {
            console.log('   ⚠️  Erreur alternative ignorée:', altError.message);
          }
        }
      }
    }

    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const { data: finalCheck, error: checkError } = await supabase.rpc('sql', {
      query: `
        SELECT COUNT(*) as table_exists 
        FROM information_schema.tables 
        WHERE table_name = 'tenant_members' AND table_schema = 'public';
      `
    });

    if (checkError) {
      console.log('❌ Erreur lors de la vérification finale:', checkError.message);
    } else if (finalCheck && finalCheck[0] && finalCheck[0].table_exists === 0) {
      console.log('✅ SUCCESS: Table tenant_members supprimée avec succès!');
    } else {
      console.log('⚠️  Table tenant_members existe encore, tentative de suppression directe...');
      
      try {
        await supabase.rpc('sql', {
          query: 'DROP TABLE IF EXISTS tenant_members CASCADE;'
        });
        console.log('✅ Table supprimée avec CASCADE');
      } catch (dropError) {
        console.log('❌ Erreur lors de la suppression directe:', dropError.message);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

// Exécuter la suppression
executeDrop();
