/**
 * QuickTaskForm - Création rapide de tâches (Futuristic Edition 🚀)
 *
 * Design : Glassmorphism, Inputs Glow, Templates Vibrants
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Sparkles,
  Zap,
  Calendar,
  Briefcase,
  ArrowRight,
  Layout,
  CheckCircle2,
} from 'lucide-react';
import { useTasks } from '@/hooks/optimized';
import { useToast } from '@/hooks/use-toast';
import { ModernTaskCreationDialog } from './ModernTaskCreationDialog';

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
  {
    id: 'client',
    title: 'Appel Client',
    icon: <Briefcase className="h-5 w-5 text-emerald-500" />,
    description: 'Suivi ou prospection',
    priority: 'high',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/30',
    hover: 'hover:shadow-emerald-500/20',
  },
];

export const QuickTaskForm: React.FC = () => {
  const { createTask, loading } = useTasks();
  const { toast } = useToast();

  const [quickTitle, setQuickTitle] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [initialValues, setInitialValues] = useState<any>(null);

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    try {
      await createTask({
        title: quickTitle,
        status: 'todo',
        priority: 'medium',
      });

      toast({
        title: 'Tâche créée ! 🚀',
        description: 'Votre tâche a été ajoutée avec succès.',
      });

      setQuickTitle('');
    } catch (error) {
      console.error('Erreur création tâche:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la tâche.',
        variant: 'destructive',
      });
    }
  };

  const openTemplateModal = (template: (typeof TASK_TEMPLATES)[0]) => {
    setInitialValues({
      title: template.title,
      description: template.description,
      priority: template.priority,
    });
    setIsDialogOpen(true);
  };

  const openBlankModal = () => {
    setInitialValues(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="animate-in fade-in-50 space-y-8 pb-20 duration-700">
      {/* Section Création Inline */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-white/50 to-white/30 shadow-xl backdrop-blur-xl dark:from-slate-900/50 dark:to-slate-900/30">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-cyan-500/5" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Layout className="h-5 w-5 text-violet-500" />
            Création Rapide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleQuickAdd} className="flex gap-4">
            <div className="group relative flex-1">
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 opacity-20 blur transition duration-500 group-hover:opacity-50" />
              <Input
                placeholder="Ajouter une tâche rapidement + Entrée..."
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                className="bg-background relative h-12 border-transparent text-lg shadow-sm focus:border-violet-500"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !quickTitle.trim()}
              className="h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-105 hover:from-violet-700 hover:to-fuchsia-700"
            >
              <Plus className="mr-2 h-5 w-5" />
              Ajouter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Section Templates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-muted-foreground px-1 text-lg font-semibold">Modèles & Actions</h3>
          <Button variant="outline" onClick={openBlankModal} className="gap-2">
            <Plus className="h-4 w-4" />
            Tâche Complète
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TASK_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => openTemplateModal(template)}
              className={`group relative flex flex-col gap-3 rounded-xl border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${template.border} bg-gradient-to-br ${template.gradient} ${template.hover}`}
            >
              <div className="flex items-center justify-between">
                <div className="bg-background/80 rounded-full p-2.5 shadow-sm backdrop-blur-sm transition-transform group-hover:scale-110">
                  {template.icon}
                </div>
                <div className="opacity-0 transition-opacity group-hover:opacity-100">
                  <ArrowRight className="text-muted-foreground h-5 w-5" />
                </div>
              </div>

              <div>
                <div className="text-lg font-semibold">{template.title}</div>
                <div className="text-muted-foreground/80 mt-1 text-sm font-medium">
                  {template.description}
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2 text-xs font-medium opacity-60">
                <span
                  className={`rounded-full border px-2 py-0.5 ${
                    template.priority === 'high'
                      ? 'border-red-200 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : template.priority === 'medium'
                        ? 'border-orange-200 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                        : 'border-blue-200 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}
                >
                  {template.priority === 'high'
                    ? 'Haute'
                    : template.priority === 'medium'
                      ? 'Moyenne'
                      : 'Basse'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal de Création Complète */}
      <ModernTaskCreationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onCreateTask={createTask}
        initialValues={initialValues}
      />
    </div>
  );
};
