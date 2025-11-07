/**
 * 👔 Panel d'Approbation Manager - Pattern Workday/BambooHR
 */

import { useState } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Clock, Receipt, AlertCircle, Home, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type ApprovalType = 'expense' | 'timesheet' | 'absence' | 'remote_work' | 'admin_request';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
  type: ApprovalType;
  action: 'approve' | 'reject';
  onConfirm: (reason?: string) => void;
}

function ApprovalDialog({
  open,
  onOpenChange,
  item,
  type,
  action,
  onConfirm,
}: ApprovalDialogProps) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    onConfirm(action === 'reject' ? reason : undefined);
    setReason('');
    onOpenChange(false);
  };

  const typeLabels: Record<ApprovalType, string> = {
    expense: 'note de frais',
    timesheet: 'timesheet',
    absence: "justificatif d'absence",
    remote_work: 'demande de télétravail',
    admin_request: 'demande administrative',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'approve' ? 'Approuver' : 'Rejeter'} la {typeLabels[type]}
          </DialogTitle>
          <DialogDescription>
            {action === 'approve'
              ? `Confirmer l'approbation de cette ${typeLabels[type]} ?`
              : `Indiquez la raison du rejet de cette ${typeLabels[type]}.`}
          </DialogDescription>
        </DialogHeader>

        {action === 'reject' && (
          <div className="space-y-2">
            <Label htmlFor="reason">Raison du refus *</Label>
            <Textarea
              id="reason"
              placeholder="Expliquez pourquoi cette demande est rejetée..."
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
            />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant={action === 'approve' ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={action === 'reject' && !reason}
          >
            {action === 'approve' ? 'Approuver' : 'Rejeter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApprovalPanel() {
  const {
    expenseReports,
    timesheets,
    absenceJustifications,
    remoteWorkRequests,
    administrativeRequests,
    loading,
  } = useHRSelfService();

  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<{
    item: any;
    type: ApprovalType;
    action: 'approve' | 'reject';
  } | null>(null);

  // Filtrer les demandes en attente
  const pendingExpenses = expenseReports.filter(e => e.status === 'submitted');
  const pendingTimesheets = timesheets.filter(t => t.status === 'submitted');
  const pendingAbsences = absenceJustifications.filter(a => a.status === 'pending');
  const pendingRemoteWork = remoteWorkRequests.filter(r => r.status === 'pending');
  const pendingAdminRequests = administrativeRequests.filter(r => r.status === 'pending');

  const totalPending =
    pendingExpenses.length +
    pendingTimesheets.length +
    pendingAbsences.length +
    pendingRemoteWork.length +
    pendingAdminRequests.length;

  const openDialog = (item: any, type: ApprovalType, action: 'approve' | 'reject') => {
    setDialogData({ item, type, action });
    setDialogOpen(true);
  };

  const handleApproval = async (reason?: string) => {
    if (!dialogData) return;

    const { item, type, action } = dialogData;

    // TODO: Implémenter les appels API pour approuver/rejeter
    // Pour l'instant, juste un toast
    toast({
      title: action === 'approve' ? 'Approuvé' : 'Rejeté',
      description: `La demande a été ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès.`,
    });

    setDialogData(null);
  };

  const renderExpenseCard = (expense: any) => (
    <Card key={expense.id}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">{expense.title}</h3>
              <Badge className="bg-blue-500">En attente</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Montant</p>
                <p className="text-lg font-bold">
                  {expense.amount} {expense.currency}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Catégorie</p>
                <p className="font-medium capitalize">{expense.category?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {format(new Date(expense.expense_date), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
            {expense.description && (
              <p className="mt-3 text-sm text-muted-foreground">{expense.description}</p>
            )}
          </div>
          <div className="ml-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => openDialog(expense, 'expense', 'reject')}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Rejeter
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openDialog(expense, 'expense', 'approve')}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Approuver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderTimesheetCard = (timesheet: any) => (
    <Card key={timesheet.id}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">
                Semaine du {format(new Date(timesheet.week_start_date), 'dd MMM', { locale: fr })}
              </h3>
              <Badge className="bg-blue-500">En attente</Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Total heures</p>
                <p className="text-lg font-bold">{Number(timesheet.total_hours).toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-muted-foreground">Heures normales</p>
                <p className="font-medium">{Number(timesheet.regular_hours).toFixed(1)}h</p>
              </div>
              <div>
                <p className="text-muted-foreground">Heures sup.</p>
                <p className="font-medium text-orange-600">
                  {Number(timesheet.overtime_hours).toFixed(1)}h
                </p>
              </div>
            </div>
          </div>
          <div className="ml-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => openDialog(timesheet, 'timesheet', 'reject')}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Rejeter
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openDialog(timesheet, 'timesheet', 'approve')}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Approuver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAbsenceCard = (absence: any) => (
    <Card key={absence.id}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold capitalize">
                {absence.absence_type?.replace(/_/g, ' ')}
              </h3>
              <Badge className="bg-blue-500">En attente</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date absence</p>
                <p className="font-medium">
                  {format(new Date(absence.absence_date), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Justificatif</p>
                {absence.document_url ? (
                  <a
                    href={absence.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Voir document
                  </a>
                ) : (
                  <p>Aucun</p>
                )}
              </div>
            </div>
            {absence.reason && (
              <p className="mt-3 text-sm text-muted-foreground">{absence.reason}</p>
            )}
          </div>
          <div className="ml-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => openDialog(absence, 'absence', 'reject')}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Rejeter
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openDialog(absence, 'absence', 'approve')}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Approuver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRemoteWorkCard = (request: any) => (
    <Card key={request.id}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <Home className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">
                Télétravail - {request.frequency?.replace(/_/g, ' ')}
              </h3>
              <Badge className="bg-blue-500">En attente</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Début</p>
                <p className="font-medium">
                  {format(new Date(request.start_date), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Fin</p>
                <p className="font-medium">
                  {request.end_date
                    ? format(new Date(request.end_date), 'dd MMM yyyy', { locale: fr })
                    : 'Indéterminée'}
                </p>
              </div>
            </div>
            {request.reason && (
              <p className="mt-3 text-sm text-muted-foreground">{request.reason}</p>
            )}
          </div>
          <div className="ml-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => openDialog(request, 'remote_work', 'reject')}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Rejeter
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openDialog(request, 'remote_work', 'approve')}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Approuver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderAdminRequestCard = (request: any) => (
    <Card key={request.id}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">{request.subject}</h3>
              <Badge className="bg-blue-500">En attente</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium capitalize">{request.request_type?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Priorité</p>
                <Badge>{request.priority}</Badge>
              </div>
            </div>
            {request.description && (
              <p className="mt-3 text-sm text-muted-foreground">{request.description}</p>
            )}
          </div>
          <div className="ml-4 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50"
              onClick={() => openDialog(request, 'admin_request', 'reject')}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Rejeter
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => openDialog(request, 'admin_request', 'approve')}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Approuver
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold">
          <CheckCircle2 className="h-8 w-8" />
          Panel d'Approbation
        </h1>
        <p className="mt-1 text-muted-foreground">Gérez les demandes de votre équipe</p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total En Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalPending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notes de Frais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingExpenses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Timesheets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingTimesheets.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{pendingAbsences.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Autres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {pendingRemoteWork.length + pendingAdminRequests.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes en Attente</CardTitle>
          <CardDescription>Approuvez ou rejetez les demandes de votre équipe</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">Toutes ({totalPending})</TabsTrigger>
              <TabsTrigger value="expenses">Notes de Frais ({pendingExpenses.length})</TabsTrigger>
              <TabsTrigger value="timesheets">Timesheets ({pendingTimesheets.length})</TabsTrigger>
              <TabsTrigger value="absences">Absences ({pendingAbsences.length})</TabsTrigger>
              <TabsTrigger value="other">
                Autres ({pendingRemoteWork.length + pendingAdminRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-4">
              {loading ? (
                <div className="py-8 text-center">Chargement...</div>
              ) : totalPending === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucune demande en attente
                </div>
              ) : (
                <>
                  {pendingExpenses.map(renderExpenseCard)}
                  {pendingTimesheets.map(renderTimesheetCard)}
                  {pendingAbsences.map(renderAbsenceCard)}
                  {pendingRemoteWork.map(renderRemoteWorkCard)}
                  {pendingAdminRequests.map(renderAdminRequestCard)}
                </>
              )}
            </TabsContent>

            <TabsContent value="expenses" className="mt-4 space-y-4">
              {pendingExpenses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucune note de frais en attente
                </div>
              ) : (
                pendingExpenses.map(renderExpenseCard)
              )}
            </TabsContent>

            <TabsContent value="timesheets" className="mt-4 space-y-4">
              {pendingTimesheets.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucun timesheet en attente
                </div>
              ) : (
                pendingTimesheets.map(renderTimesheetCard)
              )}
            </TabsContent>

            <TabsContent value="absences" className="mt-4 space-y-4">
              {pendingAbsences.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucune absence en attente
                </div>
              ) : (
                pendingAbsences.map(renderAbsenceCard)
              )}
            </TabsContent>

            <TabsContent value="other" className="mt-4 space-y-4">
              {pendingRemoteWork.length + pendingAdminRequests.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucune autre demande en attente
                </div>
              ) : (
                <>
                  {pendingRemoteWork.map(renderRemoteWorkCard)}
                  {pendingAdminRequests.map(renderAdminRequestCard)}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog */}
      {dialogData && (
        <ApprovalDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          item={dialogData.item}
          type={dialogData.type}
          action={dialogData.action}
          onConfirm={handleApproval}
        />
      )}
    </div>
  );
}
