/**
 * Project Dashboard Enterprise - Pattern SaaS Leaders
 * Inspiré de Monday.com, Asana, Linear
 * 
 * Fonctionnalités:
 * - Vue d'ensemble des projets avec métriques
 * - Filtres avancés et recherche
 * - Pagination intelligente
 * - Actions en masse
 * - Export et rapports
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useProjectsEnterprise, ProjectFilters } from '@/hooks/useProjectsEnterprise';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PriorityBadge, StatusBadge, MetricCard, ProgressBar } from '@/components/ui/badges';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { AccessDenied } from '@/components/ui/access-denied';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  RefreshCw, 
  Plus,
  Filter,
  Download,
  MoreHorizontal,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectDashboardEnterpriseProps {
  showMetrics?: boolean;
  compactMode?: boolean;
}

export const ProjectDashboardEnterprise: React.FC<ProjectDashboardEnterpriseProps> = ({
  showMetrics = true,
  compactMode = false
}) => {
  // États locaux pour les filtres
  const [filters, setFilters] = useState<ProjectFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);

  // Hook enterprise optimisé
  const {
    projects,
    totalCount,
    activeProjects,
    completedProjects,
    overdueProjects,
    loading,
    error,
    metrics,
    pagination,
    canAccess,
    isSuperAdmin,
    accessInfo,
    refresh,
    loadMore,
    goToPage,
    setFilters: updateFilters,
    isDataStale,
    cacheKey
  } = useProjectsEnterprise(filters);

  const { toast } = useToast();

  // Filtres memoizés pour performance
  const appliedFilters = useMemo(() => ({
    ...filters,
    search: searchTerm || undefined,
    status: statusFilter.length > 0 ? statusFilter : undefined,
    priority: priorityFilter.length > 0 ? priorityFilter : undefined
  }), [filters, searchTerm, statusFilter, priorityFilter]);

  // Appliquer les filtres avec debounce
  const handleFiltersChange = useCallback(() => {
    updateFilters(appliedFilters);
  }, [appliedFilters, updateFilters]);

  // Gestionnaires d'événements optimisés
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    // Debounce de 300ms
    const timeoutId = setTimeout(() => {
      handleFiltersChange();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [handleFiltersChange]);

  const handleStatusFilterChange = useCallback((status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
    handleFiltersChange();
  }, [handleFiltersChange]);

  const handlePriorityFilterChange = useCallback((priority: string) => {
    setPriorityFilter(prev => 
      prev.includes(priority) 
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    );
    handleFiltersChange();
  }, [handleFiltersChange]);

  // Fonctions utilitaires
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'on_hold': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Vérification des permissions - Utiliser AccessDenied avec les infos du rôle
  if (!canAccess && accessInfo?.reason) {
    return (
      <AccessDenied
        reason={accessInfo.reason as any}
        module="Gestion de Projets"
        currentRole={accessInfo.currentRole}
        requiredRole={accessInfo.requiredRole}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Métriques de Performance (Pattern Stripe) */}
      {showMetrics && !compactMode && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Total Projets"
            value={totalCount}
            subtitle="Tous les projets"
            icon={<BarChart3 className="w-6 h-6" />}
            color="blue"
          />
          
          <MetricCard
            label="Actifs"
            value={activeProjects}
            subtitle="En cours"
            icon={<TrendingUp className="w-6 h-6" />}
            color="green"
            trend="up"
          />
          
          <MetricCard
            label="Terminés"
            value={completedProjects}
            subtitle="Complétés"
            icon={<CheckCircle2 className="w-6 h-6" />}
            color="green"
          />
          
          <MetricCard
            label="En retard"
            value={overdueProjects}
            subtitle="Nécessitent attention"
            icon={<AlertTriangle className="w-6 h-6" />}
            color="red"
            trend="down"
          />
        </div>
      )}

      {/* Filtres et Actions (Pattern Linear) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Gestion des Projets
                {isSuperAdmin && (
                  <Badge variant="secondary">Super Admin</Badge>
                )}
              </CardTitle>
              {!compactMode && (
                <p className="text-sm text-muted-foreground mt-1">
                  {totalCount} projets • Cache: {metrics.cacheHit ? '✅' : '❌'} • 
                  Données: {(metrics.dataSize / 1024).toFixed(1)}KB • 
                  Fetch: {metrics.fetchTime.toFixed(0)}ms
                  {isDataStale && <span className="text-orange-600"> • Données obsolètes</span>}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
              
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Projet
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des projets..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="on_hold">En pause</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
              
              <Select onValueChange={handlePriorityFilterChange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grille des projets */}
          {loading && projects.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Chargement des projets...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refresh} variant="outline">
                Réessayer
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun projet trouvé</p>
              <Button className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Créer votre premier projet
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => {
                  const isOverdue = project.end_date && new Date(project.end_date) < new Date() && project.status !== 'completed';
                  
                  return (
                    <Card key={project.id} className={`hover:shadow-md transition-shadow cursor-pointer ${
                      isOverdue ? 'border-red-300 bg-red-50/30' : ''
                    }`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg leading-tight mb-2">
                              {project.name}
                            </h3>
                            {project.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {project.description}
                              </p>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Statut et Priorité */}
                        <div className="flex items-center justify-between">
                          <Badge variant={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                          <Badge variant={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </div>

                        {/* Progression */}
                        {project.progress !== undefined && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progression</span>
                              <span className="font-medium">{project.progress}%</span>
                            </div>
                            <Progress value={project.progress} className="h-2" />
                          </div>
                        )}

                        {/* Métadonnées */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {/* Dates */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Début</span>
                            </div>
                            <div className="font-medium">
                              {formatDate(project.start_date)}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Fin</span>
                            </div>
                            <div className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                              {formatDate(project.end_date)}
                            </div>
                          </div>

                          {/* Budget */}
                          {project.budget && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <DollarSign className="h-3 w-3" />
                                <span>Budget</span>
                              </div>
                              <div className="font-medium">
                                {formatCurrency(project.budget)}
                              </div>
                            </div>
                          )}

                          {/* Équipe */}
                          {project.team_size && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Users className="h-3 w-3" />
                                <span>Équipe</span>
                              </div>
                              <div className="font-medium">
                                {project.team_size} membres
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Créateur */}
                        {project.profiles && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={(project.profiles as any).avatar_url} />
                              <AvatarFallback className="text-xs">
                                {project.profiles.full_name?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">
                              Créé par {project.profiles.full_name}
                            </span>
                          </div>
                        )}

                        {/* Tenant (Super Admin) */}
                        {isSuperAdmin && project.tenants && (
                          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                            🏢 {project.tenants.name}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination (Pattern Stripe) */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-8">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.page} sur {pagination.totalPages} • 
                    {totalCount} projets au total
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, pagination.page - 2) + i;
                        if (pageNum > pagination.totalPages) return null;
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            disabled={loading}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages || loading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Lazy Loading */}
              {pagination.hasMore && (
                <div className="text-center mt-6">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Charger plus de projets
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
