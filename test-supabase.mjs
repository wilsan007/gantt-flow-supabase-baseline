import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'votre-anon-key';

console.log('🔍 Test Connexion Supabase\n');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test 1: Connexion
console.log('\n📊 Test 1: Connexion...');
const { data: session, error: sessionError } = await supabase.auth.getSession();
if (sessionError) {
  console.log('⚠️  Erreur session:', sessionError.message);
} else {
  console.log('✅ Connexion OK');
}

// Test 2: Accès DB
console.log('\n📊 Test 2: Accès base de données...');
const { data, error } = await supabase.from('profiles').select('count').limit(1);
if (error) {
  console.log('❌ Erreur DB:', error.message, '(Code:', error.code + ')');
} else {
  console.log('✅ Accès DB OK');
}

console.log('\n✅ Tests terminés\n');
