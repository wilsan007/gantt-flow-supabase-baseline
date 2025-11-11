/**
 * 🏥 Ma Page Justificatifs d'Absence
 */

import { useState } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { AbsenceJustificationDialog } from '@/components/hr/AbsenceJustificationDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-blue-500', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-green-500', icon: CheckCircle2 },
  rejected: { label: 'Rejeté', color: 'bg-red-500', icon: XCircle },
};

export default function MyAbsencesPage() {
  const { absenceJustifications, loading } = useHRSelfService();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const filtered = absenceJustifications.filter(absence => {
    if (selectedTab === 'all') return true;
    return absence.status === selectedTab;
  });

  const stats = {
    total: absenceJustifications.length,
    pending: absenceJustifications.filter(a => a.status === 'pending').length,
    approved: absenceJustifications.filter(a => a.status === 'approved').length,
    rejected: absenceJustifications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <AlertCircle className="h-8 w-8" />
            Mes Justificatifs d'Absence
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gérez vos justificatifs d'absence et certificats médicaux
          </p>
        </div>

        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Justificatif
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approuvés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejetés</CardTitle>
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
          <CardDescription>Tous vos justificatifs d'absence</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">Tous ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">En Attente ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approuvés ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejetés ({stats.rejected})</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4 space-y-4">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">Chargement...</div>
              ) : filtered.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucun justificatif pour le moment
                </div>
              ) : (
                filtered.map(absence => {
                  const statusConfig = STATUS_CONFIG[absence.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConfig?.icon || Clock;

                  return (
                    <Card key={absence.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <h3 className="text-lg font-semibold capitalize">
                                {absence.absence_type?.replace(/_/g, ' ')}
                              </h3>
                              <Badge className={statusConfig?.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusConfig?.label}
                              </Badge>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
                              <div>
                                <p className="text-muted-foreground">Date absence</p>
                                <p className="font-medium">
                                  {format(new Date(absence.absence_date), 'dd MMMM yyyy', {
                                    locale: fr,
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Soumis le</p>
                                <p className="font-medium">
                                  {format(new Date(absence.created_at), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                </p>
                              </div>
                              {absence.document_url && (
                                <div>
                                  <p className="text-muted-foreground">Justificatif</p>
                                  <a
                                    href={absence.document_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-primary hover:underline"
                                  >
                                    <FileText className="h-4 w-4" />
                                    Voir document
                                  </a>
                                </div>
                              )}
                            </div>

                            {absence.reason && (
                              <p className="mt-3 text-sm text-muted-foreground">{absence.reason}</p>
                            )}

                            {absence.rejection_reason && (
                              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                                <p className="text-sm font-medium text-red-800">Raison du refus:</p>
                                <p className="text-sm text-red-700">{absence.rejection_reason}</p>
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
      <AbsenceJustificationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => setIsDialogOpen(false)}
      />
    </div>
  );
}
