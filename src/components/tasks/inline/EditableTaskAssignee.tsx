/**
 * 🎯 Édition Inline de l'Assigné
 * Pattern: Monday.com
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmployees } from '@/hooks/useEmployees';
import { User } from '@/lib/icons';

interface EditableTaskAssigneeProps {
  value: string | null;
  onChange: (value: string) => void;
  readOnly?: boolean;
  taskTenantId?: string; // 🔒 SÉCURITÉ: Filtrer par tenant de la tâche
}

export const EditableTaskAssignee = ({
  value,
  onChange,
  readOnly = false,
  taskTenantId,
}: EditableTaskAssigneeProps) => {
  const { employees, loading } = useEmployees();

  // 🔒 SÉCURITÉ STRICTE: Filtrer par tenant de la tâche
  const filteredEmployees = React.useMemo(() => {
    if (!taskTenantId) {
      console.warn('⚠️ SÉCURITÉ: Aucun tenant_id fourni pour la tâche');
      return [];
    }
    return employees.filter(e => e.tenant_id === taskTenantId);
  }, [employees, taskTenantId]);

  // Normaliser la valeur (peut être null, undefined, ou empty string)
  const normalizedValue = value || null;

  // Chercher l'employé assigné par id ou user_id DANS LES EMPLOYÉS FILTRÉS
  const assignee = normalizedValue
    ? filteredEmployees.find(e => e.id === normalizedValue || e.user_id === normalizedValue)
    : null;

  if (readOnly) {
    if (!assignee) {
      return (
        <div className="bg-secondary/50 text-muted-foreground flex items-center gap-1.5 rounded-md px-2 py-1 text-xs">
          <User className="h-3 w-3" />
          <span>Non assigné</span>
        </div>
      );
    }

    return (
      <div className="bg-primary/10 flex items-center gap-1.5 rounded-md px-2 py-1">
        <Avatar className="ring-primary/20 h-5 w-5 ring-1">
          <AvatarImage src={assignee.avatar_url} />
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
            {assignee.full_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium">{assignee.full_name}</span>
      </div>
    );
  }

  return (
    <Select
      value={normalizedValue || 'unassigned'}
      onValueChange={newValue => onChange(newValue === 'unassigned' ? '' : newValue)}
      disabled={loading}
    >
      <SelectTrigger className="hover:bg-accent h-auto w-auto min-w-[150px] rounded-md border-0 px-2 py-1 transition-colors">
        {assignee ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="ring-primary/20 h-5 w-5 ring-1">
              <AvatarImage src={assignee.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {assignee.full_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{assignee.full_name}</span>
          </div>
        ) : (
          <div className="text-muted-foreground flex items-center gap-1.5">
            <User className="h-3 w-3" />
            <span className="text-xs">Non assigné</span>
          </div>
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unassigned">
          <div className="text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Non assigné</span>
          </div>
        </SelectItem>
        {filteredEmployees.length === 0 && !loading ? (
          <div className="text-muted-foreground px-2 py-4 text-center text-xs">
            🔒 Aucun employé disponible dans ce tenant
          </div>
        ) : (
          filteredEmployees.map(emp => (
            <SelectItem key={emp.id} value={emp.id}>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={emp.avatar_url} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {emp.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{emp.full_name}</span>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};
