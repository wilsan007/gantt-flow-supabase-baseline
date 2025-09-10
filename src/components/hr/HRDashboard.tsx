import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useHR } from '@/hooks/useHR';
import { useProfiles } from '@/hooks/useProfiles';
import { LeaveRequestForm } from './LeaveRequestForm';
import { 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  CalendarDays,
  Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const HRDashboard = () => {
  const { 
    leaveRequests, 
    leaveBalances, 
    absenceTypes, 
    attendances, 
    timesheets, 
    positions,
    loading, 
    error,
    updateLeaveRequestStatus,
    clockInOut 
  } = useHR();
  
  const { profiles } = useProfiles();
  const [activeTab, setActiveTab] = useState('overview');
  const [clockingIn, setClockinIn] = useState(false);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Chargement des données RH...</div>;
  }

  if (error) {
    return <div className="text-destructive p-4">Erreur: {error}</div>;
  }

  // Calculate KPIs
  const totalEmployees = profiles.length;
  const pendingLeaveRequests = leaveRequests.filter(req => req.status === 'pending').length;
  const todayAttendances = attendances.filter(att => 
    att.date === new Date().toISOString().split('T')[0]
  ).length;
  const weeklyTimesheets = timesheets.filter(ts => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(ts.date) >= weekAgo;
  });
  const totalWeeklyHours = weeklyTimesheets.reduce((sum, ts) => sum + (ts.hours || 0), 0);

  const handleClockInOut = async (type: 'in' | 'out') => {
    setClockinIn(true);
    try {
      await clockInOut(type);
    } catch (error) {
      console.error('Erreur lors du pointage:', error);
    } finally {
      setClockinIn(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-warning"><AlertCircle className="w-3 h-3 mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-success"><CheckCircle className="w-3 h-3 mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Refusé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ressources Humaines</h1>
          <p className="text-muted-foreground">
            Gestion des employés, congés, présences et temps de travail
          </p>
        </div>
        <div className="flex gap-2">
          <LeaveRequestForm />
          <Button 
            onClick={() => handleClockInOut('in')} 
            disabled={clockingIn}
            variant="outline"
          >
            <Timer className="w-4 h-4 mr-2" />
            Pointer Entrée
          </Button>
          <Button 
            onClick={() => handleClockInOut('out')} 
            disabled={clockingIn}
            variant="outline"
          >
            <Timer className="w-4 h-4 mr-2" />
            Pointer Sortie
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Actifs dans l'organisation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes en Attente</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLeaveRequests}</div>
            <p className="text-xs text-muted-foreground">
              Demandes de congés à traiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Présents Aujourd'hui</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAttendances}</div>
            <p className="text-xs text-muted-foreground">
              Employés pointés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heures Semaine</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWeeklyHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              Temps déclaré cette semaine
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="leaves">Congés</TabsTrigger>
          <TabsTrigger value="attendance">Présences</TabsTrigger>
          <TabsTrigger value="timesheets">Temps</TabsTrigger>
          <TabsTrigger value="employees">Employés</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Leave Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Demandes de Congés Récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaveRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={request.employee?.avatar_url} />
                          <AvatarFallback>
                            {request.employee?.full_name?.substring(0, 2)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{request.employee?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(request.start_date), 'dd MMM', { locale: fr })} - 
                            {format(new Date(request.end_date), 'dd MMM', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Timesheets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Temps Récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timesheets.slice(0, 5).map((timesheet) => (
                    <div key={timesheet.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={timesheet.employee?.avatar_url} />
                          <AvatarFallback>
                            {timesheet.employee?.full_name?.substring(0, 2)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {timesheet.task?.title || timesheet.project?.name || 'Tâche générale'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(timesheet.date), 'dd MMM', { locale: fr })} - {timesheet.employee?.full_name}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{timesheet.hours}h</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demandes de Congés</CardTitle>
              <CardDescription>
                Gérez les demandes de congés et les soldes des employés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div key={request.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.employee?.avatar_url} />
                          <AvatarFallback>
                            {request.employee?.full_name?.substring(0, 2)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{request.employee?.full_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {request.absence_type?.name}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Période:</span> 
                        {format(new Date(request.start_date), 'dd/MM/yyyy', { locale: fr })} - 
                        {format(new Date(request.end_date), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                      <div>
                        <span className="font-medium">Durée:</span> {request.total_days} jour(s)
                      </div>
                    </div>
                    
                    {request.reason && (
                      <div className="mt-2">
                        <span className="font-medium text-sm">Motif:</span>
                        <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          onClick={() => updateLeaveRequestStatus(request.id, 'approved')}
                        >
                          Approuver
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateLeaveRequestStatus(request.id, 'rejected', 'Refusé par le manager')}
                        >
                          Refuser
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Présences du Jour</CardTitle>
              <CardDescription>
                Suivi des présences et pointages des employés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {attendances
                  .filter(att => att.date === new Date().toISOString().split('T')[0])
                  .map((attendance) => (
                  <div key={attendance.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={attendance.employee?.avatar_url} />
                        <AvatarFallback>
                          {attendance.employee?.full_name?.substring(0, 2)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{attendance.employee?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Entrée: {attendance.check_in || 'Non pointé'} - 
                          Sortie: {attendance.check_out || 'En cours'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{attendance.total_hours?.toFixed(1) || '0'}h</p>
                      <Badge variant={attendance.status === 'present' ? 'default' : 'secondary'}>
                        {attendance.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timesheets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feuilles de Temps</CardTitle>
              <CardDescription>
                Temps passé sur les projets et tâches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timesheets.map((timesheet) => (
                  <div key={timesheet.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={timesheet.employee?.avatar_url} />
                        <AvatarFallback>
                          {timesheet.employee?.full_name?.substring(0, 2)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {timesheet.task?.title || timesheet.project?.name || 'Travail général'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {timesheet.employee?.full_name} - {format(new Date(timesheet.date), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                        {timesheet.description && (
                          <p className="text-xs text-muted-foreground mt-1">{timesheet.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{timesheet.hours}h</p>
                      {timesheet.billable && (
                        <Badge variant="outline" className="text-xs">Facturable</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Annuaire des Employés</CardTitle>
              <CardDescription>
                Liste des employés et leurs informations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback>
                          {profile.full_name?.substring(0, 2)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{profile.full_name}</p>
                        <p className="text-sm text-muted-foreground">{profile.full_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        <Briefcase className="w-3 h-3 mr-1" />
                        Actif
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};