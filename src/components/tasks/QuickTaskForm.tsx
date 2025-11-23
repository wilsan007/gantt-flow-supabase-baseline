/**
 * QuickTaskForm - Création rapide de tâches (Futuristic Edition 🚀)
 *
 * Design : Glassmorphism, Inputs Glow, Templates Vibrants
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Sparkles,
  Zap,
  Calendar,
  Flag,
  Briefcase,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { useTasks } from '@/hooks/optimized';
import { useProjects } from '@/hooks/optimized';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const TASK_TEMPLATES = [
  {
    id: 'bug',
    title: 'Signaler un Bug',
    icon: <Zap className="h-5 w-5 text-rose-500" />,
    description: 'Rapport de bug urgent',
    priority: 'high',
    gradient: 'from-rose-500/20 to-orange-500/20',
    border: 'border-rose-500/30',
    hover: 'hover:shadow-rose-500/20',
  },
  {
    id: 'feature',
    title: 'Nouvelle Feature',
    icon: <Sparkles className="h-5 w-5 text-violet-500" />,
    description: 'Idée ou fonctionnalité',
    priority: 'medium',
    gradient: 'from-violet-500/20 to-fuchsia-500/20',
    border: 'border-violet-500/30',
    hover: 'hover:shadow-violet-500/20',
  },
  {
    id: 'meeting',
    title: 'Réunion',
    icon: <Calendar className="h-5 w-5 text-blue-500" />,
    description: 'Préparation de réunion',
    priority: 'medium',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    border: 'border-blue-500/30',
    hover: 'hover:shadow-blue-500/20',
  },
];

export const QuickTaskForm: React.FC = () => {
  const { createTask, loading } = useTasks();
  const { projects } = useProjects();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [projectId, setProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createTask({
        title,
        description,
        priority: priority as any,
        project_id: projectId || undefined,
        due_date: dueDate || undefined,
        status: 'todo',
      });

      toast({
        title: 'Tâche créée ! 🚀',
        description: 'Votre tâche a été ajoutée avec succès.',
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setProjectId('');
      setDueDate('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Erreur création tâche:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la tâche.',
        variant: 'destructive',
      });
    }
  };

  const applyTemplate = (template: (typeof TASK_TEMPLATES)[0]) => {
    setTitle(template.title + ': ');
    setPriority(template.priority);
    setIsExpanded(true);
  };

  return (
    <div className="animate-in fade-in-50 grid gap-8 duration-700 lg:grid-cols-3">
      {/* Formulaire Principal */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-white/50 to-white/30 shadow-2xl backdrop-blur-xl lg:col-span-2 dark:from-slate-900/50 dark:to-slate-900/30">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-cyan-500/5" />

        <CardHeader>
          <CardTitle className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-2xl text-transparent">
            <Plus className="h-6 w-6 text-violet-500" />
            Nouvelle Tâche
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre avec effet Glow */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">
                Titre de la tâche
              </Label>
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-20 blur transition duration-500 group-hover:opacity-50" />
                <Input
                  id="title"
                  placeholder="Ex: Réviser la maquette..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onFocus={() => setIsExpanded(true)}
                  className="bg-background/80 relative h-12 border-transparent text-lg shadow-sm focus:border-violet-500"
                />
              </div>
            </div>

            {/* Champs Étendus */}
            <div
              className={`space-y-6 overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="grid gap-6 md:grid-cols-2">
                {/* Projet */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="text-muted-foreground h-4 w-4" />
                    Projet
                  </Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="bg-background/50 backdrop-blur-sm">
                      <SelectValue placeholder="Sélectionner un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priorité */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Flag className="text-muted-foreground h-4 w-4" />
                    Priorité
                  </Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="bg-background/50 backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date d'échéance */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="text-muted-foreground h-4 w-4" />
                    Échéance
                  </Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="bg-background/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Détails supplémentaires..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="bg-background/50 min-h-[100px] resize-none backdrop-blur-sm"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsExpanded(false)}>
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:from-violet-700 hover:to-fuchsia-700"
                >
                  {loading ? 'Création...' : 'Créer la tâche'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Templates Rapides */}
      <div className="space-y-4">
        <h3 className="text-muted-foreground px-1 text-lg font-semibold">Modèles Rapides</h3>
        <div className="grid gap-4">
          {TASK_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => applyTemplate(template)}
              className={`group relative flex items-center gap-4 rounded-xl border p-4 text-left transition-all duration-300 hover:-translate-y-1 ${template.border} bg-gradient-to-r ${template.gradient} ${template.hover}`}
            >
              <div className="bg-background/80 rounded-full p-2.5 shadow-sm backdrop-blur-sm transition-transform group-hover:scale-110">
                {template.icon}
              </div>
              <div>
                <div className="font-semibold">{template.title}</div>
                <div className="text-muted-foreground/80 text-xs font-medium">
                  {template.description}
                </div>
              </div>
              <div className="absolute right-4 opacity-0 transition-opacity group-hover:opacity-100">
                <Plus className="text-muted-foreground h-5 w-5" />
              </div>
            </button>
          ))}
        </div>

        {/* Astuce */}
        <Card className="mt-6 border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
          <CardContent className="flex gap-3 p-4">
            <div className="h-fit rounded-full bg-indigo-500/20 p-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Astuce Pro</p>
              <p className="text-muted-foreground text-xs">
                Utilisez <kbd className="bg-muted rounded border px-1 py-0.5 text-[10px]">Ctrl</kbd>{' '}
                + <kbd className="bg-muted rounded border px-1 py-0.5 text-[10px]">Enter</kbd> pour
                créer rapidement une tâche.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
