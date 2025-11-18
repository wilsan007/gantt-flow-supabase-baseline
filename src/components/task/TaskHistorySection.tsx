import React from 'react';
import { useTaskHistory, TaskHistoryEntry } from '@/hooks/useTaskHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Clock, User, Activity } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TaskHistorySectionProps {
  taskId: string;
  className?: string;
}

export const TaskHistorySection: React.FC<TaskHistorySectionProps> = ({
  taskId,
  className = '',
}) => {
  const { history, loading, error, formatHistoryMessage, getActionIcon, getActionColor } =
    useTaskHistory(taskId);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Historique des modifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Historique des modifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            <p>Erreur lors du chargement de l'historique</p>
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Historique des modifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            <Activity className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Aucune modification enregistrée</p>
            <p className="text-sm">L'historique apparaîtra ici lors des prochaines modifications</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Historique des modifications
          <Badge variant="secondary" className="ml-auto">
            {history.length} {history.length === 1 ? 'modification' : 'modifications'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {history.map((entry, index) => (
              <HistoryEntry
                key={entry.id}
                entry={entry}
                formatMessage={formatHistoryMessage}
                getIcon={getActionIcon}
                getColor={getActionColor}
                isLast={index === history.length - 1}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

interface HistoryEntryProps {
  entry: TaskHistoryEntry;
  formatMessage: (entry: TaskHistoryEntry) => string;
  getIcon: (actionType: string) => string;
  getColor: (actionType: string) => string;
  isLast: boolean;
}

const HistoryEntry: React.FC<HistoryEntryProps> = ({
  entry,
  formatMessage,
  getIcon,
  getColor,
  isLast,
}) => {
  const message = formatMessage(entry);
  const icon = getIcon(entry.action_type);
  const colorClass = getColor(entry.action_type);
  const changeDate = new Date(entry.changed_at);

  return (
    <div className="relative">
      {/* Timeline line */}
      {!isLast && <div className="bg-border absolute top-12 bottom-0 left-6 w-0.5" />}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`bg-muted flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-lg ${colorClass}`}
        >
          {icon}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-foreground text-sm font-medium">{message}</p>
            <Badge variant="outline" className={`text-xs ${colorClass} border-current`}>
              {entry.action_type}
            </Badge>
          </div>

          <div className="text-muted-foreground flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{entry.user_email || 'Système'}</span>
            </div>

            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span title={format(changeDate, 'PPpp', { locale: fr })}>
                {formatDistanceToNow(changeDate, {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
          </div>

          {/* Détails supplémentaires pour certains types de modifications */}
          {entry.action_type === 'updated' && entry.field_name && (
            <div className="bg-muted/50 mt-2 rounded p-2 text-xs">
              <div className="flex justify-between">
                <span className="font-medium">Champ:</span>
                <span>{entry.field_name}</span>
              </div>
              {entry.old_value && (
                <div className="mt-1 flex justify-between">
                  <span className="font-medium">Avant:</span>
                  <span className="max-w-32 truncate text-red-600">{entry.old_value}</span>
                </div>
              )}
              {entry.new_value && (
                <div className="mt-1 flex justify-between">
                  <span className="font-medium">Après:</span>
                  <span className="max-w-32 truncate text-green-600">{entry.new_value}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!isLast && <Separator className="mt-4" />}
    </div>
  );
};
