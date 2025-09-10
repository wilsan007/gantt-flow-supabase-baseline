import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Download, FileSpreadsheet, Lock, CheckCircle, AlertCircle, TrendingUp, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PayrollPeriod {
  id: string;
  year: number;
  month: number;
  status: 'draft' | 'locked' | 'processed' | 'exported';
  lockDate?: string;
  processedDate?: string;
  totalGross: number;
  totalNet: number;
  totalEmployees: number;
  totalCharges: number;
}

interface EmployeePayroll {
  id: string;
  employeeId: string;
  employeeName: string;
  position: string;
  baseSalary: number;
  bonuses: PayrollComponent[];
  deductions: PayrollComponent[];
  grossTotal: number;
  netTotal: number;
  socialCharges: number;
  hoursWorked: number;
  standardHours: number;
  overtimeHours: number;
}

interface PayrollComponent {
  id: string;
  type: 'bonus' | 'deduction' | 'benefit';
  name: string;
  amount: number;
  isPercentage: boolean;
  isTaxable: boolean;
}

interface PayrollCheck {
  id: string;
  type: 'attendance' | 'hours' | 'leaves' | 'expenses';
  description: string;
  status: 'ok' | 'warning' | 'error';
  details?: string;
  affectedEmployees?: string[];
}

export const PayrollManagement = () => {
  const [activeView, setActiveView] = useState("periods");
  const [selectedPeriod, setSelectedPeriod] = useState("2024-01");

  const mockPayrollPeriods: PayrollPeriod[] = [
    {
      id: "1",
      year: 2024,
      month: 1,
      status: "processed",
      lockDate: "2024-01-25",
      processedDate: "2024-01-31",
      totalGross: 125000,
      totalNet: 95000,
      totalEmployees: 25,
      totalCharges: 35000
    },
    {
      id: "2",
      year: 2023,
      month: 12,
      status: "exported",
      lockDate: "2023-12-25",
      processedDate: "2023-12-31",
      totalGross: 130000,
      totalNet: 98500,
      totalEmployees: 24,
      totalCharges: 36500
    },
    {
      id: "3",
      year: 2024,
      month: 2,
      status: "draft",
      totalGross: 0,
      totalNet: 0,
      totalEmployees: 26,
      totalCharges: 0
    }
  ];

  const mockEmployeePayroll: EmployeePayroll[] = [
    {
      id: "1",
      employeeId: "emp1",
      employeeName: "Marie Dubois",
      position: "Développeuse Senior",
      baseSalary: 5000,
      grossTotal: 5250,
      netTotal: 3990,
      socialCharges: 1470,
      hoursWorked: 152,
      standardHours: 152,
      overtimeHours: 0,
      bonuses: [
        { id: "b1", type: "bonus", name: "Prime performance", amount: 250, isPercentage: false, isTaxable: true }
      ],
      deductions: []
    },
    {
      id: "2",
      employeeId: "emp2",
      employeeName: "Pierre Laurent",
      position: "Chef de projet",
      baseSalary: 4500,
      grossTotal: 4950,
      netTotal: 3762,
      socialCharges: 1386,
      hoursWorked: 168,
      standardHours: 152,
      overtimeHours: 16,
      bonuses: [
        { id: "b2", type: "bonus", name: "Heures supplémentaires", amount: 450, isPercentage: false, isTaxable: true }
      ],
      deductions: []
    }
  ];

  const mockPayrollChecks: PayrollCheck[] = [
    {
      id: "1",
      type: "attendance",
      description: "Vérification des présences",
      status: "ok",
      details: "Toutes les présences sont correctement saisies"
    },
    {
      id: "2",
      type: "hours",
      description: "Contrôle des heures travaillées",
      status: "warning",
      details: "3 employés ont des heures supplémentaires non validées",
      affectedEmployees: ["Pierre Laurent", "Sophie Chen", "Marc Durand"]
    },
    {
      id: "3",
      type: "leaves",
      description: "Validation des congés",
      status: "error",
      details: "2 demandes de congés en attente d'approbation",
      affectedEmployees: ["Julie Martin", "Thomas Moreau"]
    },
    {
      id: "4",
      type: "expenses",
      description: "Intégration notes de frais",
      status: "ok",
      details: "Toutes les notes approuvées sont intégrées"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': case 'exported': return 'bg-green-100 text-green-800 border-green-200';
      case 'locked': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCheckStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': case 'exported': case 'ok': return <CheckCircle className="h-4 w-4" />;
      case 'locked': return <Lock className="h-4 w-4" />;
      case 'warning': case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const formatPeriod = (year: number, month: number) => {
    return new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion de la Paie</h2>
          <p className="text-muted-foreground">Préparation et contrôles de paie</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Importer données
          </Button>
          <Button>
            <Lock className="h-4 w-4 mr-2" />
            Verrouiller période
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="periods" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Périodes
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Bulletins
          </TabsTrigger>
          <TabsTrigger value="checks" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Contrôles
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="periods" className="space-y-4">
          <div className="grid gap-4">
            {mockPayrollPeriods.map((period) => (
              <Card key={period.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {formatPeriod(period.year, period.month)}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {period.totalEmployees} employés
                      </p>
                    </div>
                    <Badge className={getStatusColor(period.status)}>
                      {getStatusIcon(period.status)}
                      {period.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Salaire brut</p>
                      <p className="text-xl font-bold">{period.totalGross.toLocaleString()} €</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Salaire net</p>
                      <p className="text-xl font-bold">{period.totalNet.toLocaleString()} €</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Charges sociales</p>
                      <p className="text-xl font-bold">{period.totalCharges.toLocaleString()} €</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Coût total</p>
                      <p className="text-xl font-bold">
                        {(period.totalGross + period.totalCharges).toLocaleString()} €
                      </p>
                    </div>
                  </div>

                  {period.lockDate && (
                    <div className="text-sm text-muted-foreground">
                      🔒 Verrouillé le {period.lockDate}
                      {period.processedDate && ` • Traité le ${period.processedDate}`}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t">
                    <div className="flex gap-2">
                      {period.status === 'draft' && (
                        <>
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Contrôler
                          </Button>
                          <Button size="sm">
                            <Lock className="h-4 w-4 mr-2" />
                            Verrouiller
                          </Button>
                        </>
                      )}
                      {period.status === 'processed' && (
                        <Button size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Exporter
                        </Button>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      Voir détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Bulletins de paie</h3>
            <Select defaultValue="2024-01">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-02">Février 2024</SelectItem>
                <SelectItem value="2024-01">Janvier 2024</SelectItem>
                <SelectItem value="2023-12">Décembre 2023</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {mockEmployeePayroll.map((payroll) => (
              <Card key={payroll.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{payroll.employeeName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{payroll.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">{payroll.netTotal.toLocaleString()} €</p>
                      <p className="text-sm text-muted-foreground">Net à payer</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Salaire de base</p>
                      <p className="font-bold">{payroll.baseSalary.toLocaleString()} €</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total brut</p>
                      <p className="font-bold">{payroll.grossTotal.toLocaleString()} €</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Charges sociales</p>
                      <p className="font-bold">{payroll.socialCharges.toLocaleString()} €</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Heures travaillées</p>
                      <p className="font-bold">
                        {payroll.hoursWorked}h
                        {payroll.overtimeHours > 0 && (
                          <span className="text-orange-600"> (+{payroll.overtimeHours}h sup)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {(payroll.bonuses.length > 0 || payroll.deductions.length > 0) && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Éléments variables</h4>
                      
                      {payroll.bonuses.map((bonus) => (
                        <div key={bonus.id} className="flex items-center justify-between p-2 rounded bg-green-50">
                          <span className="text-sm text-green-800">+ {bonus.name}</span>
                          <span className="font-medium text-green-800">
                            {bonus.amount.toLocaleString()} €
                          </span>
                        </div>
                      ))}
                      
                      {payroll.deductions.map((deduction) => (
                        <div key={deduction.id} className="flex items-center justify-between p-2 rounded bg-red-50">
                          <span className="text-sm text-red-800">- {deduction.name}</span>
                          <span className="font-medium text-red-800">
                            {deduction.amount.toLocaleString()} €
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger bulletin
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checks" className="space-y-4">
          <div className="grid gap-4">
            {mockPayrollChecks.map((check) => (
              <Card key={check.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <div>
                        <h3 className="font-medium">{check.description}</h3>
                        <p className="text-sm text-muted-foreground">{check.details}</p>
                      </div>
                    </div>
                    <Badge className={getCheckStatusColor(check.status)}>
                      {check.status}
                    </Badge>
                  </div>

                  {check.affectedEmployees && check.affectedEmployees.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50">
                      <p className="text-sm font-medium mb-2">Employés concernés:</p>
                      <div className="flex flex-wrap gap-2">
                        {check.affectedEmployees.map((employee, index) => (
                          <Badge key={index} variant="outline">
                            {employee}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Export Comptabilité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Générer les écritures comptables pour intégration dans votre logiciel de comptabilité
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Déclarations Sociales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Préparer les fichiers pour les déclarations URSSAF et autres organismes sociaux
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    DSN
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    DADS-U
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Rapports Analytiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Analyses des coûts salariaux par département, évolution des charges
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Rapport mensuel
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Analyse annuelle
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Bulletins de Paie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Génération automatique et envoi des bulletins de paie par email
                </p>
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Générer tous
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Envoi groupé
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};