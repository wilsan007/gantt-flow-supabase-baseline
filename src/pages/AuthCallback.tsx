import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Traitement de la confirmation...');

  // Fonction pour traiter une session utilisateur
  const processUserSession = async (session) => {
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
                navigate('/');
              }, 2000);
            }
          }
        }, 2000);
      }
    } else {
      console.log('❌ Aucune session trouvée');
      setStatus('Session non trouvée, redirection vers connexion...');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }
  };

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 AuthCallback: Début du traitement...');
        
        // Vérifier les paramètres d'URL pour les erreurs
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const email = urlParams.get('email');
        const type = urlParams.get('type');
        const invitation = urlParams.get('invitation');
        const error_code = hashParams.get('error_code');
        const error_description = hashParams.get('error_description');
        
        console.log('📋 Paramètres URL:', { email, type, invitation, error_code });
        
        // Gestion spéciale pour les invitations (Magic Link)
        if (invitation === 'true') {
          console.log('🔧 Traitement invitation Magic Link...');
          setStatus('Traitement de votre invitation...');
          
          // Pour les Magic Links, essayer d'établir la session
          if (type === 'magiclink') {
            console.log('🪄 Magic Link détecté, traitement de la session...');
            
            // Vérifier si on a des paramètres de token dans l'URL
            const access_token = hashParams.get('access_token');
            const refresh_token = hashParams.get('refresh_token');
            
            if (access_token && refresh_token) {
              console.log('🔑 Tokens trouvés, établissement de la session...');
              
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token,
                refresh_token
              });
              
              if (sessionData?.session?.user) {
                console.log('✅ Session Magic Link établie');
                setStatus('✅ Invitation traitée ! Configuration en cours...');
                await processUserSession(sessionData.session);
                return;
              } else {
                console.log('⚠️ Erreur établissement session:', sessionError);
              }
            }
          }
          
          // Si erreur de confirmation mais c'est une invitation, rediriger vers connexion
          if (error_code === 'unexpected_failure') {
            console.log('⚠️ Erreur confirmation, redirection connexion avec email...');
            setStatus('Redirection vers la connexion...');
            setTimeout(() => {
              navigate(`/?email=${encodeURIComponent(email || '')}&invitation=true`);
            }, 2000);
            return;
          }
        }
        
        // Récupérer la session après confirmation (cas normal)
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
            console.log('✅ Profil trouvé, vérification si setup requis...');
            
            // Vérifier si c'est une nouvelle invitation qui nécessite un setup
            if (invitation === 'true') {
              console.log('🔧 Nouvelle invitation détectée, redirection vers setup...');
              setStatus('Configuration de votre compte...');
              setTimeout(() => {
                navigate(`/setup-account?tenant_id=${profile.tenant_id}&email=${encodeURIComponent(session.user.email)}`);
              }, 1500);
            } else {
              console.log('✅ Utilisateur existant, redirection dashboard...');
              setStatus('Configuration terminée ! Redirection...');
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            }
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
                  console.log('✅ Profil créé, redirection vers setup...');
                  setStatus('Configuration de votre compte...');
                  setTimeout(() => {
                    if (invitation === 'true') {
                      navigate(`/setup-account?tenant_id=${newProfile.tenant_id}&email=${encodeURIComponent(session.user.email)}`);
                    } else {
                      navigate('/dashboard');
                    }
                  }, 1000);
                } else {
                  console.log('⚠️ Timeout, redirection connexion...');
                  setStatus('Configuration incomplète, redirection connexion...');
                  setTimeout(() => {
                    navigate('/');
                  }, 2000);
                }
              }
            }, 2000);
          }
        } else {
          console.log('❌ Aucune session trouvée');
          setStatus('Session non trouvée, redirection vers connexion...');
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      } catch (err) {
        console.error('💥 Erreur callback:', err);
        setStatus('Erreur inattendue');
        setTimeout(() => {
          navigate('/');
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
