/**
 * ChangeCompanyNameDialog - Modal de modification du nom d'entreprise
 * Accessible uniquement aux TENANT_ADMIN
 */

import React, { useState, useEffect } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useTenant } from '@/contexts/TenantContext';

interface ChangeCompanyNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName?: string;
}

export const ChangeCompanyNameDialog: React.FC<ChangeCompanyNameDialogProps> = ({
  open,
  onOpenChange,
  currentName = '',
}) => {
  const { toast } = useToast();
  const { currentTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState(currentName);

  // Mettre à jour quand le nom change
  useEffect(() => {
    setCompanyName(currentName);
  }, [currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!companyName.trim()) {
      toast({
        title: '❌ Nom requis',
        description: "Le nom de l'entreprise ne peut pas être vide",
        variant: 'destructive',
      });
      return;
    }

    if (companyName.trim() === currentName) {
      toast({
        title: 'ℹ️ Aucun changement',
        description: "Le nom est identique à l'actuel",
      });
      return;
    }

    if (!currentTenant?.id) {
      toast({
        title: '❌ Erreur',
        description: 'Tenant non trouvé',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('tenants')
        .update({ name: companyName.trim() })
        .eq('id', currentTenant.id)
        .select();

      if (error) {
        throw error;
      }

      toast({
        title: '✅ Nom modifié',
        description: `Le nom de l'entreprise a été changé en "${companyName.trim()}"`,
      });

      // Fermer le dialog et rafraîchir immédiatement
      onOpenChange(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Erreur modification nom entreprise:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de modifier le nom',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-[425px]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Modifier le nom de l'entreprise</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Entrez le nouveau nom de votre entreprise
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nom de l'entreprise</Label>
              <Input
                id="companyName"
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                disabled={loading}
                required
                placeholder="Ex: Acme Corporation"
              />
            </div>

            {currentName && (
              <div className="text-muted-foreground text-sm">
                <span className="font-medium">Nom actuel :</span> {currentName}
              </div>
            )}
          </div>

          <ResponsiveModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Modifier
            </Button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
