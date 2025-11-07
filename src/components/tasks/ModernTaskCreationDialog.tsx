import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TaskAction {
  id: string;
  name: string;
  description?: string;
}

interface ModernTaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (taskData: any) => void;
  parentTask?: {
    start_date?: Date;
    due_date?: Date;
    title?: string;
  };
}

export const ModernTaskCreationDialog: React.FC<ModernTaskCreationDialogProps> = ({
  open,
  onOpenChange,
  onCreateTask,
  parentTask,
}) => {
  // États de base
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'todo' | 'doing' | 'blocked' | 'done'>('todo');
  const [startDate, setStartDate] = useState<Date | undefined>(parentTask?.start_date);
  const [dueDate, setDueDate] = useState<Date | undefined>(parentTask?.due_date);
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

  // Validation des dates par rapport à la tâche parente
  const validateDate = (date: Date | undefined, type: 'start' | 'due'): boolean => {
    if (!date || !parentTask) return true;

    if (type === 'start' && parentTask.start_date) {
      if (date < parentTask.start_date) {
        return false;
      }
    }

    if (type === 'due' && parentTask.due_date) {
      if (date > parentTask.due_date) {
        return false;
      }
    }

    // Vérifier que la date de début est avant la date de fin
    if (type === 'start' && dueDate && date > dueDate) {
      return false;
    }

    if (type === 'due' && startDate && date < startDate) {
      return false;
    }

    return true;
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Le titre est obligatoire');
      return;
    }

    // Validation des dates
    if (startDate && !validateDate(startDate, 'start')) {
      alert(
        parentTask?.start_date
          ? `La date de début ne peut pas être avant ${format(parentTask.start_date, 'dd/MM/yyyy', { locale: fr })}`
          : 'Date de début invalide'
      );
      return;
    }

    if (dueDate && !validateDate(dueDate, 'due')) {
      alert(
        parentTask?.due_date
          ? `La date d'échéance ne peut pas être après ${format(parentTask.due_date, 'dd/MM/yyyy', { locale: fr })}`
          : "Date d'échéance invalide"
      );
      return;
    }

    setLoading(true);
    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        assignee,
        department,
        project,
        priority,
        status,
        start_date: startDate,
        due_date: dueDate,
        tags: tags.length > 0 ? tags : undefined,
        effort_estimate_h: effortEstimate > 0 ? effortEstimate : undefined,
        actions: actions.length > 0 ? actions : undefined,
      });

      // Reset
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la tâche');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('todo');
    setStartDate(undefined);
    setDueDate(undefined);
    setAssignee('');
    setPriority('medium');
    setTags([]);
    setActions([]);
    setEffortEstimate(0);
    setDepartment('');
    setProject('');
    setShowDescription(false);
    setShowActions(false);
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
            {parentTask?.title && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link2 className="h-4 w-4" />
                Sous-tâche de: {parentTask.title}
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
                      disabled={date =>
                        parentTask?.start_date ? date < parentTask.start_date : false
                      }
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
                      disabled={date => {
                        if (parentTask?.due_date && date > parentTask.due_date) return true;
                        if (startDate && date < startDate) return true;
                        return false;
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Temps estimé */}
              <div className="flex items-center gap-3">
                <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Temps (h)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={effortEstimate || ''}
                  onChange={e => setEffortEstimate(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Colonne droite */}
            <div className="space-y-3">
              {/* Assigné */}
              <div className="flex items-center gap-3">
                <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  Assigné
                </Label>
                <Select value={assignee} onValueChange={setAssignee}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Vide" />
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
                    <SelectItem value="low">{priorityIcons.low} Faible</SelectItem>
                    <SelectItem value="medium">{priorityIcons.medium} Moyenne</SelectItem>
                    <SelectItem value="high">{priorityIcons.high} Élevée</SelectItem>
                    <SelectItem value="urgent">{priorityIcons.urgent} Urgente</SelectItem>
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
                    <SelectValue placeholder="Vide" />
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

              {/* Projet */}
              <div className="flex items-center gap-3">
                <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                  <FolderKanban className="h-4 w-4" />
                  Projet
                </Label>
                <Select value={project} onValueChange={setProject}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Vide" />
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
            </div>
          </div>

          {/* Étiquettes */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Label className="flex w-32 items-center gap-2 text-sm text-muted-foreground">
                <Tag className="h-4 w-4" />
                Étiquettes
              </Label>
              <div className="flex flex-1 flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
                <div className="flex items-center gap-2">
                  <Input
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Ajouter..."
                    className="h-7 w-32 text-sm"
                  />
                  {newTag && (
                    <Button size="sm" variant="ghost" onClick={addTag} className="h-7 px-2">
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section Description */}
          <div className="space-y-2">
            {!showDescription ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDescription(true)}
                className="text-muted-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une description
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4" />
                    Description
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowDescription(false);
                      setDescription('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Décrivez la tâche..."
                  className="min-h-[100px]"
                />
              </div>
            )}
          </div>

          {/* Section Actions */}
          <div className="space-y-2">
            {!showActions ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowActions(true)}
                className="text-muted-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter des actions
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4" />
                    Actions de la tâche
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowActions(false);
                      setActions([]);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Liste des actions */}
                {actions.length > 0 && (
                  <div className="space-y-2">
                    {actions.map(action => (
                      <div
                        key={action.id}
                        className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{action.name}</p>
                          {action.description && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {action.description}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAction(action.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulaire d'ajout d'action */}
                <div className="space-y-2 rounded-lg border bg-muted/10 p-3">
                  <Input
                    value={newActionName}
                    onChange={e => setNewActionName(e.target.value)}
                    placeholder="Nom de l'action"
                    className="font-medium"
                  />
                  <Textarea
                    value={newActionDescription}
                    onChange={e => setNewActionDescription(e.target.value)}
                    placeholder="Description (optionnel)"
                    className="min-h-[60px] text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={addAction}
                    disabled={!newActionName.trim()}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter l'action
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Footer avec boutons */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-sm text-muted-foreground">
              {actions.length > 0 && `${actions.length} action(s)`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
                {loading ? 'Création...' : 'Créer la Tâche'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
