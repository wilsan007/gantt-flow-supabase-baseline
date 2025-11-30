import React, { useState, useRef, useEffect } from 'react';
import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Check, Loader2 } from '@/lib/icons';
import { cn } from '@/lib/utils';

interface EditableTitleCellProps {
  value: string;
  onChange: (value: string) => Promise<void> | void;
  displayOrder: string;
  taskLevel: number;
  isSubtask: boolean;
  onActionClick: () => void; // + ou - selon isSubtask
  actionTitle: string;
  debounceMs?: number;
  readOnly?: boolean; // 🔒 Désactiver l'édition si pas de permission
  placeholder?: string;
}

type SaveStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

export const EditableTitleCell = ({
  value,
  onChange,
  displayOrder,
  taskLevel,
  isSubtask,
  onActionClick,
  actionTitle,
  debounceMs = 800,
  readOnly = false,
  placeholder,
}: EditableTitleCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value || '');
    }
  }, [value, isEditing]);

  // Focus automatique
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSave = async (valueToSave: string) => {
    if (valueToSave === value) {
      setSaveStatus('idle');
      return;
    }

    try {
      setSaveStatus('saving');
      await onChange(valueToSave);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleLocalChange = (newValue: string) => {
    setLocalValue(newValue);
    setSaveStatus('editing');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      handleSave(newValue);
    }, debounceMs);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      handleSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      handleSave(localValue);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      setSaveStatus('idle');
      setIsEditing(false);
    }
  };

  const StatusIndicator = () => {
    if (saveStatus === 'saving') {
      return <Loader2 className="ml-2 h-3 w-3 animate-spin text-blue-500" />;
    }
    if (saveStatus === 'saved') {
      return <Check className="ml-2 h-3 w-3 text-green-500" />;
    }
    return null;
  };

  return (
    <TableCell
      className={cn(
        'font-medium',
        isSubtask ? 'py-0 text-sm' : 'py-0',
        saveStatus === 'saving' && 'bg-yellow-50/50 dark:bg-yellow-950/50',
        saveStatus === 'saved' && 'bg-green-50/50 dark:bg-green-950/50'
      )}
      style={{ height: isSubtask ? '51px' : '64px' }}
    >
      <div className="flex items-center gap-1" style={{ paddingLeft: `${taskLevel * 20}px` }}>
        {/* Bouton + ou - */}
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.stopPropagation();
            onActionClick();
          }}
          className="h-6 w-6 flex-shrink-0 p-0 opacity-70 hover:opacity-100"
          title={actionTitle}
        >
          {isSubtask ? (
            <Trash2 className="text-destructive h-3 w-3" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </Button>

        {/* Numéro d'ordre */}
        <span
          className={cn('text-foreground/60 mr-2 flex-shrink-0', isSubtask ? 'text-xs' : 'text-xs')}
        >
          {displayOrder}
        </span>

        {/* Titre éditable */}
        <div className="flex min-w-0 flex-1 items-center" onClick={e => e.stopPropagation()}>
          {isEditing && !readOnly ? (
            <input
              ref={inputRef}
              value={localValue}
              onChange={e => handleLocalChange(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              disabled={readOnly}
              placeholder={placeholder}
              className={cn(
                'w-full rounded bg-transparent px-0.5 py-1 text-sm transition-colors outline-none',
                readOnly ? 'cursor-default' : 'hover:bg-muted/50 focus:bg-muted cursor-text',
                saveStatus === 'error' && 'text-destructive',
                isSubtask ? 'text-muted-foreground font-normal' : 'font-medium'
              )}
            />
          ) : (
            <div
              onClick={() => !readOnly && setIsEditing(true)}
              className={cn(
                'w-full truncate rounded px-2 py-1 transition-colors',
                !readOnly && 'hover:bg-primary/5 dark:hover:bg-primary/10 cursor-text',
                readOnly && 'cursor-not-allowed opacity-60',
                isSubtask ? 'text-foreground/70 text-xs italic' : 'text-foreground',
                !value && 'text-muted-foreground'
              )}
              title={readOnly ? 'Modification non autorisée' : undefined}
            >
              {value || 'Nom de la tâche...'}
            </div>
          )}

          {/* Indicateur de sauvegarde */}
          <StatusIndicator />
        </div>
      </div>
    </TableCell>
  );
};
