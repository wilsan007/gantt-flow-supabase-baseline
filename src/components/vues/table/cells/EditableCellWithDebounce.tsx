import React, { useState, useRef, useEffect } from 'react';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Check, Loader2 } from '@/lib/icons';

interface EditableCellWithDebounceProps {
  value: string | number;
  onChange: (value: string) => Promise<void> | void;
  className?: string;
  isSubtask?: boolean;
  type?: 'text' | 'number';
  placeholder?: string;
  readOnly?: boolean;
  debounceMs?: number; // Délai de debounce (défaut: 800ms)
}

type SaveStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

export const EditableCellWithDebounce = ({
  value,
  onChange,
  className = '',
  isSubtask = false,
  type = 'text',
  placeholder = '',
  readOnly = false,
  debounceMs = 800, // Comme Monday.com
}: EditableCellWithDebounceProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value || ''));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchroniser avec la valeur externe
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(String(value || ''));
    }
  }, [value, isEditing]);

  // Focus automatique en mode édition
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Cleanup du timer au démontage
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSave = async (valueToSave: string) => {
    if (valueToSave === String(value)) {
      setSaveStatus('idle');
      return; // Pas de changement
    }

    try {
      setSaveStatus('saving');
      await onChange(valueToSave);
      setSaveStatus('saved');

      // Retour à idle après 2s
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  const handleLocalChange = (newValue: string) => {
    setLocalValue(newValue);
    setSaveStatus('editing');

    // Annuler le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Créer un nouveau timer
    debounceTimerRef.current = setTimeout(() => {
      handleSave(newValue);
    }, debounceMs);
  };

  const handleBlur = () => {
    setIsEditing(false);

    // Sauvegarder immédiatement si en cours d'édition
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
      setLocalValue(String(value));
      setSaveStatus('idle');
      setIsEditing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!readOnly) {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  // Indicateur de statut
  const StatusIndicator = () => {
    if (saveStatus === 'saving') {
      return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
    }
    if (saveStatus === 'saved') {
      return <Check className="h-3 w-3 text-green-500" />;
    }
    if (saveStatus === 'error') {
      return <span className="text-xs text-red-500">✗</span>;
    }
    return null;
  };

  return (
    <TableCell
      className={cn(
        'group relative cursor-text transition-colors',
        isSubtask ? 'py-0 text-xs' : 'py-0',
        isEditing && 'bg-blue-50 dark:bg-blue-950',
        saveStatus === 'saving' && 'bg-yellow-50 dark:bg-yellow-950',
        saveStatus === 'saved' && 'bg-green-50 dark:bg-green-950',
        className
      )}
      style={{ height: isSubtask ? '51px' : '64px' }}
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        {isEditing ? (
          <input
            ref={inputRef}
            type={type}
            value={localValue}
            onChange={e => handleLocalChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              'flex-1 rounded border-none bg-transparent px-2 py-1 outline-none ring-2 ring-blue-500',
              isSubtask && 'text-xs'
            )}
            placeholder={placeholder}
          />
        ) : (
          <div
            className={cn(
              'flex-1 rounded px-2 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
              isSubtask && 'text-xs',
              !value && 'italic text-muted-foreground'
            )}
          >
            {value || placeholder}
          </div>
        )}

        {/* Indicateur de statut (petit, discret) */}
        {(saveStatus === 'saving' || saveStatus === 'saved') && (
          <div className="flex-shrink-0">
            <StatusIndicator />
          </div>
        )}
      </div>

      {/* Message d'erreur si échec */}
      {saveStatus === 'error' && (
        <div className="absolute -bottom-6 left-0 rounded bg-red-50 px-2 py-1 text-xs text-red-500 dark:bg-red-950">
          Erreur de sauvegarde
        </div>
      )}
    </TableCell>
  );
};
