import { useState, useEffect, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { LandscapeWrapper } from '@/components/layout/LandscapeWrapper';
import { BrandedLoadingScreen } from '@/components/layout/BrandedLoadingScreen';
// 🎨 Utilisation des vues ORIGINALES avec design complet + performance Enterprise
import { TaskTableWithOnboarding } from '@/components/onboarding/TaskTableWithOnboarding';

// 🚀 OPTIMISATION BUNDLE - Lazy loading vues lourdes
const KanbanBoard = lazy(() => import('@/components/vues/kanban/KanbanBoard'));
const GanttChart = lazy(() => import('@/components/vues/gantt/GanttChart'));

// Composant de chargement professionnel
const ViewLoading = () => <BrandedLoadingScreen appName="Wadashaqayn" logoSrc="/logo-w.svg" />;

// import { HRDashboard } from "@/components/hr/HRDashboard"; // Temporarily commented out

const Index = () => {
  const [activeTab, setActiveTab] = useState('table');
  const isMobile = useIsMobile();

  // Force landscape orientation on mobile for better table viewing
  useEffect(() => {
    if (isMobile && 'screen' in window && 'orientation' in window.screen) {
      // Add landscape lock hint for mobile devices
      const meta = document.querySelector('meta[name="viewport"]');
      if (meta) {
        meta.setAttribute(
          'content',
          'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
        );
      }
    }
  }, [isMobile]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex h-full w-full flex-col overflow-hidden"
      >
        <TabsList
          className={`modern-card glow-primary from-primary/10 via-accent/10 to-tech-purple/10 grid w-full flex-shrink-0 border bg-gradient-to-r ${isMobile ? 'grid-cols-3 gap-0 p-0' : 'grid-cols-3 gap-2 p-2'}`}
        >
          <TabsTrigger
            value="gantt"
            className={`transition-smooth hover-glow data-[state=active]:from-primary data-[state=active]:to-accent font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:text-white ${isMobile ? 'min-h-[28px] py-1 text-xs' : 'text-sm'}`}
          >
            {isMobile ? 'Gantt' : 'Diagramme de Gantt'}
          </TabsTrigger>
          <TabsTrigger
            value="kanban"
            className={`transition-smooth hover-glow data-[state=active]:from-accent data-[state=active]:to-tech-purple font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:text-white ${isMobile ? 'min-h-[28px] py-1 text-xs' : 'text-sm'}`}
          >
            Kanban
          </TabsTrigger>
          <TabsTrigger
            value="table"
            className={`transition-smooth hover-glow data-[state=active]:from-tech-purple data-[state=active]:to-primary font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:text-white ${isMobile ? 'min-h-[28px] py-1 text-xs' : 'text-sm'}`}
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
        <TabsContent
          value="table"
          className="m-0 h-0 flex-1 overflow-hidden data-[state=active]:flex"
        >
          <LandscapeWrapper
            viewType="table"
            forceOnTablet={true}
            customMessage="Pour profiter pleinement du tableau, veuillez tourner votre appareil en mode paysage"
          >
            <div className="h-full w-full">
              <TaskTableWithOnboarding />
            </div>
          </LandscapeWrapper>
        </TabsContent>

        {/* Kanban content - Full width */}
        <TabsContent
          value="kanban"
          className="m-0 h-0 flex-1 overflow-hidden data-[state=active]:flex"
        >
          <LandscapeWrapper
            viewType="kanban"
            forceOnTablet={true}
            customMessage="Le tableau Kanban offre une meilleure expérience en mode paysage"
          >
            <div className="modern-card transition-smooth hover-glow h-full w-full overflow-auto rounded-xl">
              <Suspense fallback={<ViewLoading />}>
                <KanbanBoard />
              </Suspense>
            </div>
          </LandscapeWrapper>
        </TabsContent>

        {/* Gantt content - Full width */}
        <TabsContent
          value="gantt"
          className="m-0 h-0 flex-1 overflow-hidden data-[state=active]:flex"
        >
          <LandscapeWrapper
            viewType="gantt"
            forceOnTablet={true}
            customMessage="Le diagramme de Gantt offre une meilleure expérience en mode paysage"
          >
            <div className="modern-card transition-smooth hover-glow h-full w-full overflow-auto rounded-xl">
              <Suspense fallback={<ViewLoading />}>
                <GanttChart />
              </Suspense>
            </div>
          </LandscapeWrapper>
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
