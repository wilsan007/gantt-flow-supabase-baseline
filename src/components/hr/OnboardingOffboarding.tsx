import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, UserMinus, CheckCircle, Clock, AlertCircle, Calendar, User, Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OnboardingProcess {
  id: string;
  employeeName: string;
  position: string;
  department: string;
  startDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
  tasks: OnboardingTask[];
}

interface OnboardingTask {
  id: string;
  title: string;
  responsible: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  category: 'rh' | 'it' | 'manager' | 'employee';
}

interface OffboardingProcess {
  id: string;
  employeeName: string;
  position: string;
  department: string;
  lastWorkDay: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  progress: number;
  tasks: OffboardingTask[];
}

interface OffboardingTask {
  id: string;
  title: string;
  responsible: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  category: 'rh' | 'it' | 'manager' | 'employee';
}

export const OnboardingOffboarding = () => {
  const [activeView, setActiveView] = useState("onboarding");

  const mockOnboardingProcesses: OnboardingProcess[] = [
    {
      id: "1",
      employeeName: "Marie Dubois",
      position: "Développeuse Front-end",
      department: "IT",
      startDate: "2024-01-15",
      status: "in-progress",
      progress: 65,
      tasks: [
        { id: "1", title: "Création compte e-mail", responsible: "IT", dueDate: "2024-01-14", status: "completed", category: "it" },
        { id: "2", title: "Préparation poste de travail", responsible: "IT", dueDate: "2024-01-14", status: "completed", category: "it" },
        { id: "3", title: "Accueil et présentation équipe", responsible: "Manager", dueDate: "2024-01-15", status: "pending", category: "manager" },
        { id: "4", title: "Formation sécurité", responsible: "RH", dueDate: "2024-01-16", status: "pending", category: "rh" }
      ]
    }
  ];

  const mockOffboardingProcesses: OffboardingProcess[] = [
    {
      id: "1",
      employeeName: "Jean Martin",
      position: "Chef de projet",
      department: "Operations",
      lastWorkDay: "2024-02-28",
      status: "scheduled",
      progress: 20,
      tasks: [
        { id: "1", title: "Transmission des responsabilités", responsible: "Manager", dueDate: "2024-02-20", status: "pending", category: "manager" },
        { id: "2", title: "Restitution matériel", responsible: "IT", dueDate: "2024-02-28", status: "pending", category: "it" },
        { id: "3", title: "Entretien de départ", responsible: "RH", dueDate: "2024-02-27", status: "pending", category: "rh" }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rh': return <User className="h-4 w-4" />;
      case 'it': return <Building2 className="h-4 w-4" />;
      case 'manager': return <User className="h-4 w-4" />;
      case 'employee': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Onboarding & Offboarding</h2>
          <p className="text-muted-foreground">Processus d'intégration et de départ des employés</p>
        </div>
        <div className="flex gap-2">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Nouveau processus
          </Button>
        </div>
      </div>

      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="onboarding" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Onboarding
          </TabsTrigger>
          <TabsTrigger value="offboarding" className="flex items-center gap-2">
            <UserMinus className="h-4 w-4" />
            Offboarding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="onboarding" className="space-y-4">
          <div className="grid gap-4">
            {mockOnboardingProcesses.map((process) => (
              <Card key={process.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{process.employeeName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {process.position} • {process.department}
                      </p>
                    </div>
                    <Badge className={getStatusColor(process.status)}>
                      {process.status === 'in-progress' && <Clock className="h-3 w-3 mr-1" />}
                      {process.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {process.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {process.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Début: {process.startDate}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progression</span>
                      <span className="text-sm text-muted-foreground">{process.progress}%</span>
                    </div>
                    <Progress value={process.progress} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Tâches en cours</h4>
                    {process.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(task.category)}
                          <div>
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Responsable: {task.responsible} • Échéance: {task.dueDate}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="offboarding" className="space-y-4">
          <div className="grid gap-4">
            {mockOffboardingProcesses.map((process) => (
              <Card key={process.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{process.employeeName}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {process.position} • {process.department}
                      </p>
                    </div>
                    <Badge className={getStatusColor(process.status)}>
                      {process.status === 'in-progress' && <Clock className="h-3 w-3 mr-1" />}
                      {process.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {process.status === 'scheduled' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {process.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Dernier jour: {process.lastWorkDay}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progression</span>
                      <span className="text-sm text-muted-foreground">{process.progress}%</span>
                    </div>
                    <Progress value={process.progress} className="h-2" />
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Tâches à compléter</h4>
                    {process.tasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(task.category)}
                          <div>
                            <p className="font-medium text-sm">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Responsable: {task.responsible} • Échéance: {task.dueDate}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};