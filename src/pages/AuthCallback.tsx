import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Traitement de la confirmation...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 AuthCallback: Début du traitement...');
        
        // Récupérer la session après confirmation
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Erreur session:', error);
          setStatus('Erreur lors de la confirmation');
          return;
        }

        console.log('📋 Session récupérée:', session?.user?.email);

        if (session?.user) {
          setStatus('✅ Email confirmé ! Configuration en cours...');
          
          // Vérifier si le profil existe (webhook/trigger exécuté)
          const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id, full_name')
            .eq('user_id', session.user.id)
            .single();

          if (profile?.tenant_id) {
            console.log('✅ Profil trouvé, redirection dashboard...');
            setStatus('Configuration terminée ! Redirection...');
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            console.log('⏳ Profil non trouvé, attente webhook...');
            setStatus('Configuration en cours, veuillez patienter...');
            
            // Attendre que le webhook/trigger s'exécute
            let attempts = 0;
            const checkProfile = setInterval(async () => {
              attempts++;
              console.log(`🔍 Vérification profil (tentative ${attempts})...`);
              
              const { data: newProfile } = await supabase
                .from('profiles')
                .select('tenant_id')
                .eq('user_id', session.user.id)
                .single();

              if (newProfile?.tenant_id || attempts >= 10) {
                clearInterval(checkProfile);
                
                if (newProfile?.tenant_id) {
                  console.log('✅ Profil créé, redirection dashboard...');
                  setStatus('Configuration terminée ! Redirection...');
                  setTimeout(() => {
                    navigate('/dashboard');
                  }, 1000);
                } else {
                  console.log('⚠️ Timeout, redirection connexion...');
                  setStatus('Configuration incomplète, redirection connexion...');
                  setTimeout(() => {
                    navigate('/tenant-login');
                  }, 2000);
                }
              }
            }, 2000);
          }
        } else {
          console.log('❌ Aucune session trouvée');
          setStatus('Session non trouvée, redirection vers connexion...');
          setTimeout(() => {
            navigate('/tenant-login');
          }, 2000);
        }
      } catch (err) {
        console.error('💥 Erreur callback:', err);
        setStatus('Erreur inattendue');
        setTimeout(() => {
          navigate('/tenant-login');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Confirmation en cours</h2>
        <p className="text-gray-600 mb-4">{status}</p>
        
        <div className="text-sm text-gray-500">
          <p>• Validation de votre email</p>
          <p>• Configuration de votre compte</p>
          <p>• Préparation de votre espace</p>
        </div>
      </div>
    </div>
  );
}
