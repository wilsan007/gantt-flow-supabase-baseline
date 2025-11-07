/**
 * ⏰ Ma Page Timesheets - Dashboard Employé
 */

import { useState } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { TimesheetWeekly } from '@/components/hr/TimesheetWeekly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Clock, Plus, CheckCircle2, XCircle, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-500', icon: AlertCircle },
  submitted: { label: 'Soumis', color: 'bg-blue-500', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-green-500', icon: CheckCircle2 },
  rejected: { label: 'Rejeté', color: 'bg-red-500', icon: XCircle },
};

export default function MyTimesheetsPage() {
  const { timesheets, loading } = useHRSelfService();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  const filteredTimesheets = timesheets.filter((timesheet) => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'pending') return ['draft', 'submitted'].includes(timesheet.status);
    if (selectedTab === 'approved') return timesheet.status === 'approved';
    if (selectedTab === 'rejected') return timesheet.status === 'rejected';
    return true;
  });

  const stats = {
    total: timesheets.length,
    pending: timesheets.filter(t => ['draft', 'submitted'].includes(t.status)).length,
    approved: timesheets.filter(t => t.status === 'approved').length,
    totalHours: timesheets
      .filter(t => t.status === 'approved')
      .reduce((sum, t) => sum + Number(t.total_hours), 0),
  };

  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Clock className="h-8 w-8" />
            Mes Feuilles de Temps
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivez vos heures travaillées et soumettez vos timesheets
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Feuille
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center justify-between">
                  <span>Créer une Feuille de Temps</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                      ←
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextWeek}>
                      →
                    </Button>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <TimesheetWeekly
              weekStartDate={weekStart}
              onSuccess={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Timesheets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approuvés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Heures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des timesheets */}
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>
            Toutes vos feuilles de temps et leur statut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">En Attente ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approuvées ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejetées</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : filteredTimesheets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune feuille de temps pour le moment
                </div>
              ) : (
                filteredTimesheets.map((timesheet) => {
                  const statusConfig = STATUS_CONFIG[timesheet.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConfig?.icon || Clock;

                  return (
                    <Card key={timesheet.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                Semaine du {format(new Date(timesheet.week_start_date), 'dd MMM', { locale: fr })} au {format(new Date(timesheet.week_end_date), 'dd MMM yyyy', { locale: fr })}
                              </h3>
                              <Badge className={statusConfig?.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig?.label}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                              <div>
                                <p className="text-muted-foreground">Total heures</p>
                                <p className="font-medium text-2xl">
                                  {Number(timesheet.total_hours).toFixed(1)}h
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Heures normales</p>
                                <p className="font-medium text-lg">
                                  {Number(timesheet.regular_hours).toFixed(1)}h
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Heures sup.</p>
                                <p className="font-medium text-lg text-orange-600">
                                  {Number(timesheet.overtime_hours).toFixed(1)}h
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Soumis le</p>
                                <p className="font-medium">
                                  {timesheet.submitted_at 
                                    ? format(new Date(timesheet.submitted_at), 'dd MMM yyyy', { locale: fr })
                                    : '-'
                                  }
                                </p>
                              </div>
                            </div>

                            {timesheet.notes && (
                              <p className="text-sm text-muted-foreground mt-3">
                                Notes: {timesheet.notes}
                              </p>
                            )}

                            {timesheet.rejection_reason && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm font-medium text-red-800">Raison du refus:</p>
                                <p className="text-sm text-red-700">{timesheet.rejection_reason}</p>
                              </div>
                            )}

                            {timesheet.status === 'approved' && timesheet.approved_at && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-sm text-green-700">
                                  ✓ Approuvé le {format(new Date(timesheet.approved_at), 'dd MMM yyyy à HH:mm', { locale: fr })}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
