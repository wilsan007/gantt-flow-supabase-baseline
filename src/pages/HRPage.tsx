import { useState, lazy, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Building,
  TrendingUp,
  BookOpen,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useIsMobile } from '@/hooks/use-mobile';
import { ResponsiveLayout } from '@/components/responsive/ResponsiveLayout';

// 🚀 OPTIMISATION BUNDLE - Lazy loading des composants HR lourds
const HRDashboard = lazy(() =>
  import('@/components/hr/HRDashboardMinimal').then(m => ({ default: m.HRDashboardMinimal }))
);
const LeaveManagement = lazy(() =>
  import('@/components/hr/LeaveManagement').then(m => ({ default: m.LeaveManagement }))
);
const AttendanceManagement = lazy(() =>
  import('@/components/hr/AttendanceManagement').then(m => ({ default: m.AttendanceManagement }))
);
const EnhancedEmployeeManagement = lazy(() =>
  import('@/components/hr/EnhancedEmployeeManagement').then(m => ({
    default: m.EnhancedEmployeeManagement,
  }))
);
const AbsenceTypeManagement = lazy(() =>
  import('@/components/hr/AbsenceTypeManagement').then(m => ({ default: m.AbsenceTypeManagement }))
);
const LeaveBalanceManagement = lazy(() =>
  import('@/components/hr/LeaveBalanceManagement').then(m => ({
    default: m.LeaveBalanceManagement,
  }))
);
const TimesheetManagement = lazy(() =>
  import('@/components/hr/TimesheetManagement').then(m => ({ default: m.TimesheetManagement }))
);
const DepartmentManagement = lazy(() =>
  import('@/components/hr/DepartmentManagement').then(m => ({ default: m.DepartmentManagement }))
);
const OnboardingOffboarding = lazy(() =>
  import('@/components/hr/OnboardingOffboarding').then(m => ({ default: m.OnboardingOffboarding }))
);
const PerformanceManagement = lazy(() =>
  import('@/components/hr/PerformanceManagement').then(m => ({ default: m.PerformanceManagement }))
);
const SkillsTraining = lazy(() =>
  import('@/components/hr/SkillsTraining').then(m => ({ default: m.SkillsTraining }))
);
const ExpenseManagement = lazy(() =>
  import('@/components/hr/ExpenseManagement').then(m => ({ default: m.ExpenseManagement }))
);
const PayrollManagement = lazy(() =>
  import('@/components/hr/PayrollManagement').then(m => ({ default: m.PayrollManagement }))
);
const HealthSafety = lazy(() =>
  import('@/components/hr/HealthSafety').then(m => ({ default: m.HealthSafety }))
);

// Composant de chargement
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// Helper pour envelopper les composants lazy avec Suspense
const withSuspense = (Component: React.LazyExoticComponent<any>) => {
  return () => (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
};

// Composants enveloppés
const HRDashboardWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <HRDashboard />
  </Suspense>
);
const LeaveManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LeaveManagement />
  </Suspense>
);
const AttendanceManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <AttendanceManagement />
  </Suspense>
);
const EnhancedEmployeeManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <EnhancedEmployeeManagement />
  </Suspense>
);
const AbsenceTypeManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <AbsenceTypeManagement />
  </Suspense>
);
const LeaveBalanceManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <LeaveBalanceManagement />
  </Suspense>
);
const TimesheetManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <TimesheetManagement />
  </Suspense>
);
const DepartmentManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <DepartmentManagement />
  </Suspense>
);
const OnboardingOffboardingWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <OnboardingOffboarding />
  </Suspense>
);
const PerformanceManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <PerformanceManagement />
  </Suspense>
);
const SkillsTrainingWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <SkillsTraining />
  </Suspense>
);
const ExpenseManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <ExpenseManagement />
  </Suspense>
);
const PayrollManagementWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <PayrollManagement />
  </Suspense>
);
const HealthSafetyWithSuspense = () => (
  <Suspense fallback={<LoadingFallback />}>
    <HealthSafety />
  </Suspense>
);

const HRPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState({
    employees: 'management',
    operations: 'onboarding',
    development: 'skills',
    leaves: 'requests',
    time: 'attendance',
  });
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <ResponsiveLayout>
      {/* Header avec navigation retour - Ultra compact mobile */}
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 md:mb-8 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="hover-glow h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only sm:ml-2">Retour</span>
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate bg-gradient-to-r from-primary via-accent to-tech-purple bg-clip-text text-xl font-bold text-transparent drop-shadow-sm sm:text-2xl md:text-4xl">
              <span className="hidden sm:inline">Gestion des Ressources Humaines</span>
              <span className="sm:hidden">RH</span>
            </h1>
            <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground sm:text-sm md:text-lg">
              <span className="hidden sm:inline">Module complet de gestion RH</span>
              <span className="sm:hidden">Gestion RH</span>
            </p>
          </div>
        </div>
        <div className="self-end sm:self-auto">
          <ThemeToggle />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Tabs principales - Scroll horizontal mobile */}
        <div className="-mx-4 sm:mx-0">
          <TabsList className="modern-card glow-primary flex w-full gap-1 overflow-x-auto border-2 bg-gradient-to-r from-primary/10 via-accent/10 to-tech-purple/10 p-2 sm:grid sm:grid-cols-6 sm:gap-2 sm:p-3 md:mb-8">
            <TabsTrigger
              value="dashboard"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap px-3 sm:px-4"
            >
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="personnel"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap px-3 sm:px-4"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Personnel</span>
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap px-3 sm:px-4"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Performance</span>
            </TabsTrigger>
            <TabsTrigger
              value="operations"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap px-3 sm:px-4"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Opérations</span>
            </TabsTrigger>
            <TabsTrigger
              value="development"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap px-3 sm:px-4"
            >
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Développement</span>
            </TabsTrigger>
            <TabsTrigger
              value="safety"
              className="flex shrink-0 items-center gap-2 whitespace-nowrap px-3 sm:px-4"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="mt-4 sm:mt-6">
          <div className="modern-card transition-smooth hover-glow rounded-xl">
            <HRDashboardWithSuspense />
          </div>
        </TabsContent>

        <TabsContent value="personnel" className="mt-4 sm:mt-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex gap-2">
              <Button
                variant={activeSubTab.employees === 'management' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, employees: 'management' }))}
                className="h-10 flex-1 text-xs sm:h-auto sm:text-sm"
              >
                <Users className="mr-1.5 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Gestion </span>Employés
              </Button>
              <Button
                variant={activeSubTab.employees === 'departments' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, employees: 'departments' }))}
                className="h-10 flex-1 text-xs sm:h-auto sm:text-sm"
              >
                <Building className="mr-1.5 h-4 w-4 sm:mr-2" />
                Départ.
              </Button>
            </div>

            <div className="modern-card transition-smooth hover-glow rounded-xl">
              {activeSubTab.employees === 'management' && (
                <EnhancedEmployeeManagementWithSuspense />
              )}
              {activeSubTab.employees === 'departments' && <DepartmentManagementWithSuspense />}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="mt-4 sm:mt-6">
          <div className="modern-card transition-smooth hover-glow rounded-xl">
            <PerformanceManagementWithSuspense />
          </div>
        </TabsContent>

        <TabsContent value="operations" className="mt-4 sm:mt-6">
          <div className="space-y-4 sm:space-y-6">
            {/* Sous-tabs opérations - Grid responsive */}
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button
                variant={activeSubTab.operations === 'onboarding' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, operations: 'onboarding' }))}
                className="h-10 justify-start text-xs sm:min-w-32 sm:flex-1 sm:justify-center sm:text-sm"
              >
                <Users className="mr-1.5 h-4 w-4" />
                <span className="truncate">Onboarding</span>
              </Button>
              <Button
                variant={activeSubTab.operations === 'leaves' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, operations: 'leaves' }))}
                className="h-10 justify-start text-xs sm:min-w-32 sm:flex-1 sm:justify-center sm:text-sm"
              >
                <Calendar className="mr-1.5 h-4 w-4" />
                <span className="truncate">Congés</span>
              </Button>
              <Button
                variant={activeSubTab.operations === 'time' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, operations: 'time' }))}
                className="h-10 justify-start text-xs sm:min-w-32 sm:flex-1 sm:justify-center sm:text-sm"
              >
                <Clock className="mr-1.5 h-4 w-4" />
                <span className="truncate">Temps</span>
              </Button>
              <Button
                variant={activeSubTab.operations === 'expenses' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, operations: 'expenses' }))}
                className="h-10 justify-start text-xs sm:min-w-32 sm:flex-1 sm:justify-center sm:text-sm"
              >
                <Building className="mr-1.5 h-4 w-4" />
                <span className="truncate">Frais</span>
              </Button>
              <Button
                variant={activeSubTab.operations === 'payroll' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, operations: 'payroll' }))}
                className="h-10 justify-start text-xs sm:min-w-32 sm:flex-1 sm:justify-center sm:text-sm"
              >
                <TrendingUp className="mr-1.5 h-4 w-4" />
                <span className="truncate">Paie</span>
              </Button>
            </div>

            <div className="modern-card transition-smooth hover-glow rounded-xl">
              {activeSubTab.operations === 'onboarding' && <OnboardingOffboardingWithSuspense />}
              {activeSubTab.operations === 'leaves' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={activeSubTab.leaves === 'requests' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab(prev => ({ ...prev, leaves: 'requests' }))}
                      className="h-10 flex-1 text-xs sm:min-w-32 sm:text-sm"
                    >
                      <Calendar className="mr-1.5 h-4 w-4" />
                      Demandes
                    </Button>
                    <Button
                      variant={activeSubTab.leaves === 'balances' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab(prev => ({ ...prev, leaves: 'balances' }))}
                      className="h-10 flex-1 text-xs sm:min-w-32 sm:text-sm"
                    >
                      <Clock className="mr-1.5 h-4 w-4" />
                      Soldes
                    </Button>
                    <Button
                      variant={activeSubTab.leaves === 'types' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab(prev => ({ ...prev, leaves: 'types' }))}
                      className="h-10 flex-1 text-xs sm:min-w-32 sm:text-sm"
                    >
                      <Building className="mr-1.5 h-4 w-4" />
                      Types
                    </Button>
                  </div>
                  <div>
                    {activeSubTab.leaves === 'requests' && <LeaveManagementWithSuspense />}
                    {activeSubTab.leaves === 'balances' && <LeaveBalanceManagementWithSuspense />}
                    {activeSubTab.leaves === 'types' && <AbsenceTypeManagementWithSuspense />}
                  </div>
                </div>
              )}
              {activeSubTab.operations === 'time' && (
                <div className="space-y-6">
                  <div className="flex gap-2">
                    <Button
                      variant={activeSubTab.time === 'attendance' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab(prev => ({ ...prev, time: 'attendance' }))}
                      className="h-10 flex-1 text-xs sm:text-sm"
                    >
                      <Clock className="mr-1.5 h-4 w-4" />
                      Présences
                    </Button>
                    <Button
                      variant={activeSubTab.time === 'timesheets' ? 'default' : 'outline'}
                      onClick={() => setActiveSubTab(prev => ({ ...prev, time: 'timesheets' }))}
                      className="h-10 flex-1 text-xs sm:text-sm"
                    >
                      <Calendar className="mr-1.5 h-4 w-4" />
                      <span className="hidden sm:inline">Feuilles de temps</span>
                      <span className="sm:hidden">Temps</span>
                    </Button>
                  </div>
                  <div>
                    {activeSubTab.time === 'attendance' && <AttendanceManagementWithSuspense />}
                    {activeSubTab.time === 'timesheets' && <TimesheetManagementWithSuspense />}
                  </div>
                </div>
              )}
              {activeSubTab.operations === 'expenses' && <ExpenseManagementWithSuspense />}
              {activeSubTab.operations === 'payroll' && <PayrollManagementWithSuspense />}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="development" className="mt-4 sm:mt-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="flex gap-2">
              <Button
                variant={activeSubTab.development === 'skills' ? 'default' : 'outline'}
                onClick={() => setActiveSubTab(prev => ({ ...prev, development: 'skills' }))}
                className="h-10 flex-1 text-xs sm:h-auto sm:text-sm"
              >
                <TrendingUp className="mr-1.5 h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Compétences & </span>Formation
              </Button>
            </div>

            <div className="modern-card transition-smooth hover-glow rounded-xl">
              {activeSubTab.development === 'skills' && <SkillsTrainingWithSuspense />}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="safety" className="mt-4 sm:mt-6">
          <div className="modern-card transition-smooth hover-glow rounded-xl">
            <HealthSafetyWithSuspense />
          </div>
        </TabsContent>
      </Tabs>
    </ResponsiveLayout>
  );
};

export default HRPage;
