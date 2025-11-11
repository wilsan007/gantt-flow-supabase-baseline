/**
 * QuickTaskForm - Formulaire optimisé pour création rapide de tâches
 *
 * Fonctionnalités :
 * - Formulaire simplifié avec champs essentiels
 * - Auto-complétion et suggestions
 * - Templates pré-remplis
 * - Historique des créations récentes
 */

// @ts-nocheck

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Sparkles, CheckCircle2, AlertCircle, Clock, FileText, Bug, Zap } from '@/lib/icons';
import { useTasks } from '@/hooks/optimized';
import { useProjects } from '@/hooks/optimized';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { format } from 'date-fns';

interface TaskFormData {
  title: string;
  description: string;
  project_id: string;
  assigned_to: string;
  priority: 'high' | 'medium' | 'low';
  due_date: string;
  status: string;
}

interface Template {
  name: string;
  icon: React.ReactNode;
  color: string;
  data: Partial<TaskFormData>;
}

const templates: Template[] = [
  {
    name: 'Bug',
    icon: <Bug className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30',
    data: {
      title: '🐛 Bug: ',
      priority: 'high',
      status: 'todo',
    },
  },
  {
    name: 'Feature',
    icon: <Sparkles className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30',
    data: {
      title: '✨ Feature: ',
      priority: 'medium',
      status: 'todo',
    },
  },
  {
    name: 'Documentation',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30',
    data: {
      title: '📝 Doc: ',
      priority: 'low',
      status: 'todo',
    },
  },
  {
    name: 'Urgent',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30',
    data: {
      title: '⚡ Urgent: ',
      priority: 'high',
      status: 'todo',
      due_date: new Date().toISOString().split('T')[0],
    },
  },
];

export const QuickTaskForm: React.FC = () => {
  const { createTask, tasks, loading } = useTasks();
  const { projects } = useProjects();
  const { employees } = useHRMinimal();

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    priority: 'medium',
    due_date: '',
    status: 'todo',
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Historique des 5 dernières tâches créées
  const recentTasks = React.useMemo(() => {
    return [...tasks]
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [tasks]);

  const handleChange = (field: keyof TaskFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const applyTemplate = (template: Template) => {
    setFormData(prev => ({
      ...prev,
      ...template.data,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Le titre est obligatoire');
      return false;
    }
    if (!formData.project_id) {
      setError('Veuillez sélectionner un projet');
      return false;
    }
    if (!formData.due_date) {
      setError("La date d'échéance est obligatoire");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent, continueCreating: boolean = false) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await createTask({
        ...formData,
        start_date: new Date().toISOString(),
      });

      setSuccess(true);

      if (!continueCreating) {
        // Reset form
        setFormData({
          title: '',
          description: '',
          project_id: formData.project_id, // Garder le projet
          assigned_to: '',
          priority: 'medium',
          due_date: '',
          status: 'todo',
        });
      } else {
        // Reset seulement titre et description
        setFormData(prev => ({
          ...prev,
          title: '',
          description: '',
        }));
      }

      // Auto-hide success message
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la tâche');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Création Rapide</h2>
        <p className="text-muted-foreground">Créez une nouvelle tâche rapidement</p>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4" />
            Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {templates.map(template => (
              <Button
                key={template.name}
                variant="outline"
                size="sm"
                onClick={() => applyTemplate(template)}
                className={template.color}
              >
                {template.icon}
                <span className="ml-2">{template.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Formulaire Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4" />
            Nouvelle Tâche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={e => handleSubmit(e, false)} className="space-y-4">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="Ex: Corriger le bug de connexion"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                placeholder="Décrivez la tâche en détails..."
                rows={3}
              />
            </div>

            {/* Ligne 1 : Projet et Assigné à */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="project">
                  Projet <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.project_id}
                  onValueChange={value => handleChange('project_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Assigné à</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={value => handleChange('assigned_to', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une personne" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ligne 2 : Priorité et Échéance */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: any) => handleChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        Haute
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        Moyenne
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Basse
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">
                  Échéance <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={e => handleChange('due_date', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Messages */}
            {success && (
              <Alert className="border-green-200 bg-green-50 text-green-900">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Tâche créée avec succès ! ✅</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Boutons */}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting || loading} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting || loading}
                onClick={e => handleSubmit(e, true)}
              >
                Créer et Continuer
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Historique des créations récentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Créations Récentes ({recentTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="py-4 text-center text-muted-foreground">Aucune tâche récente</p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.created_at && format(new Date(task.created_at), 'dd/MM/yyyy HH:mm')}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
