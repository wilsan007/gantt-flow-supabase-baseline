import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useMultiplePlaceholderHandler } from '@/hooks/usePlaceholderHandler';

const SetupAccount: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Paramètres URL
  const tenantId = searchParams.get('tenant_id');
  const email = searchParams.get('email');

  // États du formulaire
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Gestion des placeholders
  const { handleFocus, getPlaceholder } = useMultiplePlaceholderHandler({
    currentPassword: 'Votre mot de passe temporaire',
    newPassword: 'Minimum 8 caractères',
    confirmPassword: 'Répétez le nouveau mot de passe',
    companyName: 'Entrez le nom de votre entreprise',
  });

  // États UI
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [success, setSuccess] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

  // Récupération des informations utilisateur et pré-remplissage
  useEffect(() => {
    const loadUserInfo = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        console.log('❌ Aucune session, redirection connexion...');
        navigate('/tenant-login');
        return;
      }

      console.log('✅ Session trouvée pour:', session.user.email);

      // Récupérer les métadonnées utilisateur pour le mot de passe temporaire
      const tempPassword = session.user.user_metadata?.temp_password;
      if (tempPassword) {
        setCurrentPassword(tempPassword);
        console.log('🔑 Mot de passe temporaire pré-rempli');
      }

      // Récupérer les informations du tenant
      if (tenantId) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('name')
          .eq('id', tenantId)
          .single();

        if (tenant) {
          console.log('🏢 Nom entreprise actuel:', tenant.name);
          // Ne pas pré-remplir le nom d'entreprise selon la demande
        }
      }

      setUserInfo(session.user);
    };

    loadUserInfo();
  }, [navigate, tenantId]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setLoading(true);
    setPasswordError('');

    try {
      console.log('🔄 Changement mot de passe...');

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('❌ Erreur changement mot de passe:', error);
        setPasswordError(error.message);
      } else {
        console.log('✅ Mot de passe changé avec succès');
        setSuccess('Mot de passe mis à jour avec succès !');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('💥 Erreur:', error);
      setPasswordError('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyNameChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyName.trim()) {
      setCompanyError("Le nom de l'entreprise est requis");
      return;
    }

    if (!tenantId) {
      setCompanyError('ID tenant manquant');
      return;
    }

    setLoading(true);
    setCompanyError('');

    try {
      console.log('🔄 Mise à jour nom entreprise...');

      const { error } = await supabase
        .from('tenants')
        .update({ name: companyName.trim() })
        .eq('id', tenantId);

      if (error) {
        console.error('❌ Erreur mise à jour entreprise:', error);
        setCompanyError(error.message);
      } else {
        console.log('✅ Nom entreprise mis à jour avec succès');
        setSuccess("Nom de l'entreprise mis à jour avec succès !");

        // Redirection vers le dashboard après 2 secondes
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('💥 Erreur:', error);
      setCompanyError('Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipToLater = () => {
    console.log('⏭️ Configuration reportée, redirection dashboard...');
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">🎉 Bienvenue !</h2>
          <p className="mt-2 text-sm text-gray-600">Configurez votre compte pour commencer</p>
          {email && <p className="mt-1 text-xs text-gray-500">Connecté en tant que : {email}</p>}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="space-y-8 bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {/* Messages de succès */}
          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire changement mot de passe */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              🔐 Changer votre mot de passe
            </h3>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label
                  htmlFor="current-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Mot de passe actuel
                </label>
                <input
                  id="current-password"
                  name="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  onFocus={() => handleFocus('currentPassword')}
                  className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder={getPlaceholder('currentPassword', currentPassword)}
                  required
                />
                {currentPassword && (
                  <p className="mt-1 text-xs text-gray-500">
                    💡 Pré-rempli avec votre mot de passe temporaire
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </label>
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  onFocus={() => handleFocus('newPassword')}
                  className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder={getPlaceholder('newPassword', newPassword)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onFocus={() => handleFocus('confirmPassword')}
                  className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder={getPlaceholder('confirmPassword', confirmPassword)}
                  required
                />
              </div>

              {passwordError && <div className="text-sm text-red-600">{passwordError}</div>}

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Mise à jour...' : 'Changer le mot de passe'}
              </button>
            </form>
          </div>

          {/* Séparateur */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">ET</span>
            </div>
          </div>

          {/* Formulaire nom entreprise */}
          <div>
            <h3 className="mb-4 text-lg font-medium text-gray-900">🏢 Nom de votre entreprise</h3>

            <form onSubmit={handleCompanyNameChange} className="space-y-4">
              <div>
                <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                  Nouveau nom d'entreprise
                </label>
                <input
                  id="company-name"
                  name="company-name"
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  onFocus={() => handleFocus('companyName')}
                  className="relative mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  placeholder={getPlaceholder('companyName', companyName)}
                  required
                />
              </div>

              {companyError && <div className="text-sm text-red-600">{companyError}</div>}

              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour le nom'}
              </button>
            </form>
          </div>

          {/* Bouton reporter */}
          <div className="text-center">
            <button
              onClick={handleSkipToLater}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              ⏭️ Reporter la configuration et accéder au dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupAccount;
