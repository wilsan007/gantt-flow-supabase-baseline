/**
 * HR Dashboard Minimal - Solution Anti-Boucle Définitive
 * Inspiré de GitHub, Stripe, Linear Dashboard
 *
 * Principe: Composant statique, pas de re-renders inutiles
 */

import React from 'react';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/badges';
import { AccessDenied } from '@/components/ui/access-denied';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Shield,
} from 'lucide-react';

export const HRDashboardMinimal = () => {
  const {
    leaveRequests,
    attendances,
    employees,
    absenceTypes,
    loading,
    error,
    canAccess,
    isSuperAdmin,
    accessInfo,
    refresh,
  } = useHRMinimal();

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="text-primary mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Chargement des données RH...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md text-center">
          <XCircle className="text-destructive mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4 text-sm">{error}</p>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Access denied - Utiliser le composant AccessDenied avec les infos du rôle
  if (!canAccess && accessInfo?.reason) {
    return (
      <AccessDenied
        reason={accessInfo.reason as any}
        module="Ressources Humaines"
        currentRole={accessInfo.currentRole}
        requiredRole={accessInfo.requiredRole}
      />
    );
  }

  // Calculs des statistiques (simples)
  const stats = {
    totalEmployees: employees?.length || 0,
    pendingRequests: leaveRequests?.filter(req => req.status === 'pending')?.length || 0,
    approvedRequests: leaveRequests?.filter(req => req.status === 'approved')?.length || 0,
    todayAttendances:
      attendances?.filter(att => att.date === new Date().toISOString().split('T')[0])?.length || 0,
  };

  const recentRequests = leaveRequests?.slice(0, 5) || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="from-primary to-accent bg-gradient-to-r bg-clip-text text-3xl font-bold text-transparent">
            Tableau de bord RH
          </h1>
          <div className="text-muted-foreground mt-1 flex items-center gap-2">
            <span>Vue d'ensemble des ressources humaines</span>
            {isSuperAdmin && (
              <Badge variant="secondary">
                <Shield className="mr-1 h-3 w-3" />
                Super Admin
              </Badge>
            )}
          </div>
        </div>

        <Button onClick={refresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Total Employés"
          value={stats.totalEmployees}
          subtitle="Effectif actuel"
          icon={<Users className="h-6 w-6" />}
          color="blue"
        />

        <MetricCard
          label="En attente"
          value={stats.pendingRequests}
          subtitle="Demandes à traiter"
          icon={<AlertCircle className="h-6 w-6" />}
          color="orange"
        />

        <MetricCard
          label="Approuvées"
          value={stats.approvedRequests}
          subtitle="Demandes validées"
          icon={<CheckCircle className="h-6 w-6" />}
          color="green"
        />

        <MetricCard
          label="Présences"
          value={stats.todayAttendances}
          subtitle="Aujourd'hui"
          icon={<Clock className="h-6 w-6" />}
          color="blue"
        />
      </div>

      {/* Recent Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Demandes de congés récentes
            <Badge variant="secondary" className="ml-auto">
              {recentRequests.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>Aucune demande de congé récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map(request => {
                const employee = employees?.find(emp => emp.user_id === request.employee_id);
                return (
                  <div
                    key={request.id}
                    className="bg-muted/30 hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {employee?.full_name || request.profiles?.full_name || 'Employé inconnu'}
                        {isSuperAdmin && request.profiles?.tenant_id && (
                          <span className="ml-2 text-xs font-normal text-blue-600">
                            ({request.profiles.tenant_id})
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {new Date(request.start_date).toLocaleDateString()} -{' '}
                        {new Date(request.end_date).toLocaleDateString()}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {request.total_days} jour(s)
                        {request.reason && ` • ${request.reason}`}
                      </div>
                    </div>
                    <Badge
                      variant={
                        request.status === 'approved'
                          ? 'default'
                          : request.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="ml-3 flex-shrink-0"
                    >
                      {request.status === 'approved'
                        ? 'Approuvée'
                        : request.status === 'rejected'
                          ? 'Rejetée'
                          : 'En attente'}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employees List - Enhanced for Super Admin */}
      {isSuperAdmin && employees.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Tous les employés du système
              <Badge variant="outline" className="ml-auto">
                {employees.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {employees.slice(0, 12).map(employee => (
                <div
                  key={employee.id}
                  className="bg-card rounded-lg border p-3 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Users className="text-primary h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{employee.full_name}</div>
                      <div className="text-muted-foreground text-sm">
                        {employee.job_title || 'Poste non défini'}
                      </div>
                      <div className="text-xs text-blue-600">ID: {employee.employee_id}</div>
                      {employee.tenants?.name && (
                        <div className="text-xs font-medium text-orange-600">
                          {employee.tenants.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {employees.length > 12 && (
              <div className="text-muted-foreground mt-4 text-center text-sm">
                ... et {employees.length - 12} autres employés
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Info for Super Admin */}
      {isSuperAdmin && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm">
              🔧 Informations de débogage (Super Admin)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-1 text-xs">
            <div>Super Admin: ✅</div>
            <div>Can Access: {canAccess ? '✅' : '❌'}</div>
            <div>Data Loaded: {new Date().toLocaleTimeString()}</div>
            <div>
              Total Items: {stats.totalEmployees + recentRequests.length + stats.todayAttendances}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
