import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GanttChart from "../components/GanttChart";
import DynamicTable from "../components/DynamicTable";
import KanbanBoard from "../components/KanbanBoard";

const Index = () => {
  const [activeTab, setActiveTab] = useState("gantt");

  return (
    <div className="min-h-screen p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/20 to-tech-cyan/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-tech-purple/10 to-tech-blue/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Gestion de Projets SaaS
          </h1>
          <p className="text-muted-foreground text-lg">
            Diagramme de Gantt et tableau dynamique d'exécution des tâches
          </p>
          <div className="w-20 h-1 bg-gradient-to-r from-primary to-accent mx-auto mt-4 rounded-full"></div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 modern-card p-1 mb-8 glow-primary">
            <TabsTrigger value="gantt" className="transition-smooth hover-glow">
              Diagramme de Gantt
            </TabsTrigger>
            <TabsTrigger value="kanban" className="transition-smooth hover-glow">
              Kanban
            </TabsTrigger>
            <TabsTrigger value="table" className="transition-smooth hover-glow">
              Tableau Dynamique
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="gantt" className="mt-6">
            <div className="modern-card rounded-xl transition-smooth hover-glow">
              <GanttChart />
            </div>
          </TabsContent>
          
          <TabsContent value="kanban" className="mt-6">
            <div className="modern-card rounded-xl transition-smooth hover-glow">
              <KanbanBoard />
            </div>
          </TabsContent>
          
          <TabsContent value="table" className="mt-6">
            <div className="modern-card rounded-xl transition-smooth hover-glow">
              <DynamicTable />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
