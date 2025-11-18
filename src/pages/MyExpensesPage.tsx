/**
 * 💰 Ma Page Notes de Frais - Dashboard Employé
 */

import { useState } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { ExpenseReportForm } from '@/components/hr/ExpenseReportForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Receipt, Plus, Clock, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_CONFIG = {
  draft: { label: 'Brouillon', color: 'bg-gray-500', icon: Clock },
  submitted: { label: 'Soumis', color: 'bg-blue-500', icon: Clock },
  approved_manager: { label: 'Approuvé Manager', color: 'bg-green-500', icon: CheckCircle2 },
  approved_finance: { label: 'Approuvé Finance', color: 'bg-green-600', icon: CheckCircle2 },
  rejected: { label: 'Rejeté', color: 'bg-red-500', icon: XCircle },
  paid: { label: 'Remboursé', color: 'bg-emerald-500', icon: DollarSign },
};

export default function MyExpensesPage() {
  const { expenseReports, loading, submitExpenseReport } = useHRSelfService();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');

  const filteredExpenses = expenseReports.filter(expense => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'pending') return ['draft', 'submitted'].includes(expense.status);
    if (selectedTab === 'approved')
      return ['approved_manager', 'approved_finance', 'paid'].includes(expense.status);
    if (selectedTab === 'rejected') return expense.status === 'rejected';
    return true;
  });

  const stats = {
    total: expenseReports.length,
    pending: expenseReports.filter(e => ['draft', 'submitted'].includes(e.status)).length,
    approved: expenseReports.filter(e =>
      ['approved_manager', 'approved_finance', 'paid'].includes(e.status)
    ).length,
    totalAmount: expenseReports
      .filter(e => e.status === 'paid')
      .reduce((sum, e) => sum + Number(e.amount), 0),
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <Receipt className="h-8 w-8" />
            Mes Notes de Frais
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos frais professionnels et suivez leur remboursement
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Note de Frais
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une Note de Frais</DialogTitle>
            </DialogHeader>
            <ExpenseReportForm
              onSuccess={() => setIsDialogOpen(false)}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">Total Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">Approuvées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              Total Remboursé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalAmount.toFixed(2)} €</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des notes */}
      <Card>
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>Toutes vos notes de frais et leur statut</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              <TabsTrigger value="all">Toutes ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">En Attente ({stats.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approuvées ({stats.approved})</TabsTrigger>
              <TabsTrigger value="rejected">Rejetées</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4 space-y-4">
              {loading ? (
                <div className="text-muted-foreground py-8 text-center">Chargement...</div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  Aucune note de frais pour le moment
                </div>
              ) : (
                filteredExpenses.map(expense => {
                  const statusConfig = STATUS_CONFIG[expense.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConfig?.icon || Clock;

                  return (
                    <Card key={expense.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-3">
                              <h3 className="text-lg font-semibold">{expense.title}</h3>
                              <Badge className={statusConfig?.color}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {statusConfig?.label}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                              <div>
                                <p className="text-muted-foreground">Catégorie</p>
                                <p className="font-medium capitalize">{expense.category}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Montant</p>
                                <p className="text-lg font-medium">
                                  {Number(expense.amount).toFixed(2)} {expense.currency}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Date dépense</p>
                                <p className="font-medium">
                                  {format(new Date(expense.expense_date), 'dd MMM yyyy', {
                                    locale: fr,
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Soumis le</p>
                                <p className="font-medium">
                                  {expense.submitted_at
                                    ? format(new Date(expense.submitted_at), 'dd MMM yyyy', {
                                        locale: fr,
                                      })
                                    : '-'}
                                </p>
                              </div>
                            </div>

                            {expense.description && (
                              <p className="text-muted-foreground mt-3 text-sm">
                                {expense.description}
                              </p>
                            )}

                            {expense.rejection_reason && (
                              <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                                <p className="text-sm font-medium text-red-800">Raison du refus:</p>
                                <p className="text-sm text-red-700">{expense.rejection_reason}</p>
                              </div>
                            )}
                          </div>

                          {expense.status === 'draft' && (
                            <Button size="sm" onClick={() => submitExpenseReport(expense.id)}>
                              Soumettre
                            </Button>
                          )}
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
    </div>
  );
}
