import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProjectAlerts } from '@/hooks/useProjectAlerts';
import { useTasks } from '@/hooks/useTasks';
import { AlertDetailDialog } from '@/components/hr/AlertDetailDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Target,
  BarChart3,
  Clock,
  TrendingDown,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ProjectDashboard = () => {
  const {
    computedAlerts,
    loading,
    refreshAlerts,
    getProjectHighPriorityAlerts,
    getTopProjectAlerts,
    getProjectMetrics
  } = useProjectAlerts();

  const { tasks } = useTasks();
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);
  const { toast } = useToast();

  const metrics = getProjectMetrics();
  const highPriorityAlerts = getProjectHighPriorityAlerts();
  const topAlerts = getTopProjectAlerts(4);

  // Calculs pour les KPIs projet
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(task => task.status === 'done').length;
  const overdueTasks = tasks.filter(task => 
    task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
  ).length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (loading) {
    return <div className="flex justify-center p-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Tableau de Bord Projet</h2>
          <p className="text-muted-foreground">
            Suivi des tâches, alertes et performance projet
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={async () => {
              await refreshAlerts();
              toast({ title: 'Actualisation', description: 'Alertes projet actualisées.' });
            }} 
            variant="outline"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Actualiser Alertes
          </Button>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches Totales</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {doneTasks} terminées
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux d'Achèvement</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Progression globale
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tâches en Retard</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Nécessitent attention
            </p>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertes Projet</CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">{metrics.critical + metrics.high}</div>
            <p className="text-xs text-muted-foreground">
              Priorité haute/critique
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes Projet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader onClick={() => setAlertsModalOpen(true)} className="cursor-pointer">
            <CardTitle>Alertes Projet</CardTitle>
            <CardDescription>
              Alertes spécifiques à la gestion de projet et des tâches
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className="flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-accent/10"
                  onClick={() => setSelectedAlert(alert)}
                >
                  <AlertTriangle className={`h-4 w-4 ${
                    alert.severity === 'critical' ? 'text-red-500' : 
                    alert.severity === 'high' ? 'text-orange-500' : 
                    alert.severity === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{alert.title}</div>
                    <div className="text-xs text-muted-foreground">{alert.entity_name}</div>
                  </div>
                </div>
              ))}
              {topAlerts.length === 0 && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Aucune alerte projet - Tout va bien</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition des Alertes</CardTitle>
            <CardDescription>
              Distribution par niveau de sévérité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Critique</span>
                <Badge variant="destructive">{metrics.critical}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Élevée</span>
                <Badge variant="destructive">{metrics.high}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Moyenne</span>
                <Badge variant="default">{metrics.medium}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Faible</span>
                <Badge variant="secondary">{metrics.low}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Liste Alertes Projet */}
      <Dialog open={alertsModalOpen} onOpenChange={setAlertsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Alertes Projet ({metrics.total})</DialogTitle>
            <DialogDescription>Alertes spécifiques à la gestion de projet, classées par importance</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {computedAlerts.length === 0 ? (
              <div className="text-center text-muted-foreground py-6">Aucune alerte projet active</div>
            ) : (
              computedAlerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-accent/10 flex items-start gap-3"
                  onClick={() => { setSelectedAlert(alert); setAlertsModalOpen(false); }}
                >
                  <AlertTriangle className={`h-4 w-4 mt-1 ${
                    alert.severity === 'critical' ? 'text-red-500' : 
                    alert.severity === 'high' ? 'text-orange-500' : 
                    alert.severity === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-medium">{alert.title}</h4>
                      <Badge variant={
                        alert.severity === 'critical' ? 'destructive' : 
                        alert.severity === 'high' ? 'destructive' : 
                        alert.severity === 'medium' ? 'default' : 
                        'secondary'
                      }>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{alert.description}</p>
                    <div className="text-xs text-primary">
                      {alert.entity_name && `📍 ${alert.entity_name}`}
                      {alert.category && ` • ${alert.category}`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog détail alerte */}
      {selectedAlert && (
        <AlertDetailDialog
          alert={selectedAlert}
          open={!!selectedAlert}
          onOpenChange={() => setSelectedAlert(null)}
        />
      )}
    </div>
  );
};