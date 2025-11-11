import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import '@/styles/landscape-optimization.css';
import '@/styles/sidebar-overlay.css';
import { useRef, useMemo, memo, useCallback, useState, lazy, Suspense } from 'react';
import { useStableCallback } from '@/hooks/useStableCallback';
// import { usePerformanceOptimizer, useRenderOptimizer } from "@/hooks/usePerformanceOptimizer";
import { Auth } from '@/components/Auth';
import { ThemeProvider } from 'next-themes';
import { AppLayoutWithSidebar } from '@/components/layout/AppLayoutWithSidebar';
import { SessionErrorBoundary } from '@/components/SessionErrorBoundary';
import { TenantProvider } from './contexts/TenantContext';
import { ViewModeProvider } from './contexts/ViewModeContext';
import { RolesProvider } from './contexts/RolesContext';
import { AuthProvider } from './contexts/AuthContext';
// Pages chargées immédiatement (critiques)
import Index from './pages/Index';

// Lazy loading des pages (optimisation performance)
const HRPage = lazy(() => import('./pages/HRPage'));
const HRPageWithCollaboratorInvitation = lazy(
  () => import('./pages/HRPageWithCollaboratorInvitation')
);
const MyExpensesPage = lazy(() => import('./pages/MyExpensesPage'));
const MyTimesheetsPage = lazy(() => import('./pages/MyTimesheetsPage'));
const MyAbsencesPage = lazy(() => import('./pages/MyAbsencesPage'));
const MyRemoteWorkPage = lazy(() => import('./pages/MyRemoteWorkPage'));
const MyAdminRequestsPage = lazy(() => import('./pages/MyAdminRequestsPage'));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage'));
const MySkillsPage = lazy(() => import('./pages/MySkillsPage'));
const TrainingCatalogPage = lazy(() => import('./pages/TrainingCatalogPage'));
const MyTrainingsPage = lazy(() => import('./pages/MyTrainingsPage'));
const ProjectPage = lazy(() => import('./pages/ProjectPage'));
const TaskManagementPage = lazy(() => import('./pages/TaskManagementPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const SuperAdminPage = lazy(() => import('./pages/SuperAdminPage'));
const TenantOwnerSignup = lazy(() => import('./pages/TenantOwnerSignup'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const SetupAccount = lazy(() => import('./pages/SetupAccount'));
const InvitePage = lazy(() => import('./pages/InvitePage'));
const NotFound = lazy(() => import('./pages/NotFound'));
// Pages nouvellement routées
const Analytics = lazy(() => import('./pages/Analytics'));
const Settings = lazy(() => import('./pages/Settings'));
const Inbox = lazy(() => import('./pages/Inbox'));
const OperationsPage = lazy(() =>
  import('./components/operations').then(m => ({ default: m.OperationsPage }))
);
const PerformanceMonitor = lazy(() => import('./components/dev/PerformanceMonitor'));

import { useUserRoles } from '@/hooks/useUserRoles';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
// import { useRenderTracker } from "@/hooks/usePerformanceMonitor";
import { cacheManager } from '@/lib/cacheManager';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RoleIndicator } from '@/components/auth/RoleIndicator';

const queryClient = new QueryClient();

// Loading component pour Suspense
const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
  </div>
);

// Composant Routes memoizé pour éviter les re-renders
const MemoizedRoutes = memo(() => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute requiredAccess="canAccessTasks">
            <Index />
          </ProtectedRoute>
        }
      />

      {/* Route dashboard - redirige vers la page d'accueil */}
      <Route path="/dashboard" element={<Navigate to="/" replace />} />

      {/* Routes protégées avec système de permissions réactivé */}
      <Route
        path="/hr"
        element={
          <ProtectedRoute requiredAccess="canAccessHR">
            <HRPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invite-collaborators"
        element={
          <ProtectedRoute requiredAccess="canAccessHR">
            <HRPageWithCollaboratorInvitation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-expenses"
        element={
          <ProtectedRoute requiredAccess="canAccessHR">
            <MyExpensesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-timesheets"
        element={
          <ProtectedRoute requiredAccess="canAccessHR">
            <MyTimesheetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-absences"
        element={
          <ProtectedRoute requiredAccess="canAccessHR">
            <MyAbsencesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-remote-work"
        element={
          <ProtectedRoute requiredAccess="canAccessHR">
            <MyRemoteWorkPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-admin-requests"
        element={
          <ProtectedRoute requiredAccess="canAccessHR">
            <MyAdminRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute requiredAccess="canAccessHR">
            <ApprovalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-skills"
        element={
          <ProtectedRoute requiredAccess="canAccessHR">
            <MySkillsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/training-catalog"
        element={
          <ProtectedRoute requiredAccess="canAccessHR">
            <TrainingCatalogPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-trainings"
        element={
          <ProtectedRoute requiredAccess="canAccessHR">
            <MyTrainingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute requiredAccess="canAccessProjects">
            <ProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute requiredAccess="canAccessTasks">
            <TaskManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendar"
        element={
          <ProtectedRoute requiredAccess="canAccessTasks">
            <CalendarPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operations"
        element={
          <ProtectedRoute requiredAccess="canAccessTasks">
            <OperationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute requiredAccess="canAccessSuperAdmin">
            <SuperAdminPage />
          </ProtectedRoute>
        }
      />

      {/* Routes utilisateur */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute requiredAccess="canAccessTasks">
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredAccess="canAccessTasks">
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inbox"
        element={
          <ProtectedRoute requiredAccess="canAccessTasks">
            <Inbox />
          </ProtectedRoute>
        }
      />

      {/* Routes publiques */}
      <Route path="/auth" element={<Auth onAuthStateChange={() => {}} />} />
      <Route path="/signup" element={<TenantOwnerSignup />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/setup" element={<SetupAccount />} />
      <Route path="/invite/:inviteId" element={<InvitePage />} />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
));

MemoizedRoutes.displayName = 'MemoizedRoutes';

function App() {
  // Performance monitoring désactivé temporairement (cause des re-renders)
  // const performanceMonitor = useRenderTracker('App');
  // const renderOptimizer = useRenderOptimizer('App');
  // const performanceOptimizer = usePerformanceOptimizer();

  // Protection STRICTE anti-re-renders avec state stable
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(0);
  const stableStateRef = useRef<{
    session: any;
    loading: boolean;
    accessLoading: boolean;
    accessRights: any;
  } | null>(null);

  // Hooks avec protection anti-boucle renforcée
  const { session, loading, signOut, handleAuthStateChange } = useSessionManager();
  // Note: useUserRoles sera appelé UNE SEULE FOIS dans RolesProvider
  // Ici on garde juste pour la logique initiale (sera retiré progressivement)
  const {
    isSuperAdmin: checkIsSuperAdmin,
    isTenantAdmin: checkIsTenantAdmin,
    isLoading: superAdminLoading,
  } = useUserRoles();
  const isSuperAdmin = checkIsSuperAdmin();
  const isTenantAdmin = checkIsTenantAdmin();
  const { accessRights, isLoading: accessLoading } = useRoleBasedAccess();

  // Détection des changements d'état pour éviter les re-renders inutiles
  const currentState = {
    session: !!session,
    loading,
    accessLoading,
    accessRights: JSON.stringify(accessRights),
  };

  const lastState = stableStateRef.current;
  const stateChanged =
    !lastState ||
    lastState.session !== currentState.session ||
    lastState.loading !== currentState.loading ||
    lastState.accessLoading !== currentState.accessLoading ||
    lastState.accessRights !== currentState.accessRights;

  // Mettre à jour l'état stable seulement si changement
  if (stateChanged) {
    stableStateRef.current = {
      session,
      loading,
      accessLoading,
      accessRights,
    };
  }

  // Timer réactivé avec configuration memoizée (protection anti-boucle)
  const timerConfig = useMemo(
    () => ({
      totalTimeoutMinutes: 15,
      warningMinutes: 5,
      enabled: !!session && !loading, // Activer seulement si connecté et chargé
    }),
    [!!session, loading]
  ); // Dépendances minimales et stables

  const { showWarning, timeLeftFormatted, isActive: timerActive } = useInactivityTimer(timerConfig);

  // Callbacks STABLES pour éviter les re-renders (Pattern Stripe)
  const handleSignOut = useStableCallback(async () => {
    // Nettoyer le cache lors de la déconnexion
    cacheManager.clear();
    await signOut();
  });

  // Props stables pour éviter les re-renders du header
  const headerProps = useMemo(() => {
    // Seulement si l'état a vraiment changé
    if (!stateChanged && stableStateRef.current) {
      return {
        accessRights: stableStateRef.current.accessRights,
        accessLoading: stableStateRef.current.accessLoading,
        showWarning,
        timeLeftFormatted,
        signOut: handleSignOut,
        isTenantAdmin,
      };
    }

    return {
      accessRights,
      accessLoading,
      showWarning,
      timeLeftFormatted,
      signOut: handleSignOut,
      isTenantAdmin,
    };
  }, [
    stateChanged,
    accessRights,
    accessLoading,
    showWarning,
    timeLeftFormatted,
    handleSignOut,
    isTenantAdmin,
  ]);

  // Protection anti-boucle stricte avec arrêt forcé
  const now = Date.now();
  renderCountRef.current += 1;

  // Monitoring simplifié avec arrêt après stabilisation
  const isStabilized = useRef(false);

  if (!isStabilized.current) {
    if (renderCountRef.current <= 3) {
      console.log(`🚀 App rendered (${renderCountRef.current})`);
    } else if (renderCountRef.current === 4) {
      console.log(`✅ App stabilized after 4 renders`);
      isStabilized.current = true; // Arrêter le monitoring
    } else if (renderCountRef.current > 10) {
      console.warn(`⚠️ ${renderCountRef.current} renders - possible loop`);
      isStabilized.current = true; // Arrêter le monitoring
    }
  }

  if (loading || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">
            {loading ? 'Chargement...' : 'Vérification des permissions...'}
          </p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/signup/tenant-owner" element={<TenantOwnerSignup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/setup-account" element={<SetupAccount />} />
              <Route path="/invite" element={<InvitePage />} />
              <Route path="*" element={<Auth onAuthStateChange={handleAuthStateChange} />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <AuthProvider level={2} includeProjectIds={true}>
              <TenantProvider>
                <RolesProvider>
                  <ViewModeProvider>
                    <Sonner />
                    <BrowserRouter>
                      <AppLayoutWithSidebar {...headerProps}>
                        <MemoizedRoutes />
                      </AppLayoutWithSidebar>
                    </BrowserRouter>
                  </ViewModeProvider>
                </RolesProvider>
              </TenantProvider>
            </AuthProvider>
          </ThemeProvider>
        </SessionErrorBoundary>
        <Toaster />
        <PerformanceMonitor />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
