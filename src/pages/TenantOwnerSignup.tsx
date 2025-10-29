import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, Building, Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMultiplePlaceholderHandler } from '@/hooks/usePlaceholderHandler';

interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  companyName: string;
}

export const TenantOwnerSignup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [form, setForm] = useState<SignupForm>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: ''
  });
  
  // Gestion des placeholders
  const { handleFocus, getPlaceholder } = useMultiplePlaceholderHandler({
    companyName: 'Mon Entreprise SARL',
    password: 'Minimum 8 caractères',
    confirmPassword: 'Répétez votre mot de passe'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);
  const [validatingToken, setValidatingToken] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const typeParam = urlParams.get('type');
    
    if (tokenParam) {
      setToken(tokenParam);
      
      if (typeParam === 'signup') {
        // Token Supabase Auth - essayer d'abord la vérification Supabase
        console.log('🔗 Token Supabase Auth détecté');
        verifySupabaseToken(tokenParam);
      } else {
        // Token d'invitation classique - validation directe
        console.log('🎫 Token d\'invitation classique détecté');
        validateInvitationToken(tokenParam);
      }
    } else {
      setError('Token d\'invitation manquant dans l\'URL');
      setValidatingToken(false);
    }
  }, []);

  const verifySupabaseToken = async (token: string) => {
    try {
      console.log('🔗 Redirection vers la page de connexion après validation email');
      
      // Rediriger vers la page de connexion avec le token
      window.location.href = `/tenant-login?token=${token}&type=signup`;
      
    } catch (err) {
      console.error('❌ Erreur redirection:', err);
      setError('Erreur lors de la redirection');
      setValidatingToken(false);
    }
  };

  const validateInvitationToken = async (token: string) => {
    try {
      console.log('🔍 Validation token:', token);
      
      // Récupérer directement les données d'invitation (le token est stocké tel quel)
      const { data, error } = await supabase
        .from('invitations' as any)
        .select('id, token, email, full_name, tenant_id, tenant_name, invitation_type, status, expires_at, created_at, accepted_at, metadata')
        .eq('token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      console.log('📊 Résultat invitation:', { data, error });

      if (error) {
        console.error('❌ Erreur validation invitation:', error);
        throw new Error('Invitation non trouvée ou expirée');
      }

      const invitation = {
        id: (data as any).id,
        email: (data as any).email,
        fullName: (data as any).full_name,
        tenantId: (data as any).tenant_id,
        tenantName: (data as any).tenant_name || 'Nouvelle entreprise',
        invitationType: (data as any).invitation_type,
        expiresAt: (data as any).expires_at,
        tempPassword: (data as any).metadata?.temp_password
      };

      setInvitationData(invitation);
      setForm(prev => ({
        ...prev,
        email: invitation.email,
        fullName: invitation.fullName
      }));
      
    } catch (error) {
      console.error('❌ Erreur lors de la validation:', error);
      toast({
        title: "❌ Erreur",
        description: "Erreur lors de la validation du token",
        variant: "destructive"
      });
      navigate('/');
    } finally {
      setValidatingToken(false);
    }
  };

  const handleInputChange = (field: keyof SignupForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!form.email.trim()) {
      toast({
        title: "Erreur",
        description: "L'email est requis",
        variant: "destructive"
      });
      return false;
    }

    if (!form.fullName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom complet est requis",
        variant: "destructive"
      });
      return false;
    }

    if (!form.companyName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom de l'entreprise est requis",
        variant: "destructive"
      });
      return false;
    }

    if (form.password.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive"
      });
      return false;
    }

    if (form.password !== form.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm() || !invitationData) return;

    setIsLoading(true);
    try {
      console.log('🚀 Démarrage du processus d\'inscription...');
      
      // Récupérer le mot de passe temporaire depuis les métadonnées
      let tempPassword = null;
      if ((invitationData as any).metadata) {
        if (typeof (invitationData as any).metadata === 'string') {
          try {
            const metadata = JSON.parse((invitationData as any).metadata);
            tempPassword = metadata.temp_password;
          } catch (e) {
            console.warn('Erreur parsing metadata:', e);
          }
        } else {
          tempPassword = (invitationData as any).metadata.temp_password;
        }
      }
      
      if (!tempPassword) {
        tempPassword = (invitationData as any).tempPassword;
      }
      
      if (!tempPassword) {
        throw new Error('Mot de passe temporaire non trouvé dans l\'invitation');
      }
      
      console.log('🔐 ÉTAPE 1: Connexion avec le mot de passe temporaire...');
      console.log('📧 Email utilisé:', form.email.toLowerCase().trim());
      console.log('🔑 Mot de passe temporaire:', tempPassword ? '***masqué***' : 'NON TROUVÉ');
      
      // Vérifier d'abord l'état de l'utilisateur avant la connexion
      console.log('🔍 Vérification de l\'utilisateur avant connexion...');
      const { data: existingUser, error: userCheckError } = await supabase.auth.admin.getUserById(
        (invitationData as any).metadata?.supabase_user_id
      );
      
      if (userCheckError) {
        console.error('❌ Erreur vérification utilisateur:', userCheckError);
      } else {
        console.log('👤 État utilisateur existant:');
        console.log('   - ID:', existingUser.user?.id);
        console.log('   - Email:', existingUser.user?.email);
        console.log('   - Email confirmé:', existingUser.user?.email_confirmed_at ? 'OUI' : 'NON');
        console.log('   - Date confirmation:', existingUser.user?.email_confirmed_at);
        console.log('   - Créé le:', existingUser.user?.created_at);
        console.log('   - Dernière connexion:', existingUser.user?.last_sign_in_at);
      }
      
      // Étape 1: Se connecter avec le mot de passe temporaire pour confirmer l'email
      console.log('🚀 Tentative de connexion...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email.toLowerCase().trim(),
        password: tempPassword
      });

      if (signInError) {
        console.error('❌ ERREUR DÉTAILLÉE DE CONNEXION:');
        console.error('   - Code:', signInError.status);
        console.error('   - Message:', signInError.message);
        console.error('   - Détails complets:', signInError);
        
        if (signInError.message.includes('Email not confirmed') || signInError.message.includes('email_not_confirmed')) {
          console.log('🔧 SOLUTION: Confirmer l\'email manuellement dans Supabase Dashboard');
          console.log('   1. Aller dans Authentication > Users');
          console.log(`   2. Chercher ${form.email}`);
          console.log('   3. Cliquer sur "Confirm email"');
          throw new Error('Email non confirmé. L\'utilisateur existe mais son email n\'est pas confirmé. Veuillez confirmer l\'email dans Supabase Dashboard.');
        }
        
        if (signInError.message.includes('Invalid login credentials')) {
          console.log('🔧 SOLUTION: Vérifier le mot de passe temporaire');
          console.log('   - Mot de passe fourni:', tempPassword);
          console.log('   - Métadonnées invitation:', (invitationData as any).metadata);
          throw new Error('Identifiants de connexion invalides. Le mot de passe temporaire ne correspond pas.');
        }
        
        throw new Error('Erreur de connexion: ' + signInError.message);
      }

      console.log('✅ CONNEXION RÉUSSIE:');
      console.log('   - User ID:', signInData.user?.id);
      console.log('   - Email:', signInData.user?.email);
      console.log('   - Email confirmé:', signInData.user?.email_confirmed_at ? 'OUI' : 'NON');

      console.log('✅ ÉTAPE 1 terminée: Connexion temporaire réussie, email confirmé automatiquement');

      // Étape 3: Le trigger auto_create_tenant_owner devrait s'être exécuté automatiquement
      // Attendre un peu pour laisser le trigger se terminer
      console.log('⏳ ÉTAPE 3: Attente de l\'exécution du trigger auto_create_tenant_owner...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Étape 4: Vérifier que le tenant owner a été créé
      console.log('🔍 ÉTAPE 4: Vérification de la création du tenant owner...');
      console.log('   - User ID à vérifier:', signInData.user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, tenants:tenant_id(id, name)')
        .eq('user_id', signInData.user.id)
        .single();

      console.log('📊 RÉSULTAT VÉRIFICATION PROFIL:');
      console.log('   - Erreur:', profileError);
      console.log('   - Profil trouvé:', profile ? 'OUI' : 'NON');
      
      if (profile) {
        console.log('✅ PROFIL DÉTAILLÉ:');
        console.log('   - ID:', profile.id);
        console.log('   - Nom complet:', profile.full_name);
        console.log('   - Email:', (profile as any).email);
        console.log('   - Tenant ID:', profile.tenant_id);
        console.log('   - Rôle:', profile.role);
        console.log('   - Tenant info:', profile.tenants);
      }

      if (profileError || !profile) {
        console.warn('⚠️ DIAGNOSTIC ÉCHEC CRÉATION TENANT OWNER:');
        console.warn('   - Le trigger auto_create_tenant_owner ne s\'est pas exécuté');
        console.warn('   - Ou il y a eu une erreur dans le trigger');
        
        // Vérifier si l'utilisateur existe dans user_roles
        console.log('🔍 Vérification user_roles...');
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*, roles(name)')
          .eq('user_id', signInData.user.id);
          
        console.log('📊 USER_ROLES:', {
          error: rolesError,
          count: userRoles?.length || 0,
          data: userRoles
        });
        
        // Vérifier si un tenant a été créé
        console.log('🔍 Vérification tenants récents...');
        const { data: recentTenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);
          
        console.log('📊 TENANTS RÉCENTS:', {
          error: tenantsError,
          count: recentTenants?.length || 0,
          data: recentTenants
        });
        
        throw new Error('Le tenant owner n\'a pas été créé automatiquement. Vérifiez les logs du trigger dans Supabase.');
      }

      console.log('✅ ÉTAPE 4 terminée: Tenant owner créé avec succès');

      // Étape 5: Marquer l'invitation comme acceptée
      console.log('✅ ÉTAPE 5: Marquage de l\'invitation comme acceptée...');
      const { error: invitationUpdateError } = await supabase
        .from('invitations' as any)
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('token', token);

      if (invitationUpdateError) {
        console.warn('⚠️ Erreur mise à jour invitation:', invitationUpdateError);
      }

      console.log('✅ ÉTAPE 5 terminée: Invitation marquée comme acceptée');

      // Maintenant proposer l'étape 2: Changement de mot de passe
      toast({
        title: "🎉 Compte créé avec succès !",
        description: "Votre tenant owner a été créé. Vous pouvez maintenant changer votre mot de passe.",
        variant: "default"
      });

      // Étape 2: Proposer la mise à jour du mot de passe
      console.log('🔐 ÉTAPE 2: Proposition de mise à jour du mot de passe...');
      
      const shouldUpdatePassword = window.confirm(
        "Votre compte a été créé avec succès !\n\n" +
        "Souhaitez-vous changer votre mot de passe temporaire maintenant ?\n\n" +
        "• OUI: Vous pourrez définir un nouveau mot de passe\n" +
        "• NON: Vous serez redirigé vers le tableau de bord (vous pourrez changer le mot de passe plus tard)"
      );

      if (shouldUpdatePassword) {
        console.log('🔐 Mise à jour du mot de passe utilisateur...');
        const { data: updateData, error: updateError } = await supabase.auth.updateUser({
          password: form.password,
          data: {
            full_name: form.fullName.trim(),
            company_name: form.companyName.trim()
          }
        });

        if (updateError) {
          console.error('❌ Erreur mise à jour mot de passe:', updateError);
          toast({
            title: "⚠️ Erreur changement mot de passe",
            description: "Le mot de passe n'a pas pu être changé, mais votre compte est créé. Vous pourrez le changer plus tard.",
            variant: "default"
          });
        } else {
          console.log('✅ ÉTAPE 2 terminée: Mot de passe mis à jour avec succès');
          toast({
            title: "🔐 Mot de passe mis à jour !",
            description: "Votre nouveau mot de passe a été enregistré avec succès.",
            variant: "default"
          });
        }
      } else {
        console.log('⏭️ ÉTAPE 2 ignorée: L\'utilisateur a choisi de garder le mot de passe temporaire');
      }

      // Redirection vers le dashboard après un court délai
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erreur inscription:', error);
      toast({
        title: "❌ Erreur d'inscription",
        description: error.message || 'Erreur lors de l\'inscription',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Validation de l'invitation...</p>
        </div>
      </div>
    );
  }

  if (!token || !invitationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertDescription>
            Lien d'invitation invalide ou manquant.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Building className="h-6 w-6" />
            Créer votre entreprise
          </CardTitle>
          <CardDescription>
            Finalisez votre inscription sur Wadashaqeen
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <UserPlus className="h-4 w-4" />
            <AlertDescription>
              <strong>Invitation pour :</strong> {invitationData.full_name}<br />
              <strong>Email :</strong> {invitationData.email}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={true}
                className="pl-10 bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyName">Nom de l'entreprise *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="companyName"
                type="text"
                placeholder={getPlaceholder('companyName', form.companyName)}
                value={form.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                onFocus={() => handleFocus('companyName')}
                disabled={isLoading}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={getPlaceholder('password', form.password)}
                value={form.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                onFocus={() => handleFocus('password')}
                disabled={isLoading}
                className="pl-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder={getPlaceholder('confirmPassword', form.confirmPassword)}
                value={form.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                onFocus={() => handleFocus('confirmPassword')}
                disabled={isLoading}
                className="pl-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleSignup}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Enregistrer mon entreprise
              </>
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>En créant votre compte, vous acceptez nos conditions d'utilisation</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantOwnerSignup;
