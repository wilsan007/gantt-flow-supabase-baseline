import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useEmployees } from '@/hooks/useEmployees';
import { SmartAssigneeSelect } from './SmartAssigneeSelect';
import { supabase } from '@/integrations/supabase/client';
import type { Task, CreateTaskData } from '@/types/tasks';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { ErrorList, InlineError } from '@/components/ui/error-alert';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTask?: Task | null;
  parentTask?: Task | null;
  onSuccess: () => void;
}

interface Project {
  id: string;
  name: string;
}

interface Department {
  id: string;
  name: string;
}

export const TaskCreationDialog: React.FC<TaskCreationDialogProps> = ({
  open,
  onOpenChange,
  editTask,
  parentTask,
  onSuccess
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Fonctions CRUD locales
  const createTask = async (data: CreateTaskData) => {
    const { error } = await supabase.from('tasks').insert([data]);
    if (error) throw error;
  };
  
  const updateTask = async (id: string, data: Partial<CreateTaskData>) => {
    const { error } = await supabase.from('tasks').update(data).eq('id', id);
    if (error) throw error;
  };
  const { employees } = useEmployees();
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showSmartAssignee, setShowSmartAssignee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialFormData: CreateTaskData = {
    title: '',
    assigned_name: '',
    department_name: '',
    project_name: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium',
    status: 'todo',
    effort_estimate_h: 1,
    description: ''
  };

  const validationRules = {
    title: {
      required: true,
      minLength: 3,
      maxLength: 100
    },
    start_date: {
      required: true
    },
    due_date: {
      required: true,
      dateAfter: new Date().toISOString().split('T')[0]
    },
    effort_estimate_h: {
      required: true,
      custom: (value: number) => {
        if (value < 0.5) return 'L\'estimation doit être d\'au moins 0.5 heure.';
        if (value > 1000) return 'L\'estimation ne peut pas dépasser 1000 heures.';
        return null;
      }
    }
  };

  const {
    data: formData,
    updateField,
    handleBlur,
    validateForm,
    validateDateRange,
    fieldErrors,
    getFieldError,
    hasFieldError,
    clearAllErrors,
    resetForm,
    isValid
  } = useFormValidation(initialFormData, validationRules, {
    validateOnChange: true,
    validateOnBlur: true
  });

  const { errors, clearErrors, hasBlockingErrors } = useErrorHandler();

  // Charger les projets et départements
  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, departmentsRes] = await Promise.all([
          supabase.from('projects').select('id, name').order('name'),
          supabase.from('departments').select('id, name').order('name')
        ]);

        if (projectsRes.data) setProjects(projectsRes.data);
        if (departmentsRes.data) setDepartments(departmentsRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    if (open) {
      loadData();
    }
  }, [open]);

  // Initialiser le formulaire avec les données de la tâche à éditer
  useEffect(() => {
    if (open) {
      clearAllErrors();
      clearErrors();
      
      if (editTask) {
        const editData = {
          title: editTask.title,
          assigned_name: editTask.assigned_name || '',
          department_name: editTask.department_name || '',
          project_name: editTask.project_name || '',
          start_date: editTask.start_date,
          due_date: editTask.due_date,
          priority: editTask.priority,
          status: editTask.status,
          effort_estimate_h: editTask.effort_estimate_h,
          parent_id: editTask.parent_id || undefined,
          project_id: editTask.project_id || undefined,
          assignee_id: editTask.assignee_id || undefined,
          department_id: editTask.department_id || undefined,
          description: editTask.description || ''
        };
        Object.entries(editData).forEach(([key, value]) => {
          updateField(key, value);
        });
      } else if (parentTask) {
        // Héritage obligatoire de la tâche parente
        updateField('parent_id', parentTask.id);
        updateField('project_id', parentTask.project_id || undefined);
        updateField('department_id', parentTask.department_id || undefined);
        
        // Héritage de l'assignation si la tâche parente est assignée
        // L'utilisateur peut changer l'assignation, mais par défaut elle hérite
        if (parentTask.assignee_id) {
          updateField('assignee_id', parentTask.assignee_id);
        }
        
        // Contraindre les dates dans la plage de la tâche parent
        if (parentTask.start_date && parentTask.due_date) {
          updateField('start_date', parentTask.start_date);
          updateField('due_date', parentTask.due_date);
        }
      } else {
        resetForm();
      }
    }
  }, [editTask, parentTask, open, clearAllErrors, clearErrors, updateField, resetForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validation du formulaire
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Validation spéciale des dates si c'est une sous-tâche
      if (parentTask) {
        const dateError = validateDateRange(
          'start_date',
          'due_date',
          parentTask.start_date,
          parentTask.due_date,
          parentTask.title
        );
        if (dateError) {
          setIsSubmitting(false);
          return;
        }
      }

      // Validation des dates de base
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.due_date);
      if (endDate <= startDate) {
        const dateError = validateDateRange('start_date', 'due_date');
        if (dateError) {
          setIsSubmitting(false);
          return;
        }
      }

      // Soumission du formulaire
      if (editTask) {
        await updateTask(editTask.id, formData);
      } else {
        await createTask(formData);
      }
      
      onSuccess();
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Error saving task:', error);
      // L'erreur sera gérée par le hook useErrorHandler dans useTaskCRUD
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-500';
      case 'doing': return 'bg-blue-500';
      case 'blocked': return 'bg-red-500';
      case 'todo': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editTask ? 'Modifier la tâche' : parentTask ? 'Créer une sous-tâche' : 'Créer une nouvelle tâche'}
          </DialogTitle>
          <DialogDescription>
            {parentTask && (
              <div className="flex items-center gap-2 mt-2">
                <span>Sous-tâche de :</span>
                <Badge variant="outline">{parentTask.title}</Badge>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Affichage des erreurs globales */}
        {(errors.length > 0 || hasBlockingErrors) && (
          <div className="mb-4">
            <ErrorList
              errors={errors}
              onDismiss={(index) => clearErrors()}
              maxVisible={3}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                onBlur={() => handleBlur('title')}
                required
                placeholder="Nom de la tâche..."
                className={hasFieldError('title') ? 'border-red-500' : ''}
              />
              <InlineError error={getFieldError('title')} />
            </div>

            <div>
              <Label htmlFor="assignee">
                Assigné à {parentTask && parentTask.assignee_id && <span className="text-xs text-muted-foreground">(hérité du parent par défaut)</span>}
              </Label>
              <div className="space-y-2">
                <Select
                  value={formData.assignee_id || ''}
                  onValueChange={(value) => updateField('assignee_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non assigné</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name}
                        {parentTask && parentTask.assignee_id === employee.id && ' (parent)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {parentTask && parentTask.assignee_id && (
                  <p className="text-xs text-muted-foreground">
                    👤 Assigné par défaut : {employees.find(e => e.id === parentTask.assignee_id)?.full_name || 'Inconnu'}
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSmartAssignee(true)}
                  className="w-full"
                >
                  🎯 Sélection intelligente
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="project">
                Projet {parentTask && <span className="text-xs text-muted-foreground">(hérité du parent)</span>}
              </Label>
              <Select
                value={formData.project_id || ''}
                onValueChange={(value) => updateField('project_id', value)}
                disabled={!!parentTask}
              >
                <SelectTrigger className={parentTask ? 'bg-muted cursor-not-allowed' : ''}>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun projet</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {parentTask && (
                <p className="text-xs text-muted-foreground mt-1">
                  📁 Projet : {projects.find(p => p.id === formData.project_id)?.name || 'Aucun'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="department">
                Département {parentTask && <span className="text-xs text-muted-foreground">(hérité du parent)</span>}
              </Label>
              <Select
                value={formData.department_id || ''}
                onValueChange={(value) => updateField('department_id', value)}
                disabled={!!parentTask}
              >
                <SelectTrigger className={parentTask ? 'bg-muted cursor-not-allowed' : ''}>
                  <SelectValue placeholder="Sélectionner un département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun département</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {parentTask && (
                <p className="text-xs text-muted-foreground mt-1">
                  🏢 Département : {departments.find(d => d.id === formData.department_id)?.name || 'Aucun'}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="start_date">Date de début</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => {
                  updateField('start_date', e.target.value);
                  // Revalider la plage de dates si nécessaire
                  if (parentTask && formData.due_date) {
                    validateDateRange(
                      'start_date',
                      'due_date',
                      parentTask.start_date,
                      parentTask.due_date,
                      parentTask.title
                    );
                  }
                }}
                onBlur={() => handleBlur('start_date')}
                required
                className={hasFieldError('start_date') ? 'border-red-500' : ''}
                min={parentTask?.start_date}
                max={parentTask?.due_date}
              />
              <InlineError error={getFieldError('start_date')} />
              {parentTask && (
                <p className="text-xs text-muted-foreground mt-1">
                  Période autorisée : {new Date(parentTask.start_date).toLocaleDateString()} - {new Date(parentTask.due_date).toLocaleDateString()}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="due_date">Date d'échéance</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => {
                  updateField('due_date', e.target.value);
                  // Revalider la plage de dates si nécessaire
                  if (parentTask && formData.start_date) {
                    validateDateRange(
                      'start_date',
                      'due_date',
                      parentTask.start_date,
                      parentTask.due_date,
                      parentTask.title
                    );
                  }
                }}
                onBlur={() => handleBlur('due_date')}
                required
                className={hasFieldError('due_date') ? 'border-red-500' : ''}
                min={formData.start_date > (parentTask?.start_date || formData.start_date) ? formData.start_date : (parentTask?.start_date || formData.start_date)}
                max={parentTask?.due_date}
              />
              <InlineError error={getFieldError('due_date')} />
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => updateField('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor('low')}`} />
                      Faible
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor('medium')}`} />
                      Moyenne
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor('high')}`} />
                      Haute
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor('urgent')}`} />
                      Urgente
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => updateField('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor('todo')}`} />
                      À faire
                    </div>
                  </SelectItem>
                  <SelectItem value="doing">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor('doing')}`} />
                      En cours
                    </div>
                  </SelectItem>
                  <SelectItem value="blocked">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor('blocked')}`} />
                      Bloquée
                    </div>
                  </SelectItem>
                  <SelectItem value="done">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor('done')}`} />
                      Terminée
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="effort">Estimation (heures)</Label>
              <Input
                id="effort"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.effort_estimate_h}
                onChange={(e) => updateField('effort_estimate_h', parseFloat(e.target.value) || 1)}
                onBlur={() => handleBlur('effort_estimate_h')}
                required
                className={hasFieldError('effort_estimate_h') ? 'border-red-500' : ''}
              />
              <InlineError error={getFieldError('effort_estimate_h')} />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Description détaillée de la tâche..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="flex items-center gap-2">
              {hasBlockingErrors && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm">Veuillez corriger les erreurs avant de continuer</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  if (!hasBlockingErrors) {
                    onOpenChange(false);
                  }
                }}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading || isSubmitting || hasBlockingErrors || !isValid}
              >
                {isSubmitting ? 'Enregistrement...' : editTask ? 'Modifier' : 'Créer'}
              </Button>
            </div>
          </div>
        </form>

        <SmartAssigneeSelect
          open={showSmartAssignee}
          onOpenChange={setShowSmartAssignee}
          currentAssignee={formData.assignee_id}
          onAssigneeSelect={(employeeId) => {
            updateField('assignee_id', employeeId);
          }}
          taskStartDate={formData.start_date}
          taskEndDate={formData.due_date}
          taskSkills={[]} // TODO: Extract from task description or add skill selection
        />
      </DialogContent>
    </Dialog>
  );
};