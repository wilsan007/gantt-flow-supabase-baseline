import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Mail, User, Briefcase, Building2 } from '@/lib/icons';

interface QuickInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSuccess?: () => void;
}

export const QuickInviteDialog: React.FC<QuickInviteDialogProps> = ({
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

  const handleInvite = async () => {
    if (!email.trim() || !fullName.trim()) {
      toast.error("Veuillez remplir au moins l'email et le nom complet");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/send-collaborator-invitation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            email: email.trim(),
            fullName: fullName.trim(),
            roleToAssign,
            department: department.trim() || null,
            jobPosition: jobPosition.trim() || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.error || "Erreur lors de l'envoi de l'invitation");
        return;
      }

      toast.success(`✅ Invitation envoyée à ${email}`);

      // Reset form
      setEmail('');
      setFullName('');
      setRoleToAssign('employee');
      setDepartment('');
      setJobPosition('');

      onOpenChange(false);

      if (onInviteSuccess) {
        onInviteSuccess();
      }
    } catch (error) {
      console.error('Erreur invitation:', error);
      toast.error("Erreur lors de l'envoi de l'invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un collaborateur</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="collaborateur@example.com"
              autoFocus
            />
          </div>

          {/* Nom complet */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Nom complet *
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Jean Dupont"
            />
          </div>

          {/* Rôle */}
          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <Select value={roleToAssign} onValueChange={setRoleToAssign}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employé</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="hr_manager">Responsable RH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Département (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="department" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Département
            </Label>
            <Input
              id="department"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="Développement"
            />
          </div>

          {/* Poste (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="jobPosition" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Poste
            </Label>
            <Input
              id="jobPosition"
              value={jobPosition}
              onChange={e => setJobPosition(e.target.value)}
              placeholder="Développeur Full Stack"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleInvite} disabled={loading || !email.trim() || !fullName.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi...
              </>
            ) : (
              "Envoyer l'invitation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
