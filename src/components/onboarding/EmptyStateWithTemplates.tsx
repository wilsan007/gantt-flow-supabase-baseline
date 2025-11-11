/**
 * 🎯 Empty State avec Templates d'Onboarding
 *
 * Affiche des tâches template quand un tenant n'a pas encore créé de tâches.
 * Pattern inspiré de Linear, Notion, Monday.com
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Rocket,
  Users,
  Target,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
} from '@/lib/icons';
import { cn } from '@/lib/utils';
import { TaskTemplate, getOnboardingTemplates } from '@/data/taskTemplates';

interface EmptyStateWithTemplatesProps {
  onUseTemplate: (template: TaskTemplate) => void;
  onDismiss: () => void;
  className?: string;
}

export function EmptyStateWithTemplates({
  onUseTemplate,
  onDismiss,
  className,
}: EmptyStateWithTemplatesProps) {
  const templates = getOnboardingTemplates();
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(templates[0]?.id || null);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'onboarding':
        return <Rocket className="h-5 w-5" />;
      case 'collaboration':
        return <Users className="h-5 w-5" />;
      case 'setup':
        return <Target className="h-5 w-5" />;
      default:
        return <CheckCircle2 className="h-5 w-5" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleExpand = (templateId: string) => {
    setExpandedTemplate(expandedTemplate === templateId ? null : templateId);
  };

  return (
    <div className={cn('mx-auto w-full max-w-5xl space-y-6 p-6', className)}>
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="flex items-center justify-center gap-2 text-primary">
          <Sparkles className="h-8 w-8" />
          <h2 className="text-3xl font-bold">Bienvenue sur Wadashaqayn! 🎉</h2>
        </div>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Vous n'avez pas encore de tâches. Commencez avec ces templates pour découvrir comment
          organiser votre travail efficacement.
        </p>
      </div>

      {/* Templates Cards */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
        {templates.map((template, index) => {
          const isExpanded = expandedTemplate === template.id;
          const completedActions = template.actions.filter(a => a.is_done).length;
          const progress = (completedActions / template.actions.length) * 100;

          return (
            <Card
              key={template.id}
              className={cn(
                'border-2 transition-all duration-200 hover:shadow-lg',
                isExpanded && 'ring-2 ring-primary/20'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-1 items-start gap-3">
                    <div className="mt-1">{getCategoryIcon(template.category)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-xl">{template.title}</CardTitle>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getPriorityColor(template.priority))}
                        >
                          {template.priority === 'high' && '⚡ Prioritaire'}
                          {template.priority === 'medium' && '📌 Important'}
                          {template.priority === 'low' && '💡 Recommandé'}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm">{template.description}</CardDescription>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.estimatedTime}
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {template.actions.length} étapes
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleExpand(template.id)}
                    className="shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Progress */}
                {progress > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progression</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                )}
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-4 pt-0">
                  {/* Help Text */}
                  <div className="rounded-lg border border-primary/10 bg-primary/5 p-3 text-sm">
                    <p className="text-primary/80">💡 {template.helpText}</p>
                  </div>

                  {/* Actions List */}
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4" />
                      Étapes à suivre:
                    </h4>
                    <div className="space-y-2">
                      {template.actions.map((action, actionIndex) => (
                        <div
                          key={action.id}
                          className={cn(
                            'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                            action.is_done
                              ? 'border-green-200 bg-green-50'
                              : 'bg-background hover:bg-muted/50'
                          )}
                        >
                          <Checkbox checked={action.is_done} disabled className="mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-muted-foreground">
                                {actionIndex + 1}.
                              </span>
                              <p
                                className={cn(
                                  'text-sm font-medium',
                                  action.is_done && 'text-muted-foreground line-through'
                                )}
                              >
                                {action.title}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">{action.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={() => onUseTemplate(template)} className="flex-1" size="lg">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Utiliser ce template
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-center gap-4 border-t pt-4">
        <Button variant="outline" onClick={onDismiss} className="gap-2">
          <X className="h-4 w-4" />
          Masquer les templates
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            // Ouvrir la documentation ou guide
            window.open('/help', '_blank');
          }}
          className="gap-2"
        >
          📚 Voir le guide complet
        </Button>
      </div>

      {/* Bottom tip */}
      <p className="text-center text-xs text-muted-foreground">
        💡 Astuce: Vous pourrez toujours créer vos propres tâches avec le bouton "+ Nouvelle tâche"
      </p>
    </div>
  );
}
