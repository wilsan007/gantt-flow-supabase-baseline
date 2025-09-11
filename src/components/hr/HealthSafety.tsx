import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Shield, 
  FileText, 
  Calendar,
  Download,
  Eye,
  Plus,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useHealthSafety } from '@/hooks/useHealthSafety';

interface Incident {
  id: string;
  type: 'accident' | 'near-miss' | 'property-damage' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reportedBy: string;
  reportedDate: string;
  location: string;
  affectedEmployee?: string;
  status: 'reported' | 'investigating' | 'action-required' | 'resolved';
  actions?: CorrectiveAction[];
}

interface CorrectiveAction {
  id: string;
  description: string;
  responsiblePerson: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedDate?: string;
}

interface SafetyDocument {
  id: string;
  title: string;
  type: 'policy' | 'procedure' | 'certificate' | 'inspection' | 'training';
  category: string;
  version: string;
  publishedDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'draft';
  downloadUrl: string;
}

interface TrainingRecord {
  id: string;
  employeeName: string;
  trainingTitle: string;
  trainingDate: string;
  completionDate?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  certificateUrl?: string;
  validUntil?: string;
  mandatoryTraining: boolean;
}

export const HealthSafety = () => {
  const {
    incidents,
    safetyDocuments,
    trainingRecords,
    loading,
    error,
    createIncident,
    updateIncident,
    uploadDocument
  } = useHealthSafety();

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  // Utiliser uniquement les vraies données de la base
  const realIncidents = incidents;
  const realSafetyDocuments = safetyDocuments;
  const realTrainingRecords = trainingRecords;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'resolved': 
      case 'active': return 'bg-green-100 text-green-800';
      case 'in-progress': 
      case 'investigating': return 'bg-blue-100 text-blue-800';
      case 'pending': 
      case 'reported': 
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': 
      case 'expired': return 'bg-red-100 text-red-800';
      case 'action-required': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'accident': return <AlertTriangle className="h-4 w-4" />;
      case 'near-miss': return <Eye className="h-4 w-4" />;
      case 'property-damage': return <Shield className="h-4 w-4" />;
      case 'environmental': return <Shield className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const stats = {
    totalIncidents: realIncidents.length,
    openIncidents: realIncidents.filter(i => i.status !== 'resolved').length,
    criticalIncidents: realIncidents.filter(i => i.severity === 'critical' || i.severity === 'high').length,
    pendingActions: realIncidents.reduce((total, incident) => total + (incident.actions?.length || 0), 0),
    overdueTraining: realTrainingRecords.filter(t => t.status === 'expired').length,
    activeDocuments: realSafetyDocuments.filter(d => d.status === 'active').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Santé & Sécurité</h2>
          <p className="text-muted-foreground">Gestion des incidents, formation et conformité</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau document
          </Button>
          <Button>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Déclarer incident
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Incidents totaux</p>
                <p className="text-2xl font-bold">{stats.totalIncidents}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Incidents ouverts</p>
                <p className="text-2xl font-bold text-orange-600">{stats.openIncidents}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Incidents critiques</p>
                <p className="text-2xl font-bold text-red-600">{stats.criticalIncidents}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actions en cours</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendingActions}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Formation en retard</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueTraining}</p>
              </div>
              <BookOpen className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Formations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          {realIncidents.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucun incident déclaré</h3>
                <p className="text-muted-foreground">Commencez par déclarer votre premier incident.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {realIncidents.map((incident) => (
                <Card key={incident.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getTypeIcon(incident.type)}
                          {incident.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {incident.location} • Déclaré par {incident.reportedBy} le {new Date(incident.reportedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{incident.description}</p>
                    
                    {incident.affectedEmployee && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm font-medium">Employé concerné: {incident.affectedEmployee}</p>
                      </div>
                    )}

                    {incident.actions && incident.actions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Actions correctives</h4>
                        {incident.actions.map((action) => (
                          <div key={action.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                            <div className="flex-1">
                              <p className="text-sm">{action.description}</p>
                              <p className="text-xs text-muted-foreground">
                                Responsable: {action.responsiblePerson} • Échéance: {new Date(action.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={getStatusColor(action.status)}>
                              {action.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {incident.status !== 'resolved' && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateIncident(incident.id, { status: 'resolved' })}
                        >
                          Marquer résolu
                        </Button>
                        <Button size="sm" variant="outline">
                          Ajouter action
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {realSafetyDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucun document</h3>
                <p className="text-muted-foreground">Ajoutez des documents de sécurité et conformité.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {realSafetyDocuments.map((document) => (
                <Card key={document.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {document.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {document.category} • Version {document.version}
                        </p>
                      </div>
                      <Badge className={getStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Publié le:</span>
                      <span>{new Date(document.publishedDate).toLocaleDateString()}</span>
                    </div>
                    
                    {document.expiryDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expire le:</span>
                        <span className={
                          new Date(document.expiryDate) < new Date() ? 'text-red-600 font-medium' : ''
                        }>
                          {new Date(document.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4 border-t">
                      <Button size="sm" className="flex-1">
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Voir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          {realTrainingRecords.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Aucune formation</h3>
                <p className="text-muted-foreground">Planifiez des formations de sécurité pour vos employés.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {realTrainingRecords.map((record) => (
                <Card key={record.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{record.employeeName}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {record.trainingTitle}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(record.status)}>
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Date formation:</span>
                        <p className="font-medium">{new Date(record.trainingDate).toLocaleDateString()}</p>
                      </div>
                      {record.expiryDate && (
                        <div>
                          <span className="text-muted-foreground">Expire le:</span>
                          <p className={`font-medium ${
                            new Date(record.expiryDate) < new Date() ? 'text-red-600' : ''
                          }`}>
                            {new Date(record.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {record.score && (
                        <div>
                          <span className="text-muted-foreground">Score:</span>
                          <p className="font-medium">{record.score}/100</p>
                        </div>
                      )}
                    </div>

                    {record.status === 'completed' && record.certificateUrl && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Certificat
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};