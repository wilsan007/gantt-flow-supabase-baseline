import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Building2, UserCheck, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * 🎯 Page: CollaboratorSetup
 * Pattern: Stripe, Notion - Page d'acceptation invitation collaborateur
 * 
 * Workflow:
 * 1. L'utilisateur arrive via Magic Link
 * 2. Le webhook handle-collaborator-confirmation se déclenche
 * 3. L'utilisateur est ajouté au tenant
 * 4. Redirection vers le dashboard
 */

interface SetupState {
  status: 'loading' | 'success' | 'error' | 'waiting';
  message: string;
  data?: {
    tenant_name?: string;
    role?: string;
    employee_id?: string;
  };
}

const CollaboratorSetup: React.FC = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<SetupState>({
    status: 'loading',
    message: 'Vérification de votre invitation...'
  });

  useEffect(() => {
    const setupCollaborator = async () => {
      try {
        // Récupérer la session utilisateur
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          setState({
            status: 'error',
            message: 'Session invalide. Veuillez vous reconnecter.'
          });
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        console.log('✅ Session trouvée pour:', session.user.email);

        // Vérifier si le profil existe déjà
        setState({
          status: 'waiting',
          message: 'Vérification de votre profil...'
        });

        let attemptCount = 0;
        const maxAttempts = 10;
        const checkInterval = 2000; // 2 secondes

        const checkProfile = async (): Promise<boolean> => {
          attemptCount++;
          console.log(`🔍 Tentative ${attemptCount}/${maxAttempts} - Vérification profil...`);

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*, tenants!inner(name)')
            .eq('user_id', session.user.id)
            .single();

          if (profileError) {
            console.log('⏳ Profil non encore créé, attente...');
            return false;
          }

          if (profile) {
            console.log('✅ Profil trouvé !');
            setState({
              status: 'success',
              message: 'Votre compte a été configuré avec succès !',
              data: {
                tenant_name: profile.tenants?.name || 'Votre entreprise',
                role: profile.role,
              }
            });

            // Redirection automatique vers le dashboard après 2 secondes
            setTimeout(() => {
              navigate('/');
            }, 2000);

            return true;
          }

          return false;
        };

        // Première vérification immédiate
        const profileExists = await checkProfile();
        if (profileExists) return;

        // Boucle de vérification avec timeout
        const checkLoop = setInterval(async () => {
          if (attemptCount >= maxAttempts) {
            clearInterval(checkLoop);
            setState({
              status: 'error',
              message: 'Le processus de configuration prend plus de temps que prévu. Veuillez actualiser la page.'
            });
            return;
          }

          const found = await checkProfile();
          if (found) {
            clearInterval(checkLoop);
          }
        }, checkInterval);

        // Cleanup
        return () => clearInterval(checkLoop);

      } catch (error: any) {
        console.error('❌ Erreur setup collaborateur:', error);
        setState({
          status: 'error',
          message: error.message || 'Une erreur est survenue lors de la configuration'
        });
      }
    };

    setupCollaborator();
  }, [navigate]);

  // ============================================================================
  // RENDER SELON STATUS
  // ============================================================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4">
            {state.status === 'loading' || state.status === 'waiting' ? (
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            ) : state.status === 'success' ? (
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-white" />
              </div>
            )}
          </div>

          <CardTitle className="text-2xl font-bold">
            {state.status === 'loading' && 'Configuration en cours...'}
            {state.status === 'waiting' && 'Finalisation...'}
            {state.status === 'success' && 'Bienvenue ! 🎉'}
            {state.status === 'error' && 'Erreur de configuration'}
          </CardTitle>

          <CardDescription className="text-base mt-2">
            {state.message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          
          {/* Informations de succès */}
          {state.status === 'success' && state.data && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Alert className="border-green-200 bg-green-50">
                <Building2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Entreprise :</strong> {state.data.tenant_name}
                </AlertDescription>
              </Alert>

              {state.data.role && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Rôle :</strong> {state.data.role}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Redirection vers le dashboard dans quelques instants...
                </p>
                <div className="mt-4 flex justify-center">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading / Waiting */}
          {(state.status === 'loading' || state.status === 'waiting') && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <span>Vérification de votre invitation...</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                  <span>Configuration de votre compte...</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                  <span>Finalisation de votre profil...</span>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800 text-sm">
                  💡 Ce processus prend généralement quelques secondes...
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Erreur */}
          {state.status === 'error' && (
            <div className="space-y-4 animate-in fade-in duration-500">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {state.message}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                >
                  <Loader2 className="mr-2 h-4 w-4" />
                  Réessayer
                </Button>

                <Button
                  variant="outline"
                  onClick={() => navigate('/auth')}
                  className="w-full"
                >
                  Retour à la connexion
                </Button>
              </div>

              <Alert className="border-gray-200 bg-gray-50">
                <AlertDescription className="text-gray-700 text-xs">
                  <strong>Besoin d'aide ?</strong><br />
                  Si le problème persiste, contactez la personne qui vous a invité ou votre administrateur.
                </AlertDescription>
              </Alert>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default CollaboratorSetup;
