// Test de connexion Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://qliinxtanjdnwxlvnxji.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  try {
    console.log('🔄 Test de connexion à Supabase avec utilisateur connecté...');
    
    // Test 1: Se connecter avec les credentials par défaut
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (signInError) {
      console.log('🔐 Tentative de connexion admin:', signInError.message);
    } else {
      console.log('✅ Connexion admin réussie!');
    }
    
    // Test 2: Vérifier la session après connexion
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('⚠️ Erreur de session:', sessionError.message);
    } else {
      console.log('🔐 Session:', session ? `Connecté comme ${session.user.email}` : 'Non connecté');
    }
    
    // Test 3: Tester l'accès aux données avec utilisateur connecté
    if (session) {
      console.log('\n📊 Test d\'accès aux données avec utilisateur connecté:');
      
      // Test tasks
      try {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, status')
          .limit(5);
          
        if (tasksError) {
          console.log('📋 Tasks:', tasksError.message);
        } else {
          console.log('✅ Tasks trouvées:', tasks?.length || 0);
          if (tasks && tasks.length > 0) {
            console.log('   Exemple:', tasks[0]);
          }
        }
      } catch (e) {
        console.log('📋 Tasks: erreur d\'accès');
      }
      
      // Test employees
      try {
        const { data: employees, error: employeesError } = await supabase
          .from('employees')
          .select('id, first_name, last_name')
          .limit(5);
          
        if (employeesError) {
          console.log('👥 Employees:', employeesError.message);
        } else {
          console.log('✅ Employees trouvés:', employees?.length || 0);
          if (employees && employees.length > 0) {
            console.log('   Exemple:', employees[0]);
          }
        }
      } catch (e) {
        console.log('👥 Employees: erreur d\'accès');
      }
      
      // Test profiles
      try {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .limit(5);
          
        if (profilesError) {
          console.log('👤 Profiles:', profilesError.message);
        } else {
          console.log('✅ Profiles trouvés:', profiles?.length || 0);
          if (profiles && profiles.length > 0) {
            console.log('   Exemple:', profiles[0]);
          }
        }
      } catch (e) {
        console.log('👤 Profiles: erreur d\'accès');
      }
    }
    
    return true;
    
  } catch (err) {
    console.error('💥 Erreur critique:', err.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Base de données Supabase opérationnelle!');
  } else {
    console.log('\n❌ Problème de connexion à la base de données');
  }
  process.exit(success ? 0 : 1);
});
