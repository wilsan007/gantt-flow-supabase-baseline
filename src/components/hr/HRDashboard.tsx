import { useHR } from '@/hooks/useHR';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdvancedHRDashboard } from './AdvancedHRDashboard';

export const HRDashboard = () => {
  const { leaveRequests, attendances, employees, loading } = useHR();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement du tableau de bord RH...</div>
      </div>
    );
  }

  console.log('🔍 HRDashboard render state:', {
    loading,
    employeesCount: employees?.length || 0,
    leaveRequestsCount: leaveRequests?.length || 0,
    attendancesCount: attendances?.length || 0
  });

  const stats = {
    totalEmployees: employees.length,
    pendingRequests: leaveRequests.filter(req => req.status === 'pending').length,
    approvedRequests: leaveRequests.filter(req => req.status === 'approved').length,
    rejectedRequests: leaveRequests.filter(req => req.status === 'rejected').length,
    todayAttendances: attendances.filter(att => 
      att.date === new Date().toISOString().split('T')[0]
    ).length
  };

  const recentRequests = leaveRequests.slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Tableau de bord RH
      </h2>

      {/* Stats Cards */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={isMobile ? "text-sm" : "text-base"}>Employés</CardTitle>
            <Users className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-primary`} />
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-primary`}>
              {stats.totalEmployees}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={isMobile ? "text-sm" : "text-base"}>En attente</CardTitle>
            <AlertCircle className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-warning`} />
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-warning`}>
              {stats.pendingRequests}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={isMobile ? "text-sm" : "text-base"}>Approuvées</CardTitle>
            <CheckCircle className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-success`} />
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-success`}>
              {stats.approvedRequests}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={isMobile ? "text-sm" : "text-base"}>Présences</CardTitle>
            <Clock className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'} text-accent`} />
          </CardHeader>
          <CardContent>
            <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-accent`}>
              {stats.todayAttendances}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leave Requests */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Demandes de congés récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <p className="text-muted-foreground">Aucune demande de congé récente</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => {
                const employee = employees.find(emp => emp.id === request.employee_id);
                return (
                  <div key={request.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium">
                        {employee?.full_name || 'Employé inconnu'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.total_days} jour(s)
                      </div>
                    </div>
                    <Badge
                      variant={
                        request.status === 'approved' ? 'default' :
                        request.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                    >
                      {request.status === 'approved' ? 'Approuvée' :
                       request.status === 'rejected' ? 'Rejetée' : 'En attente'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};