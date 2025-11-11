import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { withUniversalDialog } from '@/components/ui/universal-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Flag,
  Tag,
  Link2,
  Plus,
  X,
  Target,
  FileText,
  Trash2,
  Building2,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  Save,
} from '@/lib/icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { type Task } from '@/hooks/optimized';

interface TaskAction {
  id: string;
  name: string;
  description?: string;
}

interface ModernTaskEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  onSave: (taskData: any) => void;
}

const ModernTaskEditDialogBase: React.FC<ModernTaskEditDialogProps> = ({
  open,
  onOpenChange,
  task,
  onSave,
}) => {
  // États de base
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'todo' | 'doing' | 'blocked' | 'done'>('todo');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [effortEstimate, setEffortEstimate] = useState<number>(0);
  const [department, setDepartment] = useState('');
  const [project, setProject] = useState('');

  // Actions de la tâche
  const [actions, setActions] = useState<TaskAction[]>([]);
  const [newActionName, setNewActionName] = useState('');
  const [newActionDescription, setNewActionDescription] = useState('');

  // UI States
  const [showDescription, setShowDescription] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);

  // Listes de données
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

  // Charger les données de la tâche
  useEffect(() => {
    if (task && open) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'todo');
      setStartDate(task.start_date ? new Date(task.start_date) : undefined);
      setDueDate(task.due_date ? new Date(task.due_date) : undefined);
      setAssignee(task.assignee || '');
      setPriority(task.priority || 'medium');
      setTags(task.tags || []);
      setEffortEstimate(task.effort_estimate || 0);
      setDepartment(task.department || '');
      setProject(task.project_id || '');
      setShowDescription(!!task.description);
      // Charger les actions existantes si disponibles
      if (task.task_actions && Array.isArray(task.task_actions)) {
        setActions(
          task.task_actions.map((action: any) => ({
            id: action.id?.toString() || Date.now().toString(),
            name: action.title || action.name || '',
            description: action.description || '',
          }))
        );
        setShowActions(task.task_actions.length > 0);
      }
    }
  }, [task, open]);

  // Gestion des tags
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Gestion des actions
  const addAction = () => {
    if (newActionName.trim()) {
      const newAction: TaskAction = {
        id: Date.now().toString(),
        name: newActionName.trim(),
        description: newActionDescription.trim() || undefined,
      };
      setActions([...actions, newAction]);
      setNewActionName('');
      setNewActionDescription('');
    }
  };

  const removeAction = (actionId: string) => {
    setActions(actions.filter(a => a.id !== actionId));
  };

  // Validation et enregistrement
  const handleSave = async () => {
    if (!task) return;

    if (!title.trim()) {
      alert('Le titre est obligatoire');
      return;
    }

    if (!assignee) {
      alert('Un responsable doit être assigné');
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        id: task.id,
        title: title.trim(),
        description: description.trim(),
        status,
        start_date: startDate,
        due_date: dueDate,
        assignee,
        priority,
        tags,
        effort_estimate: effortEstimate,
        department,
        project_id: project,
        actions,
      };

      await onSave(taskData);
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la modification de la tâche');
    } finally {
      setLoading(false);
    }
  };

  const statusIcons = {
    todo: '📝',
    doing: '⚡',
    blocked: '🚫',
    done: '✅',
  };

  const priorityIcons = {
    low: '🟢',
    medium: '🟡',
    high: '🟠',
    urgent: '🔴',
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto p-0">
        <div className="space-y-4 p-6">
          {/* Titre de la tâche - Style Notion */}
          <div className="space-y-2">
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nom de la tâche"
              className="h-auto border-none px-0 text-3xl font-bold shadow-none focus-visible:ring-0"
              autoFocus
            />
            {task.parent_id && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link2 className="h-4 w-4" />
                Sous-tâche
              </p>
            )}
          </div>

          {/* Propriétés principales - Layout côte à côte */}
          <div className="grid grid-cols-2 gap-4">
            {/* Colonne gauche */}
            <div className="space-y-3">
              {/* Statut */}
              <div className="flex items-center gap-3">
                <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Statut
                </Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">{statusIcons.todo} À faire</SelectItem>
                    <SelectItem value="doing">{statusIcons.doing} En cours</SelectItem>
                    <SelectItem value="blocked">{statusIcons.blocked} Bloqué</SelectItem>
                    <SelectItem value="done">{statusIcons.done} Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date de début */}
              <div className="flex items-center gap-3">
                <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  Début
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'flex-1 justify-start text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP', { locale: fr }) : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date d'échéance */}
              <div className="flex items-center gap-3">
                <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  Échéance
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'flex-1 justify-start text-left font-normal',
                        !dueDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, 'PPP', { locale: fr }) : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                      disabled={date => startDate && date < startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Responsable */}
              <div className="flex items-center gap-3">
                <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Responsable
                </Label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner" />
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

              {/* Priorité */}
              <div className="flex items-center gap-3">
                <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                  <Flag className="h-4 w-4" />
                  Priorité
                </Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{priorityIcons.low} Basse</SelectItem>
                    <SelectItem value="medium">{priorityIcons.medium} Moyenne</SelectItem>
                    <SelectItem value="high">{priorityIcons.high} Haute</SelectItem>
                    <SelectItem value="urgent">{priorityIcons.urgent} Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Colonne droite */}
            <div className="space-y-3">
              {/* Projet */}
              <div className="flex items-center gap-3">
                <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                  <FolderKanban className="h-4 w-4" />
                  Projet
                </Label>
                <Select value={project} onValueChange={setProject}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner" />
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

              {/* Département */}
              <div className="flex items-center gap-3">
                <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  Département
                </Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner" />
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

              {/* Effort estimé */}
              <div className="flex items-center gap-3">
                <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Effort (heures)
                </Label>
                <Input
                  type="number"
                  value={effortEstimate}
                  onChange={e => setEffortEstimate(Number(e.target.value))}
                  min="0"
                  className="flex-1"
                />
              </div>

              {/* Tags */}
              <div className="flex items-start gap-3">
                <Label className="flex w-32 items-center gap-2 pt-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  Tags
                </Label>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-1"
                      >
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={e => setNewTag(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addTag()}
                      placeholder="Ajouter un tag"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Description repliable */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              className="flex w-full items-center justify-between p-2"
              onClick={() => setShowDescription(!showDescription)}
            >
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                Description
              </span>
              {showDescription ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {showDescription && (
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ajouter une description détaillée..."
                className="min-h-[100px]"
              />
            )}
          </div>

          <Separator />

          {/* Actions repliables */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              className="flex w-full items-center justify-between p-2"
              onClick={() => setShowActions(!showActions)}
            >
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Actions ({actions.length})
              </span>
              {showActions ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {showActions && (
              <div className="space-y-3">
                {/* Liste des actions existantes */}
                {actions.map(action => (
                  <div key={action.id} className="flex items-start gap-2 rounded-md border p-3">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{action.name}</p>
                      {action.description && (
                        <p className="text-sm text-muted-foreground">{action.description}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeAction(action.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}

                {/* Ajouter une nouvelle action */}
                <div className="space-y-2 rounded-md border p-3">
                  <Input
                    value={newActionName}
                    onChange={e => setNewActionName(e.target.value)}
                    placeholder="Nom de l'action"
                  />
                  <Input
                    value={newActionDescription}
                    onChange={e => setNewActionDescription(e.target.value)}
                    placeholder="Description (optionnel)"
                  />
                  <Button type="button" onClick={addAction} className="w-full" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une action
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Boutons d'action */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={loading || !title.trim() || !assignee}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
// 🎨 Export avec support mobile automatique + thème Tasks
export const ModernTaskEditDialog = withUniversalDialog('tasks', ModernTaskEditDialogBase);
