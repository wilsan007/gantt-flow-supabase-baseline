import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GanttChart from "../components/GanttChart";
import DynamicTable from "../components/DynamicTable";

const Index = () => {
  const [activeTab, setActiveTab] = useState("gantt");

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Gestion de Projets SaaS</h1>
          <p className="text-muted-foreground">Diagramme de Gantt et tableau dynamique d'exécution des tâches</p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gantt">Diagramme de Gantt</TabsTrigger>
            <TabsTrigger value="table">Tableau Dynamique</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gantt" className="mt-6">
            <GanttChart />
          </TabsContent>
          
          <TabsContent value="table" className="mt-6">
            <DynamicTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
