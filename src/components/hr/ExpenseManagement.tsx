import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, CreditCard, FileText, CheckCircle, XCircle, Clock, Euro, Camera, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useExpenseManagement } from '@/hooks/useExpenseManagement';

interface ExpenseReport {
  id: string;
  employeeName: string;
  title: string;
  totalAmount: number;
  currency: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  submissionDate: string;
  approvalDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
  expenses: Expense[];
}

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  receiptUrl?: string;
  mileage?: number;
  location?: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  maxAmount?: number;
  requiresReceipt: boolean;
  color: string;
}

export const ExpenseManagement = () => {
  const [activeView, setActiveView] = useState("reports");
  const { 
    expenseReports, 
    expenseItems, 
    expenseCategories, 
    loading, 
    error, 
    updateExpenseReportStatus, 
    getTotalByStatus, 
    getReportItems 
  } = useExpenseManagement();

  if (loading) return <div className="p-6 text-center">Chargement...</div>;
  if (error) return <div className="p-6 text-center text-destructive">Erreur: {error}</div>;

  // Use real data, fallback to sample data if empty
  const categories = expenseCategories.length > 0 ? expenseCategories : [
    { id: "1", name: "Transport", icon: "🚗", max_amount: 500, requires_receipt: true, color: "bg-blue-100 text-blue-800", created_at: '', tenant_id: '' },
    { id: "2", name: "Repas", icon: "🍽️", max_amount: 50, requires_receipt: true, color: "bg-green-100 text-green-800", created_at: '', tenant_id: '' },
    { id: "3", name: "Hébergement", icon: "🏨", max_amount: 200, requires_receipt: true, color: "bg-purple-100 text-purple-800", created_at: '', tenant_id: '' },
    { id: "4", name: "Matériel", icon: "💻", max_amount: 1000, requires_receipt: true, color: "bg-orange-100 text-orange-800", created_at: '', tenant_id: '' },
    { id: "5", name: "Formation", icon: "📚", requires_receipt: true, color: "bg-indigo-100 text-indigo-800", created_at: '', tenant_id: '' },
    { id: "6", name: "Kilométrage", icon: "📏", requires_receipt: false, color: "bg-gray-100 text-gray-800", created_at: '', tenant_id: '' }
  ];

  // Use real data, fallback to sample data if empty  
  const reports = expenseReports.length > 0 ? expenseReports : [
    {
      id: "1",
      employee_id: "emp1",
      employee_name: "Marie Dubois",
      title: "Déplacement client Lyon",
      total_amount: 387.50,
      currency: "EUR",
      status: "submitted",
      submission_date: "2024-01-15",
      created_at: "2024-01-15",
      updated_at: "2024-01-15"
    },
    {
      id: "2",
      employee_id: "emp2",
      employee_name: "Pierre Laurent",
      title: "Formation React avancé",
      total_amount: 1250.00,
      currency: "EUR",
      status: "approved",
      submission_date: "2024-01-08",
      approval_date: "2024-01-12",
      approved_by: "Sophie Martin",
      created_at: "2024-01-08",
      updated_at: "2024-01-12"
    },
    {
      id: "3",
      employee_id: "emp3",
      employee_name: "Sophie Chen",
      title: "Achat matériel bureau",
      total_amount: 245.99,
      currency: "EUR",
      status: "rejected",
      submission_date: "2024-01-12",
      rejection_reason: "Matériel non conforme aux standards entreprise",
      created_at: "2024-01-12",
      updated_at: "2024-01-12"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'paid': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'submitted': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

// This function is now provided by the hook

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Notes de frais</h2>
          <p className="text-muted-foreground">Gestion des frais et remboursements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Camera className="h-4 w-4 mr-2" />
            Scanner reçu
          </Button>
          <Button>
            <Receipt className="h-4 w-4 mr-2" />
            Nouvelle note
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">{getTotalByStatus('submitted').toFixed(2)} €</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approuvé</p>
                <p className="text-2xl font-bold">{getTotalByStatus('approved').toFixed(2)} €</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejeté</p>
                <p className="text-2xl font-bold">{getTotalByStatus('rejected').toFixed(2)} €</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total ce mois</p>
                <p className="text-2xl font-bold">
                  {reports.reduce((total, report) => total + report.total_amount, 0).toFixed(2)} €
                </p>
              </div>
              <Euro className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Notes de frais
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Catégories
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Euro className="h-4 w-4" />
            Analyses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4">
            {reports.map((report) => {
              const reportItems = getReportItems(report.id);
              
              return (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {report.employee_name} • Soumis le {report.submission_date && new Date(report.submission_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(report.status)}>
                        {getStatusIcon(report.status)}
                        {report.status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          {report.total_amount.toFixed(2)} {report.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.approval_date && report.approved_by && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm text-green-800">
                        ✅ Approuvé le {new Date(report.approval_date).toLocaleDateString()} par {report.approved_by}
                      </p>
                    </div>
                  )}
                  
                  {report.rejection_reason && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-800">
                        ❌ Rejeté: {report.rejection_reason}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium">Détail des frais</h4>
                    {reportItems.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={
                              categories.find(cat => cat.name === expense.category_name)?.color || 
                              "bg-gray-100 text-gray-800"
                            }>
                              {expense.category_name}
                            </Badge>
                            <span className="text-sm font-medium">{expense.description}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                            {expense.location && <span>📍 {expense.location}</span>}
                            {expense.mileage && <span>🛣️ {expense.mileage} km</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {expense.amount.toFixed(2)} {expense.currency}
                          </span>
                          {expense.receipt_url && (
                            <Button variant="ghost" size="sm">
                              <Receipt className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex gap-2">
                      {report.status === 'submitted' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => updateExpenseReportStatus(report.id, 'rejected', 'Rejeté par le manager')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => updateExpenseReportStatus(report.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approuver
                          </Button>
                        </>
                      )}
                      {report.status === 'approved' && (
                        <Button 
                          size="sm"
                          onClick={() => updateExpenseReportStatus(report.id, 'paid')}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Marquer comme payé
                        </Button>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">{category.icon}</div>
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <Badge className={category.color}>
                        {category.requires_receipt ? 'Justificatif requis' : 'Pas de justificatif'}
                      </Badge>
                    </div>
                  </div>
                  
                  {category.max_amount && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Montant maximum</p>
                      <p className="font-bold text-lg">{category.max_amount} €</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyses des frais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Euro className="h-12 w-12 mx-auto mb-4" />
                  <p>Graphiques d'analyse à venir</p>
                  <p className="text-sm">Répartition par catégorie, évolution mensuelle, comparaisons</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};