import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveLayout } from "@/components/responsive/ResponsiveLayout";
import { HRDashboard } from "@/components/hr/HRDashboard";
import { LeaveManagement } from "@/components/hr/LeaveManagement";
import { AttendanceManagement } from "@/components/hr/AttendanceManagement";
import { EmployeeManagement } from "@/components/hr/EmployeeManagement";

const HRPage = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
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
        <TabsList className={`grid w-full modern-card glow-primary bg-gradient-to-r from-primary/10 via-accent/10 to-tech-purple/10 border-2 ${isMobile ? 'grid-cols-2 gap-1 p-1 mb-4' : 'grid-cols-4 p-2 mb-8'}`}>
          <TabsTrigger 
            value="dashboard" 
            className={`transition-smooth hover-glow data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white font-semibold ${isMobile ? 'text-xs py-2' : ''}`}
          >
            {isMobile ? 'Tableau' : 'Tableau de bord'}
          </TabsTrigger>
          <TabsTrigger 
            value="employees" 
            className={`transition-smooth hover-glow data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-tech-purple data-[state=active]:text-white font-semibold ${isMobile ? 'text-xs py-2' : ''}`}
          >
            {isMobile ? 'Employés' : 'Gestion Employés'}
          </TabsTrigger>
          <TabsTrigger 
            value="leaves" 
            className={`transition-smooth hover-glow data-[state=active]:bg-gradient-to-r data-[state=active]:from-tech-purple data-[state=active]:to-primary data-[state=active]:text-white font-semibold ${isMobile ? 'text-xs py-2' : ''}`}
          >
            {isMobile ? 'Congés' : 'Gestion Congés'}
          </TabsTrigger>
          <TabsTrigger 
            value="attendance" 
            className={`transition-smooth hover-glow data-[state=active]:bg-gradient-to-r data-[state=active]:from-tech-green data-[state=active]:to-accent data-[state=active]:text-white font-semibold ${isMobile ? 'text-xs py-2' : ''}`}
          >
            {isMobile ? 'Présence' : 'Présences'}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className={isMobile ? 'mt-2' : 'mt-6'}>
          <div className="modern-card rounded-xl transition-smooth hover-glow">
            <HRDashboard />
          </div>
        </TabsContent>
        
        <TabsContent value="employees" className={isMobile ? 'mt-2' : 'mt-6'}>
          <div className="modern-card rounded-xl transition-smooth hover-glow">
            <EmployeeManagement />
          </div>
        </TabsContent>
        
        <TabsContent value="leaves" className={isMobile ? 'mt-2' : 'mt-6'}>
          <div className="modern-card rounded-xl transition-smooth hover-glow">
            <LeaveManagement />
          </div>
        </TabsContent>
        
        <TabsContent value="attendance" className={isMobile ? 'mt-2' : 'mt-6'}>
          <div className="modern-card rounded-xl transition-smooth hover-glow">
            <AttendanceManagement />
          </div>
        </TabsContent>
      </Tabs>
    </ResponsiveLayout>
  );
};

export default HRPage;