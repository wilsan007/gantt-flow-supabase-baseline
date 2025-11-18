import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, XCircle, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MFAFactor {
  id: string;
  friendly_name: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
}

export const MFASetup = () => {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Étape 1 : Enrollment MFA
  const handleEnroll = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setSuccess('QR Code généré avec succès');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du QR Code');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérification du code
  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        code: verificationCode,
      });

      if (error) throw error;

      if (data) {
        setSuccess('MFA activé avec succès !');
        toast({
          title: 'Authentification à deux facteurs activée',
          description: 'Votre compte est maintenant plus sécurisé',
        });

        // Rafraîchir la page après 2 secondes
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Code incorrect. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Copier le secret
  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Secret copié',
      description: 'Le secret a été copié dans le presse-papiers',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="text-primary h-6 w-6" />
        <div>
          <h3 className="text-lg font-semibold">Authentification à deux facteurs (2FA)</h3>
          <p className="text-muted-foreground text-sm">Renforcez la sécurité de votre compte</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {!qrCode ? (
        <div className="space-y-4">
          <div className="bg-muted rounded-lg p-4">
            <h4 className="mb-2 font-medium">Pourquoi activer la 2FA ?</h4>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>✅ Protection contre 99.9% des attaques de phishing</li>
              <li>✅ Sécurité renforcée même si votre mot de passe est compromis</li>
              <li>✅ Conformité aux standards de sécurité enterprise</li>
            </ul>
          </div>

          <Button onClick={handleEnroll} disabled={loading} className="w-full">
            {loading ? 'Génération...' : "Activer l'authentification à deux facteurs"}
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Étape 1 : Scannez le QR Code</h4>
            <p className="text-muted-foreground text-sm">
              Utilisez une application d'authentification (Google Authenticator, Authy, Microsoft
              Authenticator)
            </p>

            <div className="flex justify-center rounded-lg border bg-white p-6">
              <QRCodeSVG value={qrCode} size={256} level="H" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Ou entrez ce code manuellement :</p>
              <div className="flex items-center gap-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button size="sm" variant="outline" onClick={handleCopySecret}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Étape 2 : Entrez le code de vérification</h4>
            <p className="text-muted-foreground text-sm">
              Entrez le code à 6 chiffres généré par votre application
            </p>

            <div className="flex gap-2">
              <Input
                type="text"
                value={verificationCode}
                onChange={e => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                }}
                placeholder="000000"
                maxLength={6}
                className="text-center font-mono text-2xl tracking-widest"
              />
            </div>

            <Button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="w-full"
            >
              {loading ? 'Vérification...' : 'Vérifier et activer'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
