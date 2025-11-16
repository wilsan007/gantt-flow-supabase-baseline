import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Lire .env manuellement
const envContent = readFileSync('.env', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?([^"]+)"?$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Test Connexion Supabase\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : 'MANQUANTE');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Variables manquantes!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test 1: Connexion
console.log('📊 Test 1: Connexion...');
const { data: session, error: sessionError } = await supabase.auth.getSession();
if (sessionError) {
  console.log('❌ Erreur:', sessionError.message);
} else {
  console.log('✅ Connexion OK');
}

// Test 2: Accès DB
console.log('\n📊 Test 2: Accès base de données...');
const { data, error } = await supabase.from('profiles').select('count').limit(1);
if (error) {
  console.log('❌ Erreur DB:', error.message);
  console.log('   Code:', error.code);
  console.log('   Details:', error.details);
} else {
  console.log('✅ Accès DB OK');
}

console.log('\n✅ Tests terminés\n');
