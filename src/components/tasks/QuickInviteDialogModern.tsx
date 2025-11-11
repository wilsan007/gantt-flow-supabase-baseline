/**
 * 🎨 QUICK INVITE DIALOG - VERSION MODERNE
 *
 * Exemple de dialog modernisé avec :
 * ✅ Support mobile (Drawer)
 * ✅ Thème cohérent (module "hr")
 * ✅ Animations fluides
 * ✅ UX optimisée
 * ✅ Responsive 100%
 *
 * Pattern: Linear + Notion + Slack
 */

import React, { useState } from 'react';
import { ResponsiveDialog, ThemedButton, ThemedBadge } from '@/components/ui/responsive-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, User, Briefcase, Building2, CheckCircle2, AlertCircle } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface QuickInviteDialogModernProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSuccess?: () => void;
}

export const QuickInviteDialogModern: React.FC<QuickInviteDialogModernProps> = ({
  open,
  onOpenChange,
  onInviteSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleToAssign, setRoleToAssign] = useState('employee');
  const [department, setDepartment] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation en temps réel
  const emailValid = email.length > 0 && email.includes('@');
  const nameValid = fullName.trim().length > 2;
  const formValid = emailValid && nameValid;

  const handleInvite = async () => {
    if (!formValid) {
      toast.error('Veuillez remplir les champs requis correctement');
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        throw new Error('Session non trouvée');
      }

      const response = await supabase.functions.invoke('send-collaborator-invitation', {
        body: {
          email,
          full_name: fullName,
          role_to_assign: roleToAssign,
          department: department || null,
          job_position: jobPosition || null,
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erreur lors de l'invitation");
      }

      // ✅ Succès avec animation
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div>
            <p className="font-medium">Invitation envoyée !</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>
      );

      // Reset et fermeture
      setEmail('');
      setFullName('');
      setRoleToAssign('employee');
      setDepartment('');
      setJobPosition('');
      onOpenChange(false);
      onInviteSuccess?.();
    } catch (error: any) {
      console.error('Erreur invitation:', error);
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-medium">Erreur d'invitation</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  // Footer avec boutons thématisés
  const footer = (
    <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:gap-3">
      <ThemedButton
        module="hr"
        variant="secondary"
        onClick={() => onOpenChange(false)}
        className="flex-1 sm:flex-none"
        disabled={loading}
      >
        Annuler
      </ThemedButton>
      <ThemedButton
        module="hr"
        variant="primary"
        onClick={handleInvite}
        className="flex-1"
        loading={loading}
        disabled={!formValid || loading}
      >
        {loading ? 'Envoi en cours...' : "Envoyer l'invitation"}
      </ThemedButton>
    </div>
  );

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Inviter un collaborateur"
      description="Envoyez une invitation par email pour ajouter un nouveau membre à votre équipe"
      module="hr"
      footer={footer}
      size="md"
    >
      <div className="space-y-6">
        {/* Email Field avec validation visuelle */}
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-600" />
            Email <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="exemple@entreprise.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={cn(
                'transition-all duration-200',
                email.length > 0 &&
                  (emailValid
                    ? 'border-emerald-500 focus:ring-emerald-500'
                    : 'border-red-500 focus:ring-red-500')
              )}
              disabled={loading}
            />
            {email.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailValid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nom complet avec validation */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="flex items-center gap-2">
            <User className="h-4 w-4 text-emerald-600" />
            Nom complet <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="fullName"
              placeholder="Jean Dupont"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className={cn(
                'transition-all duration-200',
                fullName.length > 0 &&
                  (nameValid
                    ? 'border-emerald-500 focus:ring-emerald-500'
                    : 'border-red-500 focus:ring-red-500')
              )}
              disabled={loading}
            />
            {fullName.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nameValid ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rôle avec badge */}
        <div className="space-y-2">
          <Label htmlFor="role" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-emerald-600" />
            Rôle
          </Label>
          <Select value={roleToAssign} onValueChange={setRoleToAssign} disabled={loading}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employee">
                <div className="flex items-center gap-2">
                  Employé
                  <ThemedBadge module="hr">Standard</ThemedBadge>
                </div>
              </SelectItem>
              <SelectItem value="manager">
                <div className="flex items-center gap-2">
                  Manager
                  <ThemedBadge module="hr">Approbations</ThemedBadge>
                </div>
              </SelectItem>
              <SelectItem value="hr">
                <div className="flex items-center gap-2">
                  RH
                  <ThemedBadge module="hr">Full Access</ThemedBadge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Département (optionnel) */}
        <div className="space-y-2">
          <Label htmlFor="department" className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            Département <span className="text-xs text-muted-foreground">(optionnel)</span>
          </Label>
          <Input
            id="department"
            placeholder="IT, Marketing, Finance..."
            value={department}
            onChange={e => setDepartment(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Poste (optionnel) */}
        <div className="space-y-2">
          <Label htmlFor="jobPosition" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-emerald-600" />
            Poste <span className="text-xs text-muted-foreground">(optionnel)</span>
          </Label>
          <Input
            id="jobPosition"
            placeholder="Développeur, Chef de projet..."
            value={jobPosition}
            onChange={e => setJobPosition(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Info box */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
          <p className="text-sm text-emerald-900 dark:text-emerald-100">
            💡 <span className="font-medium">Le collaborateur recevra</span> un email avec un lien
            d'invitation. Il pourra créer son mot de passe et accéder à la plateforme.
          </p>
        </div>
      </div>
    </ResponsiveDialog>
  );
};
