import GanttChart from "../components/GanttChart";

const Index = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Gantt Chart SaaS</h1>
          <p className="text-muted-foreground">Gestion de projets moderne avec diagramme de Gantt interactif</p>
        </div>
        <GanttChart />
      </div>
    </div>
  );
};

export default Index;
