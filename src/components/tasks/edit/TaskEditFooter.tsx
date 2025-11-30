import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from '@/lib/icons';

interface TaskEditFooterProps {
  onCancel: () => void;
  onSave: () => void;
  loading: boolean;
  canSave: boolean;
}

export const TaskEditFooter: React.FC<TaskEditFooterProps> = ({
  onCancel,
  onSave,
  loading,
  canSave,
}) => {
  return (
    <div className="border-border bg-background flex justify-end gap-2 border-t px-6 py-4">
      <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
        Annuler
      </Button>
      <Button onClick={onSave} disabled={loading || !canSave}>
        <Save className="mr-2 h-4 w-4" />
        {loading ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </div>
  );
};
