// Vérifier s'il y a une invitation pour l'utilisateur connecté
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjg2MTMsImV4cCI6MjA3Mjc0NDYxM30.13wLfMNJ2Joxpw9GWq2_ymJgPtQizZZUzRUDNVRhQzM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserInvitation() {
  const userEmail = 'imran77@yyahoo.com';
  
  console.log('🔍 Vérification invitation pour:', userEmail);
  
  // Chercher une invitation pour cet email
  const { data: invitations, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', userEmail)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Erreur:', error);
    return;
  }
  
  console.log('📊 Invitations trouvées:', invitations?.length || 0);
  
  if (invitations && invitations.length > 0) {
    invitations.forEach((inv, index) => {
      console.log(`\n📧 Invitation ${index + 1}:`);
      console.log('- ID:', inv.id);
      console.log('- Type:', inv.invitation_type);
      console.log('- Status:', inv.status);
      console.log('- Expires:', inv.expires_at);
      console.log('- Tenant ID:', inv.tenant_id);
      console.log('- Full Name:', inv.full_name);
    });
    
    const pendingInvitations = invitations.filter(inv => 
      inv.status === 'pending' && 
      new Date(inv.expires_at) > new Date() &&
      inv.invitation_type === 'tenant_owner'
    );
    
    if (pendingInvitations.length > 0) {
      console.log('\n✅ Invitation tenant_owner valide trouvée !');
      console.log('🚀 Le trigger automatique devrait créer le tenant à la prochaine connexion');
    } else {
      console.log('\n⚠️ Aucune invitation tenant_owner valide');
    }
  } else {
    console.log('\n❌ Aucune invitation trouvée pour cet email');
    console.log('💡 L\'utilisateur doit d\'abord recevoir une invitation du Super Admin');
  }
}

checkUserInvitation();
