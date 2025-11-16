import React, { useState, useRef, useEffect } from 'react';
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface EditableCellProps {
  value: string | number;
  onChange: (value: string) => void;
  className?: string;
  isSubtask?: boolean;
  type?: 'text' | 'number';
  placeholder?: string;
  readOnly?: boolean;
}

export const EditableCell = ({
  value,
  onChange,
  className = '',
  isSubtask = false,
  type = 'text',
  placeholder = '',
  readOnly = false,
}: EditableCellProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(String(value || ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(String(value || ''));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== String(value)) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setLocalValue(String(value));
      setIsEditing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!readOnly) {
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  return (
    <TableCell
      className={cn(
        'group cursor-text transition-colors',
        isSubtask ? 'py-0 text-xs' : 'py-0',
        isEditing && 'bg-blue-50 dark:bg-blue-950',
        className
      )}
      style={{ height: isSubtask ? '51px' : '64px' }}
      onClick={handleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type={type}
          value={localValue}
          onChange={e => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full rounded border-none bg-transparent px-2 py-1 outline-none ring-2 ring-blue-500',
            isSubtask && 'text-xs'
          )}
          placeholder={placeholder}
        />
      ) : (
        <div
          className={cn(
            'rounded px-2 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
            isSubtask && 'text-xs',
            !value && 'italic text-muted-foreground'
          )}
        >
          {value || placeholder}
        </div>
      )}
    </TableCell>
  );
};
