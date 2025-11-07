/**
 * 🏠 Ma Page Télétravail
 */

import { useState } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { RemoteWorkRequestDialog } from '@/components/hr/RemoteWorkRequestDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-blue-500', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-green-500', icon: CheckCircle2 },
  rejected: { label: 'Rejeté', color: 'bg-red-500', icon: XCircle },
};

export default function MyRemoteWorkPage() {
  const { remoteWorkRequests, loading } = useHRSelfService();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const filtered = remoteWorkRequests.filter((request) => {
    if (selectedTab === 'all') return true;
    return request.status === selectedTab;
  });

  const stats = {
    total: remoteWorkRequests.length,
    pending: remoteWorkRequests.filter(r => r.status === 'pending').length,
    approved: remoteWorkRequests.filter(r => r.status === 'approved').length,
    rejected: remoteWorkRequests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Home className="h-8 w-8" />
            Mes Demandes de Télétravail
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos demandes de travail à distance
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
              Approuvées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejetées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste */}
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>
            Toutes vos demandes de télétravail
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">En Attente ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approuvées ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejetées ({stats.rejected})</TabsTrigger>
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
                  const StatusIcon = statusConfig?.icon || Clock;

                  return (
                    <Card key={request.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg capitalize">
                                Télétravail - {request.frequency?.replace(/_/g, ' ')}
                              </h3>
                              <Badge className={statusConfig?.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig?.label}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3">
                              <div>
                                <p className="text-muted-foreground">Date début</p>
                                <p className="font-medium">
                                  {format(new Date(request.start_date), 'dd MMM yyyy', { locale: fr })}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Date fin</p>
                                <p className="font-medium">
                                  {request.end_date ? format(new Date(request.end_date), 'dd MMM yyyy', { locale: fr }) : 'Indéterminée'}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Demandé le</p>
                                <p className="font-medium">
                                  {format(new Date(request.request_date), 'dd MMM yyyy', { locale: fr })}
                                </p>
                              </div>
                            </div>

                            {request.reason && (
                              <div className="mt-3 p-3 bg-muted/50 rounded-md">
                                <p className="text-sm font-medium mb-1">Raison:</p>
                                <p className="text-sm text-muted-foreground">{request.reason}</p>
                              </div>
                            )}

                            {request.rejection_reason && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm font-medium text-red-800">Raison du refus:</p>
                                <p className="text-sm text-red-700">{request.rejection_reason}</p>
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
      <RemoteWorkRequestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
