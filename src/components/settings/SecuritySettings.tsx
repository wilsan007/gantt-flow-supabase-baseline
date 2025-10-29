import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MFASetup } from '@/components/auth/MFASetup';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MFAFactor {
  id: string;
  friendly_name: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
  created_at: string;
}

export const SecuritySettings = () => {
  const [mfaFactors, setMfaFactors] = useState<MFAFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadMFAFactors();
  }, []);

  const loadMFAFactors = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;

      const factors = (data?.totp || []).map(f => ({
        id: f.id,
        friendly_name: f.friendly_name || 'Authenticator App',
        factor_type: 'totp' as const,
        status: f.status,
        created_at: f.created_at
      }));
      setMfaFactors(factors);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des facteurs MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (factorId: string) => {
    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs ? ' +
      'Cela réduira la sécurité de votre compte.'
    );

    if (!confirmed) return;

    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      
      if (error) throw error;

      toast({
        title: "MFA désactivé",
        description: "L'authentification à deux facteurs a été désactivée",
      });

      loadMFAFactors();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: err.message || 'Erreur lors de la désactivation',
      });
    }
  };

  const verifiedFactors = mfaFactors.filter(f => f.status === 'verified');
  const hasMFA = verifiedFactors.length > 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité du compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité du compte
          </CardTitle>
          <CardDescription>
            Gérez les paramètres de sécurité de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Status MFA */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              {hasMFA ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Authentification à deux facteurs activée</p>
                    <p className="text-sm text-muted-foreground">
                      Votre compte est protégé par 2FA
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium">Authentification à deux facteurs désactivée</p>
                    <p className="text-sm text-muted-foreground">
                      Activez la 2FA pour sécuriser votre compte
                    </p>
                  </div>
                </>
              )}
            </div>
            {hasMFA && (
              <div className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                Actif
              </div>
            )}
          </div>

          {/* Liste des facteurs MFA ou Setup */}
          {hasMFA ? (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Méthodes d'authentification configurées</h4>
              {verifiedFactors.map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{factor.friendly_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Configuré le {new Date(factor.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnenroll(factor.id)}
                  >
                    Désactiver
                  </Button>
                </div>
              ))}

              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm">
                  <strong>Conseil de sécurité :</strong> Gardez vos codes de sauvegarde en lieu sûr.
                  Vous en aurez besoin si vous perdez l'accès à votre application d'authentification.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <MFASetup />
          )}
        </CardContent>
      </Card>

      {/* Autres paramètres de sécurité */}
      <Card>
        <CardHeader>
          <CardTitle>Autres paramètres de sécurité</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Changer le mot de passe</p>
              <p className="text-sm text-muted-foreground">
                Mettez à jour votre mot de passe régulièrement
              </p>
            </div>
            <Button variant="outline" size="sm">
              Modifier
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Sessions actives</p>
              <p className="text-sm text-muted-foreground">
                Gérez les appareils connectés à votre compte
              </p>
            </div>
            <Button variant="outline" size="sm">
              Voir les sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
