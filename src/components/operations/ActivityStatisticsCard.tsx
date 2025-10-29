/**
 * Composant: ActivityStatisticsCard
 * Affiche les statistiques d'une activité opérationnelle
 * Utilise la RPC function get_activity_statistics
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOperationalActivities } from '@/hooks/useOperationalActivities';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActivityStatistics {
  total_occurrences: number;
  completed_count: number;
  in_progress_count: number;
  blocked_count: number;
  completion_rate: number;
  avg_completion_time_days: number | null;
  next_occurrence: string | null;
  last_occurrence: string | null;
}

interface ActivityStatisticsCardProps {
  activityId: string;
}

export const ActivityStatisticsCard: React.FC<ActivityStatisticsCardProps> = ({ activityId }) => {
  const { getStatistics } = useOperationalActivities({ autoFetch: false });
  const [stats, setStats] = useState<ActivityStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics();
  }, [activityId]);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getStatistics(activityId);
      setStats(data);
    } catch (err: any) {
      console.error('❌ Erreur loadStatistics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Chargement des statistiques...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="font-semibold text-destructive">Erreur lors du chargement</p>
            <p className="text-sm text-muted-foreground mt-2">{error || 'Données non disponibles'}</p>
            <Button onClick={loadStatistics} variant="outline" className="mt-4">
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistiques de l'activité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Taux de complétion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taux de complétion</span>
              <span className="text-2xl font-bold text-primary">{stats.completion_rate}%</span>
            </div>
            <Progress value={stats.completion_rate} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {stats.completed_count} sur {stats.total_occurrences} occurrence(s) terminée(s)
            </p>
          </div>

          {/* Répartition des statuts */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle2 className="h-6 w-6 mx-auto text-green-600 mb-1" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stats.completed_count}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">Terminées</div>
            </div>

            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Clock className="h-6 w-6 mx-auto text-blue-600 mb-1" />
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats.in_progress_count}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400">En cours</div>
            </div>

            <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <AlertCircle className="h-6 w-6 mx-auto text-red-600 mb-1" />
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {stats.blocked_count}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">Bloquées</div>
            </div>
          </div>

          {/* Temps moyen de complétion */}
          {stats.avg_completion_time_days !== null && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Temps moyen de complétion</span>
              </div>
              <span className="text-lg font-bold">
                {Math.round(stats.avg_completion_time_days)} jour(s)
              </span>
            </div>
          )}

          {/* Prochaine et dernière occurrence */}
          <div className="grid grid-cols-2 gap-4">
            {stats.next_occurrence && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                  Prochaine occurrence
                </div>
                <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {format(new Date(stats.next_occurrence), 'dd MMMM yyyy', { locale: fr })}
                </div>
              </div>
            )}

            {stats.last_occurrence && (
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  Dernière occurrence
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {format(new Date(stats.last_occurrence), 'dd MMMM yyyy', { locale: fr })}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* État vide si aucune occurrence */}
      {stats.total_occurrences === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6 text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Aucune occurrence générée pour le moment
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Les statistiques apparaîtront une fois que des tâches auront été générées
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
