import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { withUniversalDialog } from '@/components/ui/universal-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  Clock,
  User,
  Calendar,
  Target,
  CheckCircle,
  DollarSign,
  Users,
  TrendingUp,
  FileText,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';
import { ComputedAlert } from '@/hooks/useComputedAlerts';
import { useAlertSolutions, AlertSolution } from '@/hooks/useAlertSolutions';
import { useToast } from '@/hooks/use-toast';

interface AlertDetailDialogProps {
  alert: ComputedAlert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertDetailDialogBase: React.FC<AlertDetailDialogProps> = ({ alert, open, onOpenChange }) => {
  const [solutions, setSolutions] = useState<AlertSolution[]>([]);
  const [loadingSolutions, setLoadingSolutions] = useState(false);
  const { getSolutionsForAlertType } = useAlertSolutions();
  const { toast } = useToast();

  useEffect(() => {
    if (alert && open) {
      loadSolutions();
    }
  }, [alert, open]);

  const loadSolutions = async () => {
    if (!alert) return;

    setLoadingSolutions(true);
    try {
      const alertSolutions = await getSolutionsForAlertType(alert.type);
      setSolutions(alertSolutions);
    } catch (error) {
      console.error('Erreur lors du chargement des solutions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les solutions recommandées',
        variant: 'destructive',
      });
    } finally {
      setLoadingSolutions(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getCostLevelBadge = (costLevel: string) => {
    switch (costLevel) {
      case 'low':
        return { variant: 'default' as const, label: 'Faible' };
      case 'medium':
        return { variant: 'secondary' as const, label: 'Moyen' };
      case 'high':
        return { variant: 'destructive' as const, label: 'Élevé' };
      default:
        return { variant: 'outline' as const, label: 'Non défini' };
    }
  };

  const getImplementationTimeLabel = (time: string) => {
    switch (time) {
      case 'immediate':
        return 'Immédiat';
      case 'short_term':
        return 'Court terme';
      case 'medium_term':
        return 'Moyen terme';
      case 'long_term':
        return 'Long terme';
      default:
        return time;
    }
  };

  if (!alert) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AlertTriangle className={`h-6 w-6 ${getSeverityColor(alert.severity)}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {alert.title}
                <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                  {alert.severity.toUpperCase()}
                </Badge>
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Analyse détaillée et recommandations pour résoudre cette alerte
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations de l'alerte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Type d'alerte
                  </div>
                  <div className="font-medium">{alert.code}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4" />
                    Catégorie
                  </div>
                  <Badge variant="outline">{alert.category}</Badge>
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    Déclenché le
                  </div>
                  <div className="text-sm">
                    {new Date(alert.triggered_at).toLocaleString('fr-FR')}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    Entité concernée
                  </div>
                  <div className="font-medium">
                    {alert.entity_name || 'Non spécifiée'}
                    {alert.entity_type && (
                      <span className="text-muted-foreground ml-2 text-sm">
                        ({alert.entity_type})
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4" />
                    Niveau de sévérité
                  </div>
                  <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="text-muted-foreground text-sm font-medium">
                  Description détaillée
                </div>
                <p className="text-sm leading-relaxed">{alert.description}</p>
              </div>

              {alert.context_data && Object.keys(alert.context_data).length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <div className="text-muted-foreground text-sm font-medium">
                      Données contextuelles
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {Object.entries(alert.context_data).map(([key, value]) => (
                        <div key={key} className="bg-muted/50 rounded-lg p-3">
                          <div className="text-muted-foreground text-xs capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </div>
                          <div className="text-sm font-medium">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Solutions recommandées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Solutions recommandées
                {loadingSolutions && (
                  <div className="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSolutions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="border-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" />
                    <p className="text-muted-foreground text-sm">Chargement des solutions...</p>
                  </div>
                </div>
              ) : solutions.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <Lightbulb className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>Aucune solution spécifique trouvée pour ce type d'alerte</p>
                  <p className="text-sm">Consultez votre manager ou l'équipe RH</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {solutions.map((solution, index) => (
                    <Card
                      key={solution.id}
                      className={`${index === 0 ? 'ring-primary/20 ring-2' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="mb-3 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <h4 className="font-semibold">{solution.title}</h4>
                              {index === 0 && (
                                <Badge variant="default" className="text-xs">
                                  Recommandé
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-3 text-sm">
                              {solution.description}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <div>
                              <div className="text-muted-foreground text-xs">Efficacité</div>
                              <div className="text-sm font-medium">
                                {solution.effectiveness_score}%
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                            <div>
                              <div className="text-muted-foreground text-xs">Délai</div>
                              <div className="text-sm font-medium">
                                {getImplementationTimeLabel(solution.implementation_time)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-orange-500" />
                            <div>
                              <div className="text-muted-foreground text-xs">Coût</div>
                              <Badge
                                variant={getCostLevelBadge(solution.cost_level).variant}
                                className="text-xs"
                              >
                                {getCostLevelBadge(solution.cost_level).label}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-500" />
                            <div>
                              <div className="text-muted-foreground text-xs">Rôles requis</div>
                              <div className="text-xs">
                                {solution.required_roles?.length || 0} rôle(s)
                              </div>
                            </div>
                          </div>
                        </div>

                        <Progress value={solution.effectiveness_score} className="mb-3" />

                        {solution.action_steps?.steps && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Étapes d'action :</div>
                            <div className="space-y-1">
                              {solution.action_steps.steps.map(
                                (step: string, stepIndex: number) => (
                                  <div key={stepIndex} className="flex items-start gap-2 text-sm">
                                    <div className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-xs">
                                      {stepIndex + 1}
                                    </div>
                                    <span>{step}</span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                        {solution.required_roles && solution.required_roles.length > 0 && (
                          <div className="mt-3 border-t pt-3">
                            <div className="mb-2 text-sm font-medium">Rôles impliqués :</div>
                            <div className="flex flex-wrap gap-1">
                              {solution.required_roles.map((role, roleIndex) => (
                                <Badge key={roleIndex} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: 'Action enregistrée',
                  description: "L'alerte a été marquée comme consultée",
                });
                onOpenChange(false);
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Marquer comme vu
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
// 🎨 Export avec support mobile automatique + thème Hr
export const AlertDetailDialog = withUniversalDialog('hr', AlertDetailDialogBase);
