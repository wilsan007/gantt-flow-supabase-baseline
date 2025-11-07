/**
 * 📄 Ma Page Demandes Administratives
 */

import { useState } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { AdministrativeRequestDialog } from '@/components/hr/AdministrativeRequestDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-blue-500', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-yellow-500', icon: AlertTriangle },
  completed: { label: 'Terminé', color: 'bg-green-500', icon: CheckCircle2 },
  cancelled: { label: 'Annulé', color: 'bg-gray-500', icon: Clock },
};

const PRIORITY_CONFIG = {
  low: { label: 'Basse', color: 'bg-gray-500' },
  normal: { label: 'Normale', color: 'bg-blue-500' },
  high: { label: 'Haute', color: 'bg-orange-500' },
  urgent: { label: 'Urgente', color: 'bg-red-500' },
};

export default function MyAdminRequestsPage() {
  const { administrativeRequests, loading } = useHRSelfService();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const filtered = administrativeRequests.filter((request) => {
    if (selectedTab === 'all') return true;
    return request.status === selectedTab;
  });

  const stats = {
    total: administrativeRequests.length,
    pending: administrativeRequests.filter(r => r.status === 'pending').length,
    in_progress: administrativeRequests.filter(r => r.status === 'in_progress').length,
    completed: administrativeRequests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Mes Demandes Administratives
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos demandes auprès du service RH
          </p>
        </div>

        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Demande
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
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
              En Cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{stats.in_progress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Terminées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>
            Toutes vos demandes administratives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">En Attente ({stats.pending})</TabsTrigger>
              <TabsTrigger value="in_progress">En Cours ({stats.in_progress})</TabsTrigger>
              <TabsTrigger value="completed">Terminées ({stats.completed})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Chargement...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune demande pour le moment
                </div>
              ) : (
                filtered.map((request) => {
                  const statusConfig = STATUS_CONFIG[request.status as keyof typeof STATUS_CONFIG];
                  const priorityConfig = PRIORITY_CONFIG[request.priority as keyof typeof PRIORITY_CONFIG];
                  const StatusIcon = statusConfig?.icon || Clock;

                  return (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {request.subject}
                              </h3>
                              <Badge className={statusConfig?.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig?.label}
                              </Badge>
                              <Badge className={priorityConfig?.color}>
                                {priorityConfig?.label}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3">
                              <div>
                                <p className="text-muted-foreground">Type</p>
                                <p className="font-medium capitalize">
                                  {request.request_type?.replace(/_/g, ' ')}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Demandé le</p>
                                <p className="font-medium">
                                  {format(new Date(request.created_at), 'dd MMM yyyy', { locale: fr })}
                                </p>
                              </div>
                              {request.completed_at && (
                                <div>
                                  <p className="text-muted-foreground">Terminé le</p>
                                  <p className="font-medium">
                                    {format(new Date(request.completed_at), 'dd MMM yyyy', { locale: fr })}
                                  </p>
                                </div>
                              )}
                            </div>

                            {request.description && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                                <p className="text-sm text-muted-foreground">{request.description}</p>
                              </div>
                            )}

                            {request.response && (
                              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-sm font-medium text-green-800">Réponse RH:</p>
                                <p className="text-sm text-green-700">{request.response}</p>
                              </div>
                            )}

                            {request.attachment_url && (
                              <div className="mt-3">
                                <a
                                  href={request.attachment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline flex items-center gap-1"
                                >
                                  <FileText className="h-4 w-4" />
                                  Voir pièce jointe
                                </a>
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

      {/* Dialog */}
      <AdministrativeRequestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
