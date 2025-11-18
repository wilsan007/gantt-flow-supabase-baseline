import React, { useState, useRef, useEffect } from 'react';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { DollarSign, Check, Loader2, AlertCircle } from 'lucide-react';

interface EditableProjectBudgetCellProps {
  value: number | null;
  onChange: (value: number) => Promise<void> | void;
  readOnly?: boolean;
  debounceMs?: number;
  currency?: string;
}

type SaveStatus = 'idle' | 'editing' | 'saving' | 'saved' | 'error';

export const EditableProjectBudgetCell: React.FC<EditableProjectBudgetCellProps> = ({
  value,
  onChange,
  readOnly = false,
  debounceMs = 800,
  currency = '€',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value?.toString() || '');
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleLocalChange = (newValue: string) => {
    // Autoriser seulement les nombres
    const sanitized = newValue.replace(/[^0-9.]/g, '');
    setLocalValue(sanitized);
    setSaveStatus('editing');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      handleSave(sanitized);
    }, debounceMs);
  };

  const handleSave = async (valueToSave: string) => {
    const numValue = parseFloat(valueToSave);

    if (isNaN(numValue) || numValue === value) {
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');

    try {
      await onChange(numValue);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Erreur sauvegarde budget:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleBlur = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (localValue && parseFloat(localValue) !== value) {
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
      setLocalValue(value?.toString() || '');
      setIsEditing(false);
      setSaveStatus('idle');
    }
  };

  const formatBudget = (budget: number | null) => {
    if (budget === null || budget === undefined) return '-';
    return (
      new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(budget) +
      ' ' +
      currency
    );
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
        <DollarSign className="text-muted-foreground h-4 w-4 shrink-0" />

        {isEditing && !readOnly ? (
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={e => handleLocalChange(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full rounded border-none bg-transparent px-2 py-1 ring-2 ring-blue-500 outline-none'
            )}
            placeholder="0"
          />
        ) : (
          <div
            onClick={() => !readOnly && setIsEditing(true)}
            className={cn(
              'rounded px-2 py-1 transition-colors',
              !readOnly && 'cursor-text hover:bg-gray-100 dark:hover:bg-gray-800',
              readOnly && 'cursor-not-allowed opacity-60'
            )}
            title={readOnly ? 'Modification non autorisée' : undefined}
          >
            {formatBudget(value)}
          </div>
        )}

        <StatusIndicator />
      </div>
    </TableCell>
  );
};
