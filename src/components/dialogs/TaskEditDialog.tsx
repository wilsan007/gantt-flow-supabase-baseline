import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X } from 'lucide-react';
import { Task , type Task } from '@/hooks/useTasksEnterprise';

interface TaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave?: () => void;
}

export const TaskEditDialog: React.FC<TaskEditDialogProps> = ({
  open,
  onOpenChange,
  task,
  onSave
}) => {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState<string>('');
  const [priority, setPriority] = useState<string>('medium');
  const [status, setStatus] = useState<string>('todo');
  const [loading, setLoading] = useState(false);

  const availableAssignees = [
    'Ahmed Waleh', 'Sarah Martin', 
    'Jean Dupont', 'Marie Dubois', 'Pierre Moreau'
  ];

  useEffect(() => {
    if (task && open) {
      setTitle(task.title || '');
      const assigneeName = typeof task.assignee === 'object' && task.assignee?.full_name 
        ? task.assignee.full_name 
        : task.assigned_name || 'Ahmed Waleh';
      setAssignee(assigneeName);
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'todo');
    }
  }, [task, open]);

  const handleSave = async () => {
    if (!task) return;
    if (!assignee || assignee === 'Non assigné') {
      alert('Un responsable doit être assigné à la tâche');
      return;
    }
    setLoading(true);
    try {
      console.log('Mise à jour de la tâche:', { title, assignee, priority, status });
      onSave?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier la tâche
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre de la tâche"
              maxLength={80}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/80 caractères (limite pour préserver la mise en page)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsable *</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableAssignees.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Élevée</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={status} onValueChange={(value: any) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">À faire</SelectItem>
                <SelectItem value="doing">En cours</SelectItem>
                <SelectItem value="blocked">Bloqué</SelectItem>
                <SelectItem value="done">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading || !title.trim() || !assignee || assignee === 'Non assigné'}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
