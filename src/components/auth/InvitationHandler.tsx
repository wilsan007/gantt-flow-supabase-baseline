import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const InvitationHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isInvitation = params.get('invitation') === 'true';
    const isCallbackPage = location.pathname === '/auth/callback';

    // Si c'est une invitation et qu'on n'est PAS DÉJÀ sur la page de callback
    if (isInvitation && !isCallbackPage) {
      console.log('🔄 InvitationHandler: Redirection FORCÉE vers /auth/callback');
      // Utilisation de window.location pour forcer le rechargement et contourner le routeur si bloqué
      const targetUrl = `/auth/callback${location.search}${location.hash}`;
      window.location.href = targetUrl;
    }
  }, [location]);

  // Afficher un indicateur visuel si une redirection est en cours
  const params = new URLSearchParams(location.search);
  if (params.get('invitation') === 'true' && location.pathname !== '/auth/callback') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 text-white">
        <div className="text-center">
          <div className="mb-4 text-4xl">🔄</div>
          <h2 className="text-xl font-bold">Redirection en cours...</h2>
          <p>Veuillez patienter, nous traitons votre invitation.</p>
        </div>
      </div>
    );
  }

  return null;
};
