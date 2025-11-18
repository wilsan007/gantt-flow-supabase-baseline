import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useMultiplePlaceholderHandler } from '@/hooks/usePlaceholderHandler';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, Building, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

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
    <div className="flex min-h-screen flex-col justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 text-center sm:mb-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">🎉 Bienvenue !</h2>
          <p className="mt-1.5 text-sm text-gray-600 sm:mt-2 sm:text-base">
            Configurez votre compte pour commencer
          </p>
          {email && <p className="mt-1 text-xs text-gray-500">Connecté en tant que : {email}</p>}
        </div>

        <Card className="shadow-2xl">
          <CardContent className="space-y-6 p-5 sm:space-y-8 sm:p-8">
            {/* Messages de succès */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm font-medium text-green-800 sm:text-base">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Formulaire changement mot de passe */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                  Changer votre mot de passe
                </h3>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-3.5 sm:space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password" className="text-sm font-medium sm:text-base">
                    Mot de passe actuel
                  </Label>
                  <Input
                    id="current-password"
                    name="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    onFocus={() => handleFocus('currentPassword')}
                    placeholder={getPlaceholder('currentPassword', currentPassword)}
                    required
                    className="h-11 text-base sm:h-10 sm:text-sm"
                  />
                  {currentPassword && (
                    <p className="text-muted-foreground text-xs">
                      💡 Pré-rempli avec votre mot de passe temporaire
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-sm font-medium sm:text-base">
                    Nouveau mot de passe
                  </Label>
                  <Input
                    id="new-password"
                    name="new-password"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    onFocus={() => handleFocus('newPassword')}
                    placeholder={getPlaceholder('newPassword', newPassword)}
                    required
                    className="h-11 text-base sm:h-10 sm:text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm font-medium sm:text-base">
                    Confirmer le nouveau mot de passe
                  </Label>
                  <Input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onFocus={() => handleFocus('confirmPassword')}
                    placeholder={getPlaceholder('confirmPassword', confirmPassword)}
                    required
                    className="h-11 text-base sm:h-10 sm:text-sm"
                  />
                </div>

                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs sm:text-sm">
                      {passwordError}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full text-base font-semibold sm:h-10 sm:text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    'Changer le mot de passe'
                  )}
                </Button>
              </form>
            </div>

            {/* Séparateur */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="text-muted-foreground bg-white px-3">ET</span>
              </div>
            </div>

            {/* Formulaire nom entreprise */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-green-600" />
                <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                  Nom de votre entreprise
                </h3>
              </div>

              <form onSubmit={handleCompanyNameChange} className="space-y-3.5 sm:space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="company-name" className="text-sm font-medium sm:text-base">
                    Nouveau nom d'entreprise
                  </Label>
                  <Input
                    id="company-name"
                    name="company-name"
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    onFocus={() => handleFocus('companyName')}
                    placeholder={getPlaceholder('companyName', companyName)}
                    required
                    className="h-11 text-base sm:h-10 sm:text-sm"
                  />
                </div>

                {companyError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs sm:text-sm">
                      {companyError}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                  className="h-11 w-full bg-green-600 text-base font-semibold hover:bg-green-700 sm:h-10 sm:text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mise à jour...
                    </>
                  ) : (
                    'Mettre à jour le nom'
                  )}
                </Button>
              </form>
            </div>

            {/* Bouton reporter */}
            <div className="pt-2 text-center">
              <Button
                onClick={handleSkipToLater}
                variant="ghost"
                className="text-muted-foreground hover:text-foreground text-xs underline sm:text-sm"
              >
                ⏭️ Reporter la configuration et accéder au dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupAccount;
