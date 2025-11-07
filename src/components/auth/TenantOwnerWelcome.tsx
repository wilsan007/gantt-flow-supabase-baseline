import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Building, CheckCircle, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TenantOwnerWelcomeProps {
  userEmail: string;
}

const TenantOwnerWelcome: React.FC<TenantOwnerWelcomeProps> = ({ userEmail }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkTenantCreation();
  }, [userEmail]);

  const checkTenantCreation = async () => {
    try {
      setIsLoading(true);

      // Attendre un peu pour laisser le trigger se déclencher
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Vérifier si l'utilisateur a maintenant un profil et un tenant
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('Utilisateur non connecté');
        return;
      }

      // Récupérer le profil utilisateur
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(
          `
          *,
          tenants:tenant_id (
            id,
            name,
            status
          )
        `
        )
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        // Le trigger n'a peut-être pas encore fini, réessayer
        setTimeout(checkTenantCreation, 3000);
        return;
      }

      if (profile.tenants) {
        setTenantInfo({
          tenantName: profile.tenants.name,
          userFullName: profile.full_name,
          role: profile.role,
        });

        toast({
          title: '🎉 Bienvenue !',
          description: `Votre entreprise "${profile.tenants.name}" a été créée avec succès`,
          variant: 'default',
        });
      } else {
        setError('Erreur lors de la création de votre entreprise');
      }
    } catch (error: any) {
      console.error('Erreur vérification tenant:', error);
      setError('Erreur lors de la vérification');
    } finally {
      setIsLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
            <h2 className="mb-2 text-xl font-semibold">Création de votre entreprise...</h2>
            <p className="text-muted-foreground">
              Nous configurons votre espace de travail, veuillez patienter quelques instants.
            </p>
            <div className="mt-6 space-y-2 text-left text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Validation de votre invitation</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span>Création de votre entreprise</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                <span>Configuration de vos permissions</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                <span>Finalisation de votre profil</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Erreur</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={checkTenantCreation} className="w-full" variant="outline">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tenantInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Félicitations !</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="font-semibold text-green-800">Bienvenue, {tenantInfo.userFullName} !</p>
              <p className="mt-1 text-green-700">
                Votre entreprise <strong>"{tenantInfo.tenantName}"</strong> a été créée avec succès.
              </p>
            </div>

            <div className="space-y-2 rounded-lg bg-blue-50 p-4 text-left text-sm">
              <h3 className="mb-2 font-semibold text-blue-800">
                Votre compte est maintenant configuré avec :
              </h3>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>
                  Rôle : {tenantInfo.role === 'tenant_admin' ? 'Administrateur' : tenantInfo.role}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Accès complet à tous les modules</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Profil employé créé</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Permissions administrateur assignées</span>
              </div>
            </div>

            <Button onClick={goToDashboard} className="w-full" size="lg">
              <Building className="mr-2 h-4 w-4" />
              Accéder à mon tableau de bord
            </Button>

            <p className="text-xs text-muted-foreground">
              Vous pouvez maintenant gérer votre entreprise et inviter vos employés.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default TenantOwnerWelcome;
