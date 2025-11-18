/**
 * 🎯 Édition Inline du Titre de Tâche
 * Pattern: Monday.com / Notion
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { CheckCircle2, X } from '@/lib/icons';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditableTaskTitleProps {
  value: string;
  onChange: (value: string) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export const EditableTaskTitle = ({
  value,
  onChange,
  readOnly = false,
  className,
}: EditableTaskTitleProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue.trim() === '') {
      setEditValue(value);
      setIsEditing(false);
      return;
    }

    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onChange(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur sauvegarde titre:', error);
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (readOnly) {
    return <span className={cn('font-medium', className)}>{value}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          autoFocus
          className={cn('h-8 font-medium', className)}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isSaving}
          className="h-7 w-7 p-0"
        >
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group hover:text-primary flex cursor-pointer items-center gap-2 font-medium',
        className
      )}
      onClick={() => setIsEditing(true)}
    >
      <span>{value}</span>
      <Pencil className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
};
