import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { cleanupSession } from '@/utils/sessionCleanup';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Composant qui détecte et gère les erreurs de refresh token
 * Affiche un message clair à l'utilisateur et propose de nettoyer la session
 */
export const SessionErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasRefreshError, setHasRefreshError] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  useEffect(() => {
    // Écouter les erreurs d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Détecter les échecs de rafraîchissement
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.error('❌ Échec du rafraîchissement du token détecté');
          setHasRefreshError(true);
        }
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Réinitialiser l'erreur si la connexion réussit
          setHasRefreshError(false);
        }
      }
    );

    // Vérifier la session au montage
    const checkSession = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error && (
          error.message.includes('refresh') ||
          error.message.includes('Invalid') ||
          error.message.includes('Not Found')
        )) {
          setHasRefreshError(true);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de la session:', err);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    try {
      await cleanupSession();
      // Recharger la page après le nettoyage
      window.location.href = '/';
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      setIsCleaningUp(false);
    }
  };

  if (hasRefreshError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Session Expirée</AlertTitle>
            <AlertDescription>
              Votre session a expiré ou n'est plus valide. Veuillez vous reconnecter.
            </AlertDescription>
          </Alert>

          <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Que s'est-il passé ?</h3>
              <p className="text-sm text-gray-600">
                Votre token de rafraîchissement n'est plus valide. Cela peut arriver si :
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 ml-2">
                <li>Vous vous êtes déconnecté sur un autre appareil</li>
                <li>Votre session a expiré après une longue période d'inactivité</li>
                <li>Les données de session ont été corrompues</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Solution</h3>
              <p className="text-sm text-gray-600">
                Cliquez sur le bouton ci-dessous pour nettoyer votre session et vous reconnecter.
              </p>
            </div>

            <Button
              onClick={handleCleanup}
              disabled={isCleaningUp}
              className="w-full"
            >
              {isCleaningUp ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Nettoyage en cours...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Nettoyer et Se Reconnecter
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-gray-500">
            Si le problème persiste, contactez le support technique.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
