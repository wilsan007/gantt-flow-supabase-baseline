import React, { useState, useRef, useEffect } from 'react';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Check, Loader2, AlertCircle } from 'lucide-react';

interface EditableProjectNameCellProps {
  value: string;
  onChange: (value: string) => Promise<void> | void;
  readOnly?: boolean;
  debounceMs?: number;
}

type SaveStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

export const EditableProjectNameCell: React.FC<EditableProjectNameCellProps> = ({
  value,
  onChange,
  readOnly = false,
  debounceMs = 800,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value || '');
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

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

  const handleSave = async (valueToSave: string) => {
    if (valueToSave === value || !valueToSave.trim()) {
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');

    try {
      await onChange(valueToSave);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Erreur sauvegarde nom projet:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (localValue !== value && localValue.trim()) {
      handleSave(localValue);
    }

    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      handleSave(localValue);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setLocalValue(value);
      setIsEditing(false);
      setSaveStatus('idle');
    }
  };

  const StatusIndicator = () => {
    if (saveStatus === 'saving') {
      return <Loader2 className="h-3 w-3 animate-spin text-blue-500" />;
    }
    if (saveStatus === 'saved') {
      return <Check className="h-3 w-3 text-green-500" />;
    }
    if (saveStatus === 'error') {
      return <AlertCircle className="h-3 w-3 text-red-500" />;
    }
    return null;
  };

  return (
    <TableCell className="py-2">
      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
        {isEditing && !readOnly ? (
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={e => handleLocalChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full rounded border-none bg-transparent px-2 py-1 font-semibold outline-none ring-2 ring-blue-500'
            )}
            placeholder="Nom du projet..."
          />
        ) : (
          <div
            onClick={() => !readOnly && setIsEditing(true)}
            className={cn(
              'w-full rounded px-2 py-1 font-semibold transition-colors',
              !readOnly && 'cursor-text hover:bg-gray-100 dark:hover:bg-gray-800',
              readOnly && 'cursor-not-allowed opacity-60',
              !value && 'text-muted-foreground'
            )}
            title={readOnly ? 'Modification non autorisée' : undefined}
          >
            {value || 'Nom du projet...'}
          </div>
        )}

        <StatusIndicator />
      </div>
    </TableCell>
  );
};
