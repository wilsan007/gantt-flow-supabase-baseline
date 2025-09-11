import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, CreditCard, FileText, CheckCircle, XCircle, Clock, Euro, Camera, Upload } from "lucide-react";
import { useExpenseManagement } from '@/hooks/useExpenseManagement';

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

  // Utiliser uniquement les vraies données de la base
  const categories = expenseCategories;
  const reports = expenseReports;

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
          {reports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucune note de frais</h3>
                <p className="text-muted-foreground">Commencez par créer votre première note de frais.</p>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          {categories.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucune catégorie</h3>
                <p className="text-muted-foreground">Ajoutez des catégories pour organiser vos frais.</p>
              </CardContent>
            </Card>
          ) : (
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
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par statut</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      En attente
                    </span>
                    <span className="font-bold">{getTotalByStatus('submitted').toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Approuvé
                    </span>
                    <span className="font-bold">{getTotalByStatus('approved').toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      Rejeté
                    </span>
                    <span className="font-bold">{getTotalByStatus('rejected').toFixed(2)}€</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map(category => {
                    const categoryTotal = expenseItems
                      .filter(item => item.category_name === category.name)
                      .reduce((sum, item) => sum + item.amount, 0);
                    return (
                      <div key={category.id} className="flex justify-between items-center">
                        <span>{category.name}</span>
                        <span className="font-bold">{categoryTotal.toFixed(2)}€</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total des frais</h3>
                    <p className="text-2xl font-bold">
                      {expenseReports.reduce((sum, report) => sum + report.total_amount, 0).toFixed(2)}€
                    </p>
                  </div>
                  <Euro className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Frais moyens</h3>
                    <p className="text-2xl font-bold">
                      {expenseReports.length > 0 ? 
                        (expenseReports.reduce((sum, report) => sum + report.total_amount, 0) / expenseReports.length).toFixed(2) 
                        : '0.00'}€
                    </p>
                  </div>
                  <Receipt className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Nombre de notes</h3>
                    <p className="text-2xl font-bold">{expenseReports.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};