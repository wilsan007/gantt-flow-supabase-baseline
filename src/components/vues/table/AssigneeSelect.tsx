import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserPlus, Check, User, X } from '@/lib/icons';
import { useEmployees } from '@/hooks/useEmployees';
import { QuickInviteDialog } from '@/components/tasks/QuickInviteDialog';

interface AssigneeSelectProps {
  assignee: string | { full_name: string } | null | undefined;
  onChange: (value: string) => void;
  taskId: string;
  taskTenantId?: string; // Tenant ID de la tâche pour filtrer les profils
}

export const AssigneeSelect = ({
  assignee,
  onChange,
  taskId,
  taskTenantId,
}: AssigneeSelectProps) => {
  const { employees, loading, refetch } = useEmployees();
  const [isOpen, setIsOpen] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // 🔒 SÉCURITÉ STRICTE: FILTRER LES EMPLOYÉS PAR TENANT_ID DE LA TÂCHE
  const filteredEmployees = useMemo(() => {
    // 🚨 CRITIQUE: Si pas de tenant_id, ne rien afficher (sécurité)
    if (!taskTenantId) {
      console.warn('⚠️ SÉCURITÉ: Aucun tenant_id fourni pour la tâche, isolation impossible');
      return [];
    }

    // Filtrer STRICTEMENT par tenant_id
    const filtered = employees.filter(emp => emp.tenant_id === taskTenantId);

    // 🔒 LOG DE SÉCURITÉ: Vérifier l'isolation
    if (filtered.length === 0 && employees.length > 0) {
      console.warn('⚠️ SÉCURITÉ: Aucun employé trouvé pour tenant_id:', taskTenantId);
    }

    return filtered;
  }, [employees, taskTenantId]);

  const handleProfileSelect = (profileId: string) => {
    onChange(profileId);
    setIsOpen(false);
  };

  const handleUnassign = () => {
    onChange('');
    setIsOpen(false);
  };

  // Normaliser assignee (peut être string, objet, null, undefined)
  const normalizedAssignee = (() => {
    if (!assignee) return null;
    if (typeof assignee === 'string') return assignee;
    // Si c'est un objet avec full_name ou id
    return (assignee as any)?.full_name || (assignee as any)?.id || null;
  })();

  // Trouver l'employé assigné
  const assignedEmployee = normalizedAssignee
    ? filteredEmployees.find(
        e =>
          e.id === normalizedAssignee ||
          e.user_id === normalizedAssignee ||
          e.full_name === normalizedAssignee
      )
    : null;

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="hover:bg-accent h-auto w-full justify-start py-1 text-left font-normal"
          >
            {assignedEmployee ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignedEmployee.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {assignedEmployee.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{assignedEmployee.full_name}</span>
              </div>
            ) : (
              <div className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm">Non assigné</span>
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="bg-background w-80 border p-0" align="start">
          <div className="space-y-2 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Assigner à</h4>
              <span className="text-muted-foreground text-xs">
                {filteredEmployees.length} personne{filteredEmployees.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Liste des employés */}
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {loading ? (
                <div className="text-muted-foreground py-2 text-sm">Chargement...</div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-muted-foreground py-2 text-center text-sm">
                  Aucun employé disponible
                </div>
              ) : (
                filteredEmployees.map(employee => (
                  <button
                    key={employee.id}
                    onClick={() => handleProfileSelect(employee.user_id || employee.id)}
                    className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={employee.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {employee.full_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1">{employee.full_name}</span>
                    {assignedEmployee?.id === employee.id && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Bouton Inviter un collaborateur - EN BAS */}
            <div className="border-t pt-2">
              <Button
                onClick={() => {
                  setShowInviteDialog(true);
                  setIsOpen(false);
                }}
                variant="outline"
                className="w-full justify-start gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Inviter un collaborateur
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Dialog d'invitation */}
      <QuickInviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onInviteSuccess={() => {
          refetch();
        }}
      />
    </>
  );
};
