import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, CreditCard, FileText, CheckCircle, XCircle, Clock, Euro, Camera, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const mockExpenseCategories: ExpenseCategory[] = [
    { id: "1", name: "Transport", icon: "🚗", maxAmount: 500, requiresReceipt: true, color: "bg-blue-100 text-blue-800" },
    { id: "2", name: "Repas", icon: "🍽️", maxAmount: 50, requiresReceipt: true, color: "bg-green-100 text-green-800" },
    { id: "3", name: "Hébergement", icon: "🏨", maxAmount: 200, requiresReceipt: true, color: "bg-purple-100 text-purple-800" },
    { id: "4", name: "Matériel", icon: "💻", maxAmount: 1000, requiresReceipt: true, color: "bg-orange-100 text-orange-800" },
    { id: "5", name: "Formation", icon: "📚", requiresReceipt: true, color: "bg-indigo-100 text-indigo-800" },
    { id: "6", name: "Kilométrage", icon: "📏", requiresReceipt: false, color: "bg-gray-100 text-gray-800" }
  ];

  const mockExpenseReports: ExpenseReport[] = [
    {
      id: "1",
      employeeName: "Marie Dubois",
      title: "Déplacement client Lyon",
      totalAmount: 387.50,
      currency: "EUR",
      status: "submitted",
      submissionDate: "2024-01-15",
      expenses: [
        { id: "e1", date: "2024-01-10", category: "Transport", description: "Train Paris-Lyon", amount: 89.00, currency: "EUR", receiptUrl: "#" },
        { id: "e2", date: "2024-01-10", category: "Hébergement", description: "Hôtel Mercure Lyon", amount: 120.00, currency: "EUR", receiptUrl: "#" },
        { id: "e3", date: "2024-01-11", category: "Repas", description: "Déjeuner client", amount: 45.50, currency: "EUR", receiptUrl: "#" },
        { id: "e4", date: "2024-01-11", category: "Kilométrage", description: "Déplacements locaux", amount: 133.00, currency: "EUR", mileage: 350 }
      ]
    },
    {
      id: "2",
      employeeName: "Pierre Laurent",
      title: "Formation React avancé",
      totalAmount: 1250.00,
      currency: "EUR",
      status: "approved",
      submissionDate: "2024-01-08",
      approvalDate: "2024-01-12",
      approvedBy: "Sophie Martin",
      expenses: [
        { id: "e5", date: "2024-01-05", category: "Formation", description: "Formation React Advanced", amount: 1200.00, currency: "EUR", receiptUrl: "#" },
        { id: "e6", date: "2024-01-05", category: "Repas", description: "Déjeuner formation", amount: 50.00, currency: "EUR", receiptUrl: "#" }
      ]
    },
    {
      id: "3",
      employeeName: "Sophie Chen",
      title: "Achat matériel bureau",
      totalAmount: 245.99,
      currency: "EUR",
      status: "rejected",
      submissionDate: "2024-01-12",
      rejectionReason: "Matériel non conforme aux standards entreprise",
      expenses: [
        { id: "e7", date: "2024-01-10", category: "Matériel", description: "Clavier mécanique", amount: 149.99, currency: "EUR", receiptUrl: "#" },
        { id: "e8", date: "2024-01-10", category: "Matériel", description: "Souris ergonomique", amount: 96.00, currency: "EUR", receiptUrl: "#" }
      ]
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

  const getTotalByStatus = (status: string) => {
    return mockExpenseReports
      .filter(report => report.status === status)
      .reduce((total, report) => total + report.totalAmount, 0);
  };

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
                  {mockExpenseReports.reduce((total, report) => total + report.totalAmount, 0).toFixed(2)} €
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
            {mockExpenseReports.map((report) => (
              <Card key={report.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {report.employeeName} • Soumis le {report.submissionDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(report.status)}>
                        {getStatusIcon(report.status)}
                        {report.status}
                      </Badge>
                      <div className="text-right">
                        <p className="text-xl font-bold">
                          {report.totalAmount.toFixed(2)} {report.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.approvalDate && report.approvedBy && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <p className="text-sm text-green-800">
                        ✅ Approuvé le {report.approvalDate} par {report.approvedBy}
                      </p>
                    </div>
                  )}
                  
                  {report.rejectionReason && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-800">
                        ❌ Rejeté: {report.rejectionReason}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium">Détail des frais</h4>
                    {report.expenses.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={
                              mockExpenseCategories.find(cat => cat.name === expense.category)?.color || 
                              "bg-gray-100 text-gray-800"
                            }>
                              {expense.category}
                            </Badge>
                            <span className="text-sm font-medium">{expense.description}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{expense.date}</span>
                            {expense.location && <span>📍 {expense.location}</span>}
                            {expense.mileage && <span>🛣️ {expense.mileage} km</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            {expense.amount.toFixed(2)} {expense.currency}
                          </span>
                          {expense.receiptUrl && (
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
                          <Button variant="outline" size="sm">
                            <XCircle className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                          <Button size="sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approuver
                          </Button>
                        </>
                      )}
                      {report.status === 'approved' && (
                        <Button size="sm">
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockExpenseCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-2xl">{category.icon}</div>
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <Badge className={category.color}>
                        {category.requiresReceipt ? 'Justificatif requis' : 'Pas de justificatif'}
                      </Badge>
                    </div>
                  </div>
                  
                  {category.maxAmount && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Montant maximum</p>
                      <p className="font-bold text-lg">{category.maxAmount} €</p>
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