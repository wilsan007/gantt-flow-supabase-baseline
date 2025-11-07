/**
 * 🎯 LeaveApprovalsPanel - Panneau d'approbation des congés
 * Pattern: BambooHR, Workday, SAP SuccessFactors
 */

import { useState } from 'react';
import { useLeaveApproval, LeaveApproval } from '@/hooks/useLeaveApproval';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, User, Calendar, FileText, Loader2, Bell } from 'lucide-react';

const LEAVE_TYPE_LABELS: Record<string, string> = {
  paid: '🌴 Congés payés',
  sick: '🤒 Congé maladie',
  unpaid: '⏸️ Congé sans solde',
  parental: '👶 Congé parental',
  other: '📋 Autre',
};

interface ApprovalCardProps {
  approval: LeaveApproval;
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, reason: string) => void;
}

const ApprovalCard = ({ approval, onApprove, onReject }: ApprovalCardProps) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const leaveRequest = approval.leave_request;
  if (!leaveRequest) return null;

  const startDate = new Date(leaveRequest.start_date);
  const endDate = new Date(leaveRequest.end_date);
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
                <span className="truncate">{leaveRequest.employee?.full_name || 'Employé'}</span>
              </CardTitle>
              <CardDescription className="mt-1 text-sm">
                {leaveRequest.employee?.department || 'Département'}
              </CardDescription>
            </div>
            <Badge variant="outline">Niveau {approval.approver_level}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Type</span>
              </div>
              <p>{LEAVE_TYPE_LABELS[leaveRequest.leave_type] || leaveRequest.leave_type}</p>
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Durée</span>
              </div>
              <p>
                {days} jour{days > 1 ? 's' : ''}
              </p>
            </div>

            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Période</span>
              </div>
              <p>
                Du {startDate.toLocaleDateString('fr-FR')} au {endDate.toLocaleDateString('fr-FR')}
              </p>
            </div>

            {leaveRequest.reason && (
              <div className="sm:col-span-2">
                <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">Motif</span>
                </div>
                <p className="rounded bg-muted p-2 text-sm">{leaveRequest.reason}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              onClick={() => setShowApproveDialog(true)}
              className="flex-1 sm:flex-none"
              size="sm"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approuver
            </Button>
            <Button
              onClick={() => setShowRejectDialog(true)}
              variant="destructive"
              className="flex-1 sm:flex-none"
              size="sm"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rejeter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Approuver la demande
            </DialogTitle>
            <DialogDescription>Confirmer l'approbation</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Commentaires..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                onApprove(approval.id, notes);
                setShowApproveDialog(false);
                setNotes('');
              }}
              className="w-full sm:w-auto"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rejeter la demande
            </DialogTitle>
            <DialogDescription>Raison requise</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Label htmlFor="reason">Raison du rejet *</Label>
            <Textarea
              id="reason"
              placeholder="Expliquez pourquoi..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (rejectionReason.trim()) {
                  onReject(approval.id, rejectionReason);
                  setShowRejectDialog(false);
                  setRejectionReason('');
                }
              }}
              className="w-full sm:w-auto"
              disabled={!rejectionReason.trim()}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const LeaveApprovalsPanel = () => {
  const { pendingApprovals, myApprovals, loading, approveRequest, rejectRequest, refresh } =
    useLeaveApproval();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
            Approbations de Congés
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Gérez les demandes en attente</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="pending" className="flex-1 sm:flex-none">
            En attente
            {pendingApprovals.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingApprovals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-none">
            Historique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 space-y-4">
          {pendingApprovals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Aucune demande en attente d'approbation</p>
              </CardContent>
            </Card>
          ) : (
            pendingApprovals.map(approval => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprove={approveRequest}
                onReject={rejectRequest}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {myApprovals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Clock className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>Aucun historique d'approbation</p>
              </CardContent>
            </Card>
          ) : (
            myApprovals.map(approval => (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {approval.leave_request?.employee?.full_name}
                      </CardTitle>
                      <CardDescription>
                        {new Date(approval.decision_date || approval.created_at).toLocaleDateString(
                          'fr-FR'
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={approval.status === 'approved' ? 'default' : 'destructive'}>
                      {approval.status === 'approved' ? '✅ Approuvé' : '❌ Rejeté'}
                    </Badge>
                  </div>
                </CardHeader>
                {approval.notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{approval.notes}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
