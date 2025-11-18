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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
} from 'lucide-react';
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

  const filteredTimesheets = timesheets.filter(timesheet => {
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
    <div className="container mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header - Responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl md:text-3xl">
            <Clock className="h-6 w-6 shrink-0 sm:h-7 sm:w-7 md:h-8 md:w-8" />
            <span className="truncate">
              <span className="hidden sm:inline">Mes Feuilles de Temps</span>
              <span className="sm:hidden">Timesheets</span>
            </span>
          </h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm md:text-base">
            <span className="hidden sm:inline">
              Suivez vos heures travaillées et soumettez vos timesheets
            </span>
            <span className="sm:hidden">Gestion des heures</span>
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="h-11 w-full font-semibold sm:h-10 sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle Feuille</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] w-[95vw] max-w-6xl overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="truncate">
                    <span className="hidden sm:inline">Créer une Feuille de Temps</span>
                    <span className="sm:hidden">Nouvelle Feuille</span>
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousWeek}
                      className="h-9 w-9 p-0 sm:h-8 sm:w-8"
                    >
                      <span className="text-base sm:text-sm">←</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToCurrentWeek}
                      className="h-9 px-2 sm:h-8 sm:px-3"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      <span className="ml-1.5 hidden sm:inline">Aujourd'hui</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextWeek}
                      className="h-9 w-9 p-0 sm:h-8 sm:w-8"
                    >
                      <span className="text-base sm:text-sm">→</span>
                    </Button>
                  </div>
                </div>
              </DialogTitle>
            </DialogHeader>
            <TimesheetWeekly weekStartDate={weekStart} onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques - Grid 2 cols mobile */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-3">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl font-bold sm:text-3xl">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-3">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              <span className="hidden sm:inline">En Attente</span>
              <span className="sm:hidden">Attente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl font-bold text-blue-600 sm:text-3xl">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-3">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              <span className="hidden sm:inline">Approuvés</span>
              <span className="sm:hidden">OK</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl font-bold text-green-600 sm:text-3xl">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 pb-2 sm:p-6 sm:pb-3">
            <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
              <span className="hidden sm:inline">Total Heures</span>
              <span className="sm:hidden">Heures</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-2xl font-bold sm:text-3xl">{stats.totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des timesheets */}
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>Toutes vos feuilles de temps et leur statut</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            {/* Tabs scroll horizontal mobile */}
            <div className="-mx-4 sm:mx-0">
              <TabsList className="flex w-full gap-1 overflow-x-auto p-1.5 sm:grid sm:grid-cols-4 sm:gap-2">
                <TabsTrigger value="all" className="shrink-0 text-xs whitespace-nowrap sm:text-sm">
                  Toutes ({stats.total})
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="shrink-0 text-xs whitespace-nowrap sm:text-sm"
                >
                  <span className="hidden sm:inline">En Attente ({stats.pending})</span>
                  <span className="sm:hidden">Att. ({stats.pending})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className="shrink-0 text-xs whitespace-nowrap sm:text-sm"
                >
                  <span className="hidden sm:inline">Approuvées ({stats.approved})</span>
                  <span className="sm:hidden">OK ({stats.approved})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className="shrink-0 text-xs whitespace-nowrap sm:text-sm"
                >
                  <span className="hidden sm:inline">Rejetées</span>
                  <span className="sm:hidden">Rejetées</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={selectedTab} className="mt-4 space-y-4">
              {loading ? (
                <div className="text-muted-foreground py-8 text-center">Chargement...</div>
              ) : filteredTimesheets.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  Aucune feuille de temps pour le moment
                </div>
              ) : (
                filteredTimesheets.map(timesheet => {
                  const statusConfig =
                    STATUS_CONFIG[timesheet.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConfig?.icon || Clock;

                  return (
                    <Card
                      key={timesheet.id}
                      className="transition-shadow hover:shadow-md active:scale-[0.99]"
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                              <h3 className="text-sm font-semibold sm:text-base md:text-lg">
                                <span className="hidden sm:inline">
                                  Semaine du{' '}
                                  {format(new Date(timesheet.week_start_date), 'dd MMM', {
                                    locale: fr,
                                  })}{' '}
                                  au{' '}
                                  {format(new Date(timesheet.week_end_date), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                </span>
                                <span className="sm:hidden">
                                  {format(new Date(timesheet.week_start_date), 'dd MMM', {
                                    locale: fr,
                                  })}{' '}
                                  -{' '}
                                  {format(new Date(timesheet.week_end_date), 'dd MMM', {
                                    locale: fr,
                                  })}
                                </span>
                              </h3>
                              <Badge className={statusConfig?.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                <span className="text-xs">{statusConfig?.label}</span>
                              </Badge>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:mt-4 sm:gap-4 sm:text-sm md:grid-cols-4">
                              <div>
                                <p className="text-muted-foreground">Total heures</p>
                                <p className="text-xl font-medium sm:text-2xl">
                                  {Number(timesheet.total_hours).toFixed(1)}h
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  <span className="hidden sm:inline">Heures normales</span>
                                  <span className="sm:hidden">Normales</span>
                                </p>
                                <p className="text-base font-medium sm:text-lg">
                                  {Number(timesheet.regular_hours).toFixed(1)}h
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  <span className="hidden sm:inline">Heures sup.</span>
                                  <span className="sm:hidden">Sup.</span>
                                </p>
                                <p className="text-base font-medium text-orange-600 sm:text-lg">
                                  {Number(timesheet.overtime_hours).toFixed(1)}h
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Soumis le</p>
                                <p className="text-xs font-medium sm:text-sm">
                                  {timesheet.submitted_at
                                    ? format(new Date(timesheet.submitted_at), 'dd MMM', {
                                        locale: fr,
                                      })
                                    : '-'}
                                </p>
                              </div>
                            </div>

                            {timesheet.notes && (
                              <p className="text-muted-foreground mt-3 text-xs sm:text-sm">
                                <span className="font-medium">Notes:</span> {timesheet.notes}
                              </p>
                            )}

                            {timesheet.rejection_reason && (
                              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2.5 sm:p-3">
                                <p className="text-xs font-medium text-red-800 sm:text-sm">
                                  Raison du refus:
                                </p>
                                <p className="text-xs text-red-700 sm:text-sm">
                                  {timesheet.rejection_reason}
                                </p>
                              </div>
                            )}

                            {timesheet.status === 'approved' && timesheet.approved_at && (
                              <div className="mt-3 rounded-md border border-green-200 bg-green-50 p-2.5 sm:p-3">
                                <p className="text-xs text-green-700 sm:text-sm">
                                  ✓ Approuvé le{' '}
                                  {format(new Date(timesheet.approved_at), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                  <span className="hidden sm:inline">
                                    {' à '}
                                    {format(new Date(timesheet.approved_at), 'HH:mm', {
                                      locale: fr,
                                    })}
                                  </span>
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
