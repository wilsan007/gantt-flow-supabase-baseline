import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, FileText, CheckCircle, Clock, TrendingUp, Users, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useHealthSafety } from "@/hooks/useHealthSafety";

interface Incident {
  id: string;
  type: 'accident' | 'near-miss' | 'hazard' | 'illness';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reportedBy: string;
  reportedDate: string;
  location: string;
  affectedEmployee?: string;
  status: 'reported' | 'investigating' | 'action-required' | 'resolved';
  actions: CorrectiveAction[];
  attachments?: string[];
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
  type: 'policy' | 'procedure' | 'training' | 'certificate' | 'inspection';
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
  expiryDate?: string;
  score?: number;
  certificateUrl?: string;
  status: 'completed' | 'expired' | 'due';
}

export const HealthSafety = () => {
  const [activeView, setActiveView] = useState("incidents");
  
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

  const mockIncidents: Incident[] = incidents.length > 0 ? incidents : [
    {
      id: "1",
      type: "accident",
      severity: "medium",
      title: "Chute dans l'escalier",
      description: "Employé a glissé dans l'escalier principal au 2ème étage",
      reportedBy: "Sophie Martin",
      reportedDate: "2024-01-15",
      location: "Escalier principal - 2ème étage",
      affectedEmployee: "Pierre Dubois",
      status: "action-required",
      actions: [
        {
          id: "a1",
          description: "Installer des bandes antidérapantes",
          responsiblePerson: "Service Maintenance",
          dueDate: "2024-01-25",
          status: "in-progress"
        },
        {
          id: "a2",
          description: "Améliorer l'éclairage de l'escalier",
          responsiblePerson: "Service Technique",
          dueDate: "2024-01-30",
          status: "pending"
        }
      ]
    },
    {
      id: "2",
      type: "near-miss",
      severity: "low",
      title: "Quasi-collision parking",
      description: "Deux véhicules ont failli se percuter dans le parking",
      reportedBy: "Marc Laurent",
      reportedDate: "2024-01-12",
      location: "Parking entreprise",
      status: "resolved",
      actions: [
        {
          id: "a3",
          description: "Installer des miroirs de sécurité",
          responsiblePerson: "Service Maintenance",
          dueDate: "2024-01-20",
          status: "completed",
          completedDate: "2024-01-18"
        }
      ]
    }
  ];

  const mockSafetyDocuments: SafetyDocument[] = safetyDocuments.length > 0 ? safetyDocuments : [
    {
      id: "1",
      title: "Politique de Sécurité Générale",
      type: "policy",
      category: "Sécurité",
      version: "v2.1",
      publishedDate: "2024-01-01",
      status: "active",
      downloadUrl: "#"
    },
    {
      id: "2",
      title: "Procédure d'Évacuation d'Urgence",
      type: "procedure",
      category: "Urgence",
      version: "v1.3",
      publishedDate: "2023-11-15",
      status: "active",
      downloadUrl: "#"
    },
    {
      id: "3",
      title: "Certificat Vérification Extincteurs",
      type: "certificate",
      category: "Équipements",
      version: "v1.0",
      publishedDate: "2023-12-20",
      expiryDate: "2024-12-20",
      status: "active",
      downloadUrl: "#"
    },
    {
      id: "4",
      title: "Rapport Inspection Électrique",
      type: "inspection",
      category: "Électricité",
      version: "v1.0",
      publishedDate: "2023-10-15",
      expiryDate: "2024-10-15",
      status: "expired",
      downloadUrl: "#"
    }
  ];

  const mockTrainingRecords: TrainingRecord[] = trainingRecords.length > 0 ? trainingRecords : [
    {
      id: "1",
      employeeName: "Marie Dubois",
      trainingTitle: "Formation Premiers Secours",
      trainingDate: "2023-06-15",
      expiryDate: "2025-06-15",
      score: 95,
      certificateUrl: "#",
      status: "completed"
    },
    {
      id: "2",
      employeeName: "Pierre Laurent",
      trainingTitle: "Sécurité Incendie",
      trainingDate: "2022-12-10",
      expiryDate: "2024-12-10",
      score: 88,
      status: "expired"
    },
    {
      id: "3",
      employeeName: "Sophie Chen",
      trainingTitle: "Manipulation Manuelle",
      trainingDate: "2024-01-08",
      score: 92,
      certificateUrl: "#",
      status: "completed"
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': case 'resolved': case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': case 'investigating': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'action-required': case 'pending': case 'due': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'reported': case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'accident': return '🚨';
      case 'near-miss': return '⚠️';
      case 'hazard': return '⚡';
      case 'illness': return '🏥';
      default: return '📋';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'policy': return '📋';
      case 'procedure': return '📝';
      case 'training': return '🎓';
      case 'certificate': return '🏆';
      case 'inspection': return '🔍';
      default: return '📄';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Santé & Sécurité</h2>
          <p className="text-muted-foreground">Gestion HSE et prévention des risques</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Nouveau document
          </Button>
          <Button>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Déclarer incident
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Incidents ce mois</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Actions en cours</p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Formations expirées</p>
                <p className="text-2xl font-bold">2</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux conformité</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="incidents" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Incidents
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Formations
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          <div className="grid gap-4">
            {mockIncidents.map((incident) => (
              <Card key={incident.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-2xl">{getIncidentIcon(incident.type)}</span>
                        {incident.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Déclaré par {incident.reportedBy} le {incident.reportedDate}
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
                  <p className="text-sm text-muted-foreground">{incident.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Lieu</p>
                      <p className="text-muted-foreground">{incident.location}</p>
                    </div>
                    {incident.affectedEmployee && (
                      <div>
                        <p className="font-medium">Employé concerné</p>
                        <p className="text-muted-foreground">{incident.affectedEmployee}</p>
                      </div>
                    )}
                  </div>

                  {incident.actions.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Actions correctives</h4>
                      {incident.actions.map((action) => (
                        <div key={action.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{action.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Responsable: {action.responsiblePerson} • Échéance: {action.dueDate}
                              {action.completedDate && ` • Terminé le: ${action.completedDate}`}
                            </p>
                          </div>
                          <Badge className={getStatusColor(action.status)}>
                            {action.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {mockSafetyDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <span className="text-xl">{getDocumentIcon(document.type)}</span>
                        {document.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {document.category} • {document.version}
                      </p>
                    </div>
                    <Badge className={getStatusColor(document.status)}>
                      {document.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Publié le</p>
                      <p className="text-muted-foreground">{document.publishedDate}</p>
                    </div>
                    {document.expiryDate && (
                      <div>
                        <p className="font-medium">Expire le</p>
                        <p className={`text-muted-foreground ${document.status === 'expired' ? 'text-red-600 font-medium' : ''}`}>
                          {document.expiryDate}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                    {document.status === 'expired' && (
                      <Button size="sm" className="flex-1">
                        Renouveler
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <div className="grid gap-4">
            {mockTrainingRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{record.employeeName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{record.trainingTitle}</p>
                    </div>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Date de formation</p>
                      <p className="text-muted-foreground">{record.trainingDate}</p>
                    </div>
                    {record.expiryDate && (
                      <div>
                        <p className="font-medium">Expiration</p>
                        <p className={`text-muted-foreground ${record.status === 'expired' ? 'text-red-600 font-medium' : ''}`}>
                          {record.expiryDate}
                        </p>
                      </div>
                    )}
                  </div>

                  {record.score && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Score obtenu</span>
                        <span className="text-sm text-muted-foreground">{record.score}%</span>
                      </div>
                      <Progress value={record.score} className="h-2" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    {record.certificateUrl && (
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Certificat
                      </Button>
                    )}
                    {record.status === 'expired' && (
                      <Button size="sm">
                        <Calendar className="h-4 w-4 mr-2" />
                        Renouveler
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total incidents</h3>
                    <p className="text-2xl font-bold">{incidents.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Incidents critiques</h3>
                    <p className="text-2xl font-bold text-red-600">
                      {incidents.filter(incident => incident.severity === 'critical').length}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Incidents résolus</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {incidents.filter(incident => incident.status === 'resolved').length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Taux résolution</h3>
                    <p className="text-2xl font-bold">
                      {incidents.length > 0 ? 
                        Math.round((incidents.filter(i => i.status === 'resolved').length / incidents.length) * 100) : 
                        0
                      }%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['accident', 'near_miss', 'equipment_failure', 'environmental'].map(type => {
                    const count = incidents.filter(incident => incident.type === type).length;
                    const percentage = incidents.length > 0 ? Math.round((count / incidents.length) * 100) : 0;
                    return (
                      <div key={type} className="flex justify-between items-center">
                        <span className="capitalize">{type.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{count}</span>
                          <span className="text-sm text-muted-foreground">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par sévérité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['low', 'medium', 'high', 'critical'].map(severity => {
                    const count = incidents.filter(incident => incident.severity === severity).length;
                    const percentage = incidents.length > 0 ? Math.round((count / incidents.length) * 100) : 0;
                    const colorClass = severity === 'critical' ? 'text-red-600' : 
                                      severity === 'high' ? 'text-orange-600' : 
                                      severity === 'medium' ? 'text-yellow-600' : 'text-green-600';
                    const displayName = severity === 'low' ? 'Faible' :
                                       severity === 'medium' ? 'Modéré' :
                                       severity === 'high' ? 'Élevé' : 'Critique';
                    return (
                      <div key={severity} className="flex justify-between items-center">
                        <span>{displayName}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${colorClass}`}>{count}</span>
                          <span className="text-sm text-muted-foreground">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};