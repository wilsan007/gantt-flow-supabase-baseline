/**
 * PasswordSettings - Changement de mot de passe
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export const PasswordSettings = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();

  // Validation du mot de passe
  const passwordValidation = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    passwordsMatch: newPassword === confirmPassword && newPassword.length > 0,
  };

  const isValid = Object.values(passwordValidation).every(v => v === true);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValid) {
      toast({
        title: 'Mot de passe invalide',
        description: 'Veuillez respecter tous les critères de sécurité.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Mot de passe modifié',
        description: 'Votre mot de passe a été mis à jour avec succès.',
      });

      // Réinitialiser le formulaire
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const ValidationItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="text-muted-foreground h-4 w-4" />
      )}
      <span className={valid ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
        {text}
      </span>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Changer le mot de passe</CardTitle>
        <CardDescription>
          Mettez à jour votre mot de passe pour sécuriser votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChangePassword} className="space-y-6">
          {/* Nouveau mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Confirmation mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {/* Critères de validation */}
          {newPassword && (
            <div className="bg-muted/50 space-y-2 rounded-lg p-4">
              <p className="mb-2 text-sm font-medium">Critères de sécurité :</p>
              <ValidationItem valid={passwordValidation.minLength} text="Au moins 8 caractères" />
              <ValidationItem valid={passwordValidation.hasUpperCase} text="Une lettre majuscule" />
              <ValidationItem valid={passwordValidation.hasLowerCase} text="Une lettre minuscule" />
              <ValidationItem valid={passwordValidation.hasNumber} text="Un chiffre" />
              <ValidationItem
                valid={passwordValidation.hasSpecialChar}
                text="Un caractère spécial (!@#$%...)"
              />
              {confirmPassword && (
                <ValidationItem
                  valid={passwordValidation.passwordsMatch}
                  text="Les mots de passe correspondent"
                />
              )}
            </div>
          )}

          <Button type="submit" disabled={loading || !isValid}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Modification...
              </>
            ) : (
              'Modifier le mot de passe'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
