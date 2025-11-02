import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
// 🎨 Utilisation des vues ORIGINALES avec design complet + performance Enterprise
import DynamicTable from "@/components/vues/table/DynamicTable";
import KanbanBoard from "@/components/vues/kanban/KanbanBoard";
import GanttChart from "@/components/vues/gantt/GanttChart";
// import { HRDashboard } from "@/components/hr/HRDashboard"; // Temporarily commented out

const Index = () => {
  const [activeTab, setActiveTab] = useState("table");
  const isMobile = useIsMobile();

  // Force landscape orientation on mobile for better table viewing
  useEffect(() => {
    if (isMobile && 'screen' in window && 'orientation' in window.screen) {
      // Add landscape lock hint for mobile devices
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta) {
        meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
      }
    }
  }, [isMobile]);

  return (
    <div className="h-full w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full w-full flex flex-col">
          <TabsList className={`grid w-full modern-card glow-primary bg-gradient-to-r from-primary/10 via-accent/10 to-tech-purple/10 border-2 ${isMobile ? 'grid-cols-3 gap-1 p-1' : 'grid-cols-3 p-2'}`}>
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
          
          {/* Table content - Full width with landscape optimization on mobile */}
          <TabsContent value="table" className="mt-0 flex-1 overflow-auto">
            <div className={isMobile ? 'landscape-optimized' : ''}>
              <DynamicTable />
            </div>
          </TabsContent>
          
          {/* Kanban content - Full width */}
          <TabsContent value="kanban" className="mt-0 flex-1 overflow-auto">
            <div className={`modern-card rounded-xl transition-smooth hover-glow ${isMobile ? 'landscape-optimized' : ''}`}>
              <KanbanBoard />
            </div>
          </TabsContent>
          
          {/* Gantt content - Full width */}
          <TabsContent value="gantt" className="mt-0 flex-1 overflow-auto">
            <div className={`modern-card rounded-xl transition-smooth hover-glow ${isMobile ? 'landscape-optimized' : ''}`}>
              <GanttChart />
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
    </div>
  );
};

export default Index;
