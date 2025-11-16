import React, { useState, useRef, useEffect } from 'react';
import { TableCell } from '@/components/ui/table';
import { Check, X, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHRMinimal } from '@/hooks/useHRMinimal';

interface EditableProjectManagerCellProps {
  value: string | { id: string; full_name: string } | null;
  onChange: (value: string) => Promise<void> | void;
  readOnly?: boolean;
  projectTenantId?: string; // 🔒 CRITIQUE : Filtrage sécurité multi-tenant
}

export const EditableProjectManagerCell: React.FC<EditableProjectManagerCellProps> = ({
  value,
  onChange,
  readOnly = false,
  projectTenantId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Récupérer la liste des employés
  const { employees } = useHRMinimal();

  // 🔒 FILTRAGE SÉCURITÉ CRITIQUE : Uniquement les employés du même tenant que le projet
  const filteredEmployees = React.useMemo(() => {
    if (!projectTenantId) {
      console.error(
        '🚨 SÉCURITÉ: projectTenantId manquant - Risque de fuite de données inter-tenant!'
      );
      return []; // ✅ Mode sécurisé : ne rien afficher si pas de tenant_id
    }

    const filtered = employees.filter(emp => emp.tenant_id === projectTenantId);

    console.log(
      `🔒 Filtrage sécurité: ${filtered.length}/${employees.length} employés du tenant ${projectTenantId}`
    );

    return filtered;
  }, [employees, projectTenantId]);

  // Normaliser la valeur pour obtenir le nom et l'ID
  const currentManagerName = React.useMemo(() => {
    if (!value) return 'Non assigné';
    if (typeof value === 'string') return value;
    return value.full_name || 'Non assigné';
  }, [value]);

  const currentManagerId = React.useMemo(() => {
    if (!value) return '';
    if (typeof value === 'string') return '';
    return value.id || '';
  }, [value]);

  useEffect(() => {
    setSelectedManagerId(currentManagerId);
  }, [currentManagerId]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!readOnly) {
      setIsEditing(true);
      setShowOptions(true);
    }
  };

  const handleSave = async () => {
    if (selectedManagerId === currentManagerId) {
      handleCancel();
      return;
    }

    setIsSaving(true);
    try {
      await onChange(selectedManagerId);
      setIsEditing(false);
      setShowOptions(false);
    } catch (error) {
      console.error('Error updating manager:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedManagerId(currentManagerId);
    setIsEditing(false);
    setShowOptions(false);
  };

  const handleSelectManager = async (managerId: string) => {
    setSelectedManagerId(managerId);

    // ✅ Sauvegarder automatiquement après sélection
    if (managerId !== currentManagerId) {
      setIsSaving(true);
      setShowOptions(false);
      try {
        await onChange(managerId);
        setIsEditing(false);
      } catch (error) {
        console.error('Error updating manager:', error);
        // Revenir à l'ancienne valeur en cas d'erreur
        setSelectedManagerId(currentManagerId);
        setShowOptions(true);
      } finally {
        setIsSaving(false);
      }
    } else {
      // Même valeur, juste fermer
      setIsEditing(false);
      setShowOptions(false);
    }
  };

  // Fermer le dropdown si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        handleCancel();
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  return (
    <TableCell className="py-2" onClick={e => e.stopPropagation()}>
      <div className="relative" ref={selectRef}>
        {!isEditing ? (
          <div
            onClick={handleClick}
            className={cn(
              'flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors',
              !readOnly && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800',
              readOnly && 'cursor-not-allowed opacity-60'
            )}
            title={readOnly ? 'Modification non autorisée' : 'Cliquer pour assigner'}
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{currentManagerName}</span>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Dropdown des employés */}
            {showOptions && (
              <div className="absolute left-0 top-0 z-50 max-h-60 w-64 overflow-y-auto rounded-md border bg-white shadow-lg dark:bg-gray-900">
                <div className="p-1">
                  {/* Option "Non assigné" */}
                  <div
                    className={cn(
                      'cursor-pointer rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800',
                      selectedManagerId === '' && 'bg-primary/10'
                    )}
                    onClick={() => handleSelectManager('')}
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Non assigné</span>
                    </div>
                  </div>

                  {/* Liste des employés - FILTRÉS PAR TENANT */}
                  {filteredEmployees.map(employee => (
                    <div
                      key={employee.id}
                      className={cn(
                        'cursor-pointer rounded px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800',
                        selectedManagerId === employee.id && 'bg-primary/10'
                      )}
                      onClick={() => handleSelectManager(employee.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{employee.full_name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Indicateur de sauvegarde automatique */}
            {isSaving && (
              <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Sauvegarde en cours...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </TableCell>
  );
};
