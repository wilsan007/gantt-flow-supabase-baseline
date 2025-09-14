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
import { useTaskCRUD, CreateTaskData } from '@/hooks/useTaskCRUD';
import { useEmployees } from '@/hooks/useEmployees';
import { SmartAssigneeSelect } from './SmartAssigneeSelect';
import { supabase } from '@/integrations/supabase/client';
import type { Task } from '@/hooks/useTasks';

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
  const { createTask, updateTask, loading } = useTaskCRUD();
  const { employees } = useEmployees();
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showSmartAssignee, setShowSmartAssignee] = useState(false);

  const [formData, setFormData] = useState<CreateTaskData>({
    title: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium',
    status: 'todo',
    effort_estimate_h: 1,
    description: ''
  });

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
    if (editTask) {
      setFormData({
        title: editTask.title,
        assignee_id: editTask.assignee || undefined,
        start_date: editTask.start_date,
        due_date: editTask.due_date,
        priority: editTask.priority,
        status: editTask.status,
        effort_estimate_h: editTask.effort_estimate_h,
        parent_id: editTask.parent_id || undefined,
        project_id: editTask.project_id || undefined,
        description: ''
      });
    } else if (parentTask) {
      setFormData(prev => ({
        ...prev,
        parent_id: parentTask.id,
        project_id: parentTask.project_id || undefined
      }));
    } else {
      setFormData({
        title: '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priority: 'medium',
        status: 'todo',
        effort_estimate_h: 1,
        description: ''
      });
    }
  }, [editTask, parentTask, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editTask) {
        await updateTask({ id: editTask.id, ...formData });
      } else {
        await createTask(formData);
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving task:', error);
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Nom de la tâche..."
              />
            </div>

            <div>
              <Label htmlFor="assignee">Assigné à</Label>
              <div className="space-y-2">
                <Select
                  value={formData.assignee_id || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assignee_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Non assigné</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <Label htmlFor="project">Projet</Label>
              <Select
                value={formData.project_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value }))}
              >
                <SelectTrigger>
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
            </div>

            <div>
              <Label htmlFor="department">Département</Label>
              <Select
                value={formData.department_id || ''}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department_id: value }))}
              >
                <SelectTrigger>
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
            </div>

            <div>
              <Label htmlFor="start_date">Date de début</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="due_date">Date d'échéance</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="priority">Priorité</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
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
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, effort_estimate_h: parseFloat(e.target.value) || 1 }))}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description détaillée de la tâche..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : editTask ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>

        <SmartAssigneeSelect
          open={showSmartAssignee}
          onOpenChange={setShowSmartAssignee}
          currentAssignee={formData.assignee_id}
          onAssigneeSelect={(employeeId) => {
            setFormData(prev => ({ ...prev, assignee_id: employeeId }));
          }}
          taskStartDate={formData.start_date}
          taskEndDate={formData.due_date}
          taskSkills={[]} // TODO: Extract from task description or add skill selection
        />
      </DialogContent>
    </Dialog>
  );
};