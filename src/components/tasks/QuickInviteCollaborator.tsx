import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';

interface QuickInviteCollaboratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (employeeId: string) => void;
}

export const QuickInviteCollaborator: React.FC<QuickInviteCollaboratorProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'employee',
  });

  const roles = [
    { value: 'employee', label: 'Employé' },
    { value: 'manager', label: 'Manager' },
    { value: 'collaborator', label: 'Collaborateur' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.full_name) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs obligatoires.',
        variant: 'destructive',
      });
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'Email invalide',
        description: 'Veuillez entrer une adresse email valide.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Récupérer le tenant_id de l'utilisateur connecté
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) throw new Error('Tenant non trouvé');

      console.log('🚀 Envoi invitation collaborateur rapide...');
      console.log('📧 Email:', formData.email);
      console.log('👤 Nom:', formData.full_name);
      console.log('🏢 Tenant:', profile.tenant_id);

      // Appeler l'Edge Function send-collaborator-invitation
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-collaborator-invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            full_name: formData.full_name,
            role_name: formData.role,
            tenant_id: profile.tenant_id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const result = await response.json();

      console.log('✅ Invitation envoyée avec succès');
      console.log('📋 Résultat:', result);

      // Animation de succès
      setSuccess(true);

      toast({
        title: '✅ Invitation envoyée !',
        description: `Un email a été envoyé à ${formData.email}. Cette personne pourra être assignée dès qu'elle accepte l'invitation.`,
      });

      // Attendre 1.5s pour montrer le succès, puis fermer
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setFormData({ email: '', full_name: '', role: 'employee' });

        // Si on a un ID d'employé, on peut l'utiliser
        if (result.employee_id && onSuccess) {
          onSuccess(result.employee_id);
        }
      }, 1500);
    } catch (error: any) {
      console.error('❌ Erreur invitation:', error);

      let errorMessage = "Une erreur est survenue lors de l'envoi de l'invitation.";

      if (error.message.includes('already exists')) {
        errorMessage = 'Cet email est déjà invité ou existe déjà.';
      } else if (error.message.includes('email')) {
        errorMessage = 'Adresse email invalide.';
      }

      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            Inviter un nouveau collaborateur
          </DialogTitle>
          <DialogDescription>
            Cette personne recevra un email d'invitation et pourra être assignée aux tâches une fois
            inscrite.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500 animate-in zoom-in" />
            <h3 className="mb-2 text-lg font-semibold text-green-700">Invitation envoyée !</h3>
            <p className="text-sm text-gray-600">Un email a été envoyé à {formData.email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="quick-invite-email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email *
              </Label>
              <Input
                id="quick-invite-email"
                type="email"
                placeholder="nom@entreprise.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
                className="mt-1"
              />
            </div>

            {/* Nom complet */}
            <div>
              <Label htmlFor="quick-invite-name">Nom complet *</Label>
              <Input
                id="quick-invite-name"
                type="text"
                placeholder="Jean Dupont"
                value={formData.full_name}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                required
                disabled={loading}
                className="mt-1"
              />
            </div>

            {/* Rôle */}
            <div>
              <Label htmlFor="quick-invite-role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={value => setFormData({ ...formData, role: value })}
                disabled={loading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Le rôle peut être modifié plus tard dans la gestion RH
              </p>
            </div>

            {/* Info box */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs text-blue-800">
                <strong>💡 Astuce :</strong> Cette personne recevra un email avec un lien
                d'invitation. Une fois inscrite, elle apparaîtra automatiquement dans la liste des
                assignés.
              </p>
            </div>

            {/* Boutons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Envoyer l'invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
