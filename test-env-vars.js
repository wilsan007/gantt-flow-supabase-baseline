/**
 * 🧪 TEST VARIABLES D'ENVIRONNEMENT
 */

import { config } from 'dotenv';

config();

console.log('🔍 ===== TEST VARIABLES D\'ENVIRONNEMENT =====');
console.log('');

// Tester toutes les variations possibles
const variations = [
  'SUPABASE_PROJECT_ID',
  'SUPABASE_ANON_KEY', 
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'APP_URL',
  'VITE_SUPABASE_PROJECT_ID',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SUPABASE_URL', 
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'VITE_APP_URL'
];

console.log('📊 Variables trouvées:');
variations.forEach(varName => {
  const value = process.env[varName];
  console.log(`   - ${varName}: ${value ? 'TROUVÉE (' + value.substring(0, 20) + '...)' : 'MANQUANTE'}`);
});

console.log('');
console.log('🎯 Variables recommandées pour le test:');

// Identifier les bonnes variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('   - URL:', supabaseUrl ? 'TROUVÉE' : 'MANQUANTE');
console.log('   - ANON KEY:', supabaseAnonKey ? 'TROUVÉE' : 'MANQUANTE');
console.log('   - SERVICE KEY:', supabaseServiceKey ? 'TROUVÉE' : 'MANQUANTE');

if (supabaseUrl && supabaseAnonKey && supabaseServiceKey) {
  console.log('');
  console.log('✅ Toutes les variables nécessaires sont présentes !');
  console.log('🚀 Le test peut être lancé');
} else {
  console.log('');
  console.log('❌ Variables manquantes pour le test');
}
