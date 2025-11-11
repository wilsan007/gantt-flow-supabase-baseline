import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Save, X, BookTemplate, Sparkles } from '@/lib/icons';
import { useTaskTemplates } from '@/hooks/useTaskTemplates';
import { TemplateManagementDialog } from '@/components/tasks/TemplateManagementDialog';
import { Separator } from '@/components/ui/separator';

interface TaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (taskData: {
    title: string;
    assignee: string;
    department: string;
    project: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'todo' | 'doing' | 'blocked' | 'done';
    effort_estimate_h: number;
  }) => void;
}

const TaskCreationDialogBase: React.FC<TaskCreationDialogProps> = ({
  open,
  onOpenChange,
  onCreateTask,
}) => {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('Ahmed Waleh');
  const [department, setDepartment] = useState('Développement');
  const [project, setProject] = useState('Gantt Flow Next');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [status, setStatus] = useState<'todo' | 'doing' | 'blocked' | 'done'>('todo');
  const [effortEstimate, setEffortEstimate] = useState(8);
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const { templates, incrementUsage } = useTaskTemplates();

  const availableAssignees = [
    'Ahmed Waleh',
    'Sarah Martin',
    'Jean Dupont',
    'Marie Dubois',
    'Pierre Moreau',
  ];
  const availableDepartments = ['Développement', 'Marketing', 'Ventes', 'RH', 'Finance', 'Support'];
  const availableProjects = [
    'Gantt Flow Next',
    'Site Web Corporate',
    'App Mobile',
    'Migration DB',
    'Formation',
  ];

  // Appliquer un template
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const data = template.template_data;
    setTitle(data.title);
    if (data.priority) setPriority(data.priority);
    if (data.status) setStatus(data.status);
    if (data.effort_estimate_h) setEffortEstimate(data.effort_estimate_h);

    // Incrémenter le compteur d'utilisation
    incrementUsage(templateId);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Le titre est obligatoire');
      return;
    }
    if (!assignee || !department || !project) {
      alert('Tous les champs obligatoires doivent être remplis');
      return;
    }

    setLoading(true);
    try {
      await onCreateTask({
        title: title.trim(),
        assignee,
        department,
        project,
        priority,
        status,
        effort_estimate_h: effortEstimate,
      });

      // Reset form
      setTitle('');
      setAssignee('Ahmed Waleh');
      setDepartment('Développement');
      setProject('Gantt Flow Next');
      setPriority('medium');
      setStatus('todo');
      setEffortEstimate(8);

      onOpenChange(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la tâche');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Créer une Nouvelle Tâche
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sélection template */}
          {templates.length > 0 && (
            <>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Utiliser un template
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedTemplateId}
                    onValueChange={value => {
                      setSelectedTemplateId(value);
                      applyTemplate(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}{' '}
                          {template.usage_count > 0 && `(⭐ ${template.usage_count})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <TemplateManagementDialog />
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la tâche *</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nom de la tâche..."
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 caractères</p>
          </div>

          {/* Responsable et Département */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsable *</Label>
              <Select value={assignee} onValueChange={setAssignee}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableAssignees.map(person => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Département *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Projet et Priorité */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Projet *</Label>
              <Select value={project} onValueChange={setProject}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableProjects.map(proj => (
                    <SelectItem key={proj} value={proj}>
                      {proj}
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
                  <SelectItem value="low">🟢 Faible</SelectItem>
                  <SelectItem value="medium">🟡 Moyenne</SelectItem>
                  <SelectItem value="high">🟠 Élevée</SelectItem>
                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Statut et Effort */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut initial</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">📝 À faire</SelectItem>
                  <SelectItem value="doing">⚡ En cours</SelectItem>
                  <SelectItem value="blocked">🚫 Bloqué</SelectItem>
                  <SelectItem value="done">✅ Terminé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Charge estimée (heures)</Label>
              <Input
                type="number"
                min="0.5"
                step="0.5"
                value={effortEstimate}
                onChange={e => setEffortEstimate(parseFloat(e.target.value) || 1)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || !assignee || !department || !project}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Création...' : 'Créer la Tâche'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
// 🎨 Export avec support mobile automatique + thème Tasks
export const TaskCreationDialog = withUniversalDialog('tasks', TaskCreationDialogBase);
