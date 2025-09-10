import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Calendar, Clock, Building } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveLayout } from "@/components/responsive/ResponsiveLayout";
import { HRDashboard } from "@/components/hr/HRDashboard";
import { LeaveManagement } from "@/components/hr/LeaveManagement";
import { AttendanceManagement } from "@/components/hr/AttendanceManagement";
import { EnhancedEmployeeManagement } from "@/components/hr/EnhancedEmployeeManagement";
import { AbsenceTypeManagement } from "@/components/hr/AbsenceTypeManagement";
import { LeaveBalanceManagement } from "@/components/hr/LeaveBalanceManagement";
import { TimesheetManagement } from "@/components/hr/TimesheetManagement";
import { DepartmentManagement } from "@/components/hr/DepartmentManagement";

const HRPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [activeSubTab, setActiveSubTab] = useState({
    employees: "management",
    leaves: "requests",
    time: "attendance"
  });
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <ResponsiveLayout>
      {/* Header avec navigation retour */}
      <div className={`flex justify-between items-start mb-6 ${isMobile ? 'mb-4' : 'mb-8'}`}>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size={isMobile ? "sm" : "default"}
            onClick={() => navigate("/")}
            className="hover-glow"
          >
            <ArrowLeft className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
            {!isMobile && "Retour"}
          </Button>
          <div className="flex-1">
            <h1 className={`font-bold bg-gradient-to-r from-primary via-accent to-tech-purple bg-clip-text text-transparent drop-shadow-sm ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
              Gestion des Ressources Humaines
            </h1>
            <p className={`text-muted-foreground font-medium ${isMobile ? 'text-sm' : 'text-lg'}`}>
              Module complet de gestion RH
            </p>
          </div>
        </div>
        <div className={isMobile ? 'ml-2' : 'ml-4'}>
          <ThemeToggle />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full modern-card glow-primary bg-gradient-to-r from-primary/10 via-accent/10 to-tech-purple/10 border-2 ${isMobile ? 'grid-cols-3 gap-2 p-2 mb-4' : 'grid-cols-6 gap-2 p-3 mb-8'}`}>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            {!isMobile && 'Dashboard'}
          </TabsTrigger>
          <TabsTrigger value="personnel" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {!isMobile && 'Personnel'}
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {!isMobile && 'Performance'}
          </TabsTrigger>
          <TabsTrigger value="operations" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {!isMobile && 'Opérations'}
          </TabsTrigger>
          <TabsTrigger value="development" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {!isMobile && 'Développement'}
          </TabsTrigger>
          <TabsTrigger value="safety" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {!isMobile && 'Sécurité'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className={isMobile ? 'mt-2' : 'mt-6'}>
          <div className="modern-card rounded-xl transition-smooth hover-glow">
            <HRDashboard />
          </div>
        </TabsContent>
        
        <TabsContent value="personnel" className={isMobile ? 'mt-2' : 'mt-6'}>
          <div className="space-y-6">
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeSubTab.employees === "management" ? "default" : "outline"}
                onClick={() => setActiveSubTab(prev => ({...prev, employees: "management"}))}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                Gestion Employés
              </Button>
              <Button
                variant={activeSubTab.employees === "departments" ? "default" : "outline"}
                onClick={() => setActiveSubTab(prev => ({...prev, employees: "departments"}))}
                className="flex-1"
              >
                <Building className="h-4 w-4 mr-2" />
                Départements
              </Button>
            </div>
            
            <div className="modern-card rounded-xl transition-smooth hover-glow">
              {activeSubTab.employees === "management" && <EnhancedEmployeeManagement />}
              {activeSubTab.employees === "departments" && <DepartmentManagement />}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="leaves" className={isMobile ? 'mt-2' : 'mt-6'}>
          <div className="space-y-6">
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button
                variant={activeSubTab.leaves === "requests" ? "default" : "outline"}
                onClick={() => setActiveSubTab(prev => ({...prev, leaves: "requests"}))}
                className="flex-1 min-w-32"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Demandes
              </Button>
              <Button
                variant={activeSubTab.leaves === "balances" ? "default" : "outline"}
                onClick={() => setActiveSubTab(prev => ({...prev, leaves: "balances"}))}
                className="flex-1 min-w-32"
              >
                <Clock className="h-4 w-4 mr-2" />
                Soldes
              </Button>
              <Button
                variant={activeSubTab.leaves === "types" ? "default" : "outline"}
                onClick={() => setActiveSubTab(prev => ({...prev, leaves: "types"}))}
                className="flex-1 min-w-32"
              >
                <Building className="h-4 w-4 mr-2" />
                Types
              </Button>
            </div>
            
            <div className="modern-card rounded-xl transition-smooth hover-glow">
              {activeSubTab.leaves === "requests" && <LeaveManagement />}
              {activeSubTab.leaves === "balances" && <LeaveBalanceManagement />}
              {activeSubTab.leaves === "types" && <AbsenceTypeManagement />}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="time" className={isMobile ? 'mt-2' : 'mt-6'}>
          <div className="space-y-6">
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeSubTab.time === "attendance" ? "default" : "outline"}
                onClick={() => setActiveSubTab(prev => ({...prev, time: "attendance"}))}
                className="flex-1"
              >
                <Clock className="h-4 w-4 mr-2" />
                Présences
              </Button>
              <Button
                variant={activeSubTab.time === "timesheets" ? "default" : "outline"}
                onClick={() => setActiveSubTab(prev => ({...prev, time: "timesheets"}))}
                className="flex-1"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Feuilles de temps
              </Button>
            </div>
            
            <div className="modern-card rounded-xl transition-smooth hover-glow">
              {activeSubTab.time === "attendance" && <AttendanceManagement />}
              {activeSubTab.time === "timesheets" && <TimesheetManagement />}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </ResponsiveLayout>
  );
};

export default HRPage;