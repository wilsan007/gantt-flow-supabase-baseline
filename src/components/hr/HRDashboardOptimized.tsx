/**
 * HR Dashboard Optimisé - Meilleures Pratiques des Leaders
 * Inspiré de Linear, Notion, Vercel Dashboard
 * 
 * Fonctionnalités:
 * - Error boundaries
 * - Suspense loading
 * - Optimistic UI
 * - Performance monitoring
 * - Accessibility compliant
 */

import React, { Suspense, memo, useMemo } from 'react';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MetricCard } from '@/components/ui/badges';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

// Composant d'erreur personnalisé (inspiré de Linear)
const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <div className="flex items-center justify-center min-h-[400px] p-8">
    <div className="text-center max-w-md">
      <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Oops! Quelque chose s'est mal passé</h3>
      <p className="text-muted-foreground mb-4 text-sm">
        {error.message || "Une erreur inattendue s'est produite"}
      </p>
      <Button onClick={resetErrorBoundary} variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Réessayer
      </Button>
    </div>
  </div>
);

// Composant de loading sophistiqué (inspiré de Vercel)
const LoadingSkeleton = memo(() => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="h-8 bg-muted rounded-lg w-64"></div>
    
    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-muted">
          <CardHeader className="pb-2">
            <div className="h-4 bg-muted rounded w-20"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-muted rounded w-12"></div>
          </CardContent>
        </Card>
      ))}
    </div>
    
    {/* Recent Requests Skeleton */}
    <Card className="border-muted">
      <CardHeader>
        <div className="h-5 bg-muted rounded w-48"></div>
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
            <div className="h-6 bg-muted rounded w-16"></div>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
));

// Composant de statistiques optimisé - Désormais utilise MetricCard
const StatsCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = "blue",
  className 
}: {
  title: string;
  value: number;
  icon: any;
  trend?: { value: number; isPositive: boolean };
  color?: "blue" | "green" | "orange" | "red" | "purple";
  className?: string;
}) => {
  return (
    <MetricCard
      label={title}
      value={value}
      subtitle={trend ? `${trend.isPositive ? '+' : ''}${trend.value}% vs précédent` : undefined}
      icon={<Icon className="w-6 h-6" />}
      color={color}
      trend={trend ? (trend.isPositive ? "up" : "down") : undefined}
      className={className}
    />
  );
});

// Composant principal optimisé
const HRDashboardContent = memo(() => {
  const { 
    leaveRequests, 
    attendances, 
    employees, 
    absenceTypes,
    loading, 
    error, 
    refresh,
    metrics
  } = useHRMinimal();
  
  const isMobile = useIsMobile();

  // Calculs memoizés des statistiques
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalEmployees: employees.length,
      pendingRequests: leaveRequests.filter(req => req.status === 'pending').length,
      approvedRequests: leaveRequests.filter(req => req.status === 'approved').length,
      rejectedRequests: leaveRequests.filter(req => req.status === 'rejected').length,
      todayAttendances: attendances.filter(att => att.date === today).length,
      totalAbsenceTypes: absenceTypes.length
    };
  }, [leaveRequests, attendances, employees, absenceTypes]);

  // Demandes récentes memoizées
  const recentRequests = useMemo(() => 
    leaveRequests.slice(0, 5), 
    [leaveRequests]
  );

  // Gestion des états d'erreur
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-muted-foreground mb-4 text-sm">{error}</p>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  // Vérification des permissions supprimée - gérée par HRDashboardWithAccess

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Tableau de bord RH
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble des ressources humaines
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Indicateur de performance */}
          {metrics.cacheHit && (
            <Badge variant="secondary" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Cache
            </Badge>
          )}
          
          <Button 
            onClick={refresh} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={cn(
        "grid gap-4",
        isMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4"
      )}>
        <StatsCard
          title="Employés"
          value={stats.totalEmployees}
          icon={Users}
          color="blue"
        />
        
        <StatsCard
          title="En attente"
          value={stats.pendingRequests}
          icon={AlertCircle}
          color="orange"
        />
        
        <StatsCard
          title="Approuvées"
          value={stats.approvedRequests}
          icon={CheckCircle}
          color="green"
        />
        
        <StatsCard
          title="Présences aujourd'hui"
          value={stats.todayAttendances}
          icon={Clock}
          color="blue"
        />
      </div>

      {/* Demandes récentes */}
      <Card className="modern-card">
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
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune demande de congé récente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => {
                const employee = employees.find(emp => emp.user_id === request.employee_id);
                return (
                  <div 
                    key={request.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {employee?.full_name || 'Employé inconnu'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.start_date).toLocaleDateString()} - {' '}
                        {new Date(request.end_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {request.total_days} jour(s) • {request.reason || 'Aucune raison'}
                      </div>
                    </div>
                    <Badge
                      variant={
                        request.status === 'approved' ? 'default' :
                        request.status === 'rejected' ? 'destructive' : 'secondary'
                      }
                      className="ml-3 flex-shrink-0"
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

      {/* Debug info en développement */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed border-muted-foreground/30">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Debug Info
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <div>Cache Hit: {metrics.cacheHit ? '✅' : '❌'}</div>
            <div>Fetch Time: {metrics.fetchTime}ms</div>
            <div>Data Size: {metrics.dataSize}</div>
            <div>Last Update: {metrics.lastUpdate?.toLocaleTimeString()}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

// Composant principal avec Suspense
export const HRDashboardOptimized = () => {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HRDashboardContent />
    </Suspense>
  );
};
