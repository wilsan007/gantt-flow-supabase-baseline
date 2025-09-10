import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResponsiveLayout } from "@/components/responsive/ResponsiveLayout";
import GanttChart from "../components/GanttChart";
import DynamicTable from "../components/DynamicTable";
import KanbanBoard from "../components/KanbanBoard";
// import { HRDashboard } from "@/components/hr/HRDashboard"; // Temporarily commented out

const Index = () => {
  const [activeTab, setActiveTab] = useState("gantt");
  const isMobile = useIsMobile();

  return (
    <ResponsiveLayout>
        {/* Header avec bouton de thème - responsive */}
        <div className={`flex justify-between items-start mb-6 ${isMobile ? 'mb-4' : 'mb-8'}`}>
          <div className="flex-1 text-center">
            <h1 className={`font-bold bg-gradient-to-r from-primary via-accent to-tech-purple bg-clip-text text-transparent mb-4 drop-shadow-sm ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
              Gestion de Projets SaaS
            </h1>
            <p className={`text-muted-foreground font-medium ${isMobile ? 'text-sm' : 'text-lg'}`}>
              Diagramme de Gantt et tableau dynamique d'exécution des tâches
            </p>
            <div className={`bg-gradient-to-r from-primary via-accent to-tech-purple mx-auto mt-4 rounded-full shadow-lg ${isMobile ? 'w-16 h-1' : 'w-24 h-2'}`}></div>
          </div>
          <div className={isMobile ? 'ml-2' : 'ml-4'}>
            <ThemeToggle />
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={`grid w-full modern-card glow-primary bg-gradient-to-r from-primary/10 via-accent/10 to-tech-purple/10 border-2 ${isMobile ? 'grid-cols-1 gap-1 p-1 mb-4' : 'grid-cols-3 p-2 mb-8'}`}>
            <TabsTrigger 
              value="gantt" 
              className={`transition-smooth hover-glow data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white font-semibold ${isMobile ? 'text-sm py-2' : ''}`}
            >
              {isMobile ? 'Gantt' : 'Diagramme de Gantt'}
            </TabsTrigger>
            <TabsTrigger 
              value="kanban" 
              className={`transition-smooth hover-glow data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-tech-purple data-[state=active]:text-white font-semibold ${isMobile ? 'text-sm py-2' : ''}`}
            >
              Kanban
            </TabsTrigger>
            <TabsTrigger 
              value="table" 
              className={`transition-smooth hover-glow data-[state=active]:bg-gradient-to-r data-[state=active]:from-tech-purple data-[state=active]:to-primary data-[state=active]:text-white font-semibold ${isMobile ? 'text-sm py-2' : ''}`}
            >
              {isMobile ? 'Tableau' : 'Tableau Dynamique'}
            </TabsTrigger>
            {/* Temporarily commented out HR tab
            <TabsTrigger 
              value="hr" 
              className={`transition-smooth hover-glow data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-accent data-[state=active]:text-white font-semibold ${isMobile ? 'text-sm py-2' : ''}`}
            >
              RH
            </TabsTrigger>
            */}
          </TabsList>
          
          <TabsContent value="gantt" className={isMobile ? 'mt-2' : 'mt-6'}>
            <div className="modern-card rounded-xl transition-smooth hover-glow">
              <GanttChart />
            </div>
          </TabsContent>
          
          <TabsContent value="kanban" className={isMobile ? 'mt-2' : 'mt-6'}>
            <div className="modern-card rounded-xl transition-smooth hover-glow">
              <KanbanBoard />
            </div>
          </TabsContent>
          
          <TabsContent value="table" className={isMobile ? 'mt-2' : 'mt-6'}>
            <div className="modern-card rounded-xl transition-smooth hover-glow">
              <DynamicTable />
            </div>
          </TabsContent>
          
          {/* Temporarily commented out HR content
          <TabsContent value="hr" className={isMobile ? 'mt-2' : 'mt-6'}>
            <div className="modern-card rounded-xl transition-smooth hover-glow">
              <HRDashboard />
            </div>
          </TabsContent>
          */}
        </Tabs>
    </ResponsiveLayout>
  );
};

export default Index;
