import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useRef, useMemo, memo, useCallback, useState } from "react";
import { useStableCallback } from "@/hooks/useStableCallback";
// import { usePerformanceOptimizer, useRenderOptimizer } from "@/hooks/usePerformanceOptimizer";
import { Auth } from "@/components/Auth";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationButton } from "@/components/notifications/NotificationButton";
import { RoleManagementButton } from "@/components/admin/RoleManagementButton";
import { LogoutButton } from "@/components/LogoutButton";
import { SessionIndicator } from "@/components/SessionIndicator";
import { SessionErrorBoundary } from "@/components/SessionErrorBoundary";
import { TenantProvider } from "./contexts/TenantContext";
import { ViewModeProvider } from "./contexts/ViewModeContext";
import Index from "./pages/Index";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { useSessionManager } from "@/hooks/useSessionManager";
import { useRoleBasedAccess } from "@/hooks/useRoleBasedAccess";
// import { useRenderTracker } from "@/hooks/usePerformanceMonitor";
import { cacheManager } from "@/lib/cacheManager";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleIndicator } from "@/components/auth/RoleIndicator";
import HRPage from "./pages/HRPage";
import HRPageWithCollaboratorInvitation from "./pages/HRPageWithCollaboratorInvitation";
import ProjectPage from "./pages/ProjectPage";
import TaskManagementPage from "./pages/TaskManagementPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import TenantOwnerSignup from "./pages/TenantOwnerSignup";
import AuthCallback from "./pages/AuthCallback";
import SetupAccount from "./pages/SetupAccount";
import InvitePage from "./pages/InvitePage";
import NotFound from "./pages/NotFound";
import PerformanceMonitor from "./components/dev/PerformanceMonitor";
import { OperationsPage } from "./components/operations";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

// Composants memoizés STRICTEMENT pour éviter les re-renders
const MemoizedHeader = memo(({ 
  accessRights, 
  showWarning, 
  timeLeftFormatted, 
  signOut,
  isTenantAdmin 
}: {
  accessRights: any;
  showWarning: boolean;
  timeLeftFormatted: string;
  signOut: () => Promise<void>;
  isTenantAdmin: boolean;
}) => (
  <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <nav className="flex items-center space-x-4">
          <Link to="/" className="text-foreground hover:text-primary transition-colors">
            Accueil
          </Link>
          {accessRights.canAccessHR && (
            <Link to="/hr" className="text-foreground hover:text-primary transition-colors">
              RH
            </Link>
          )}
          {accessRights.canAccessProjects && (
            <Link to="/projects" className="text-foreground hover:text-primary transition-colors">
              Projets
            </Link>
          )}
          {accessRights.canAccessTasks && (
            <Link to="/tasks" className="text-foreground hover:text-primary transition-colors">
              Tâches
            </Link>
          )}
          {accessRights.canAccessTasks && (
            <Link to="/operations" className="text-foreground hover:text-primary transition-colors">
              Opérations
            </Link>
          )}
          {accessRights.canAccessSuperAdmin && (
            <Link 
              to="/super-admin" 
              className="text-sm font-medium text-yellow-600 hover:text-yellow-500 transition-colors flex items-center gap-1"
            >
              👑 Super Admin
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-3">
          {isTenantAdmin && (
            <Link to="/invite-collaborators">
              <Button 
                variant="default" 
                size="sm"
                className="flex items-center gap-2 bg-primary hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4" />
                Inviter des collaborateurs
              </Button>
            </Link>
          )}
          {showWarning && (
            <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-md text-sm font-medium">
              ⏰ Déconnexion automatique dans {timeLeftFormatted}
            </div>
          )}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <NotificationButton />
            {accessRights.canManageRoles && <RoleManagementButton />}
            <RoleIndicator />
            <SessionIndicator />
            <LogoutButton onSignOut={signOut} />
          </div>
        </div>
      </div>
    </div>
  </header>
));

MemoizedHeader.displayName = 'MemoizedHeader';

// Composant Routes memoizé pour éviter les re-renders
const MemoizedRoutes = memo(() => (
  <Routes>
    <Route path="/" element={<Index />} />
    
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
    
    {/* Routes publiques */}
    <Route path="/auth" element={<Auth onAuthStateChange={() => {}} />} />
    <Route path="/signup" element={<TenantOwnerSignup />} />
    <Route path="/auth/callback" element={<AuthCallback />} />
    <Route path="/setup" element={<SetupAccount />} />
    <Route path="/invite/:inviteId" element={<InvitePage />} />
    
    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
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
  const { isSuperAdmin: checkIsSuperAdmin, isTenantAdmin: checkIsTenantAdmin, isLoading: superAdminLoading } = useUserRoles();
  const isSuperAdmin = checkIsSuperAdmin();
  const isTenantAdmin = checkIsTenantAdmin();
  const { accessRights, isLoading: accessLoading } = useRoleBasedAccess();
  
  // Détection des changements d'état pour éviter les re-renders inutiles
  const currentState = {
    session: !!session,
    loading,
    accessLoading,
    accessRights: JSON.stringify(accessRights)
  };
  
  const lastState = stableStateRef.current;
  const stateChanged = !lastState || 
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
      accessRights
    };
  }
  
  // Timer réactivé avec configuration memoizée (protection anti-boucle)
  const timerConfig = useMemo(() => ({
    totalTimeoutMinutes: 15,
    warningMinutes: 5,
    enabled: !!session && !loading // Activer seulement si connecté et chargé
  }), [!!session, loading]); // Dépendances minimales et stables
  
  const { 
    showWarning, 
    timeLeftFormatted, 
    isActive: timerActive 
  } = useInactivityTimer(timerConfig);
  
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
        showWarning,
        timeLeftFormatted,
        signOut: handleSignOut,
        isTenantAdmin
      };
    }
    
    return {
      accessRights,
      showWarning,
      timeLeftFormatted,
      signOut: handleSignOut,
      isTenantAdmin
    };
  }, [stateChanged, accessRights, showWarning, timeLeftFormatted, handleSignOut, isTenantAdmin]);
  
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
            <TenantProvider>
              <ViewModeProvider>
                <Sonner />
                <BrowserRouter>
              <div className="min-h-screen bg-background text-foreground">
                <MemoizedHeader {...headerProps} />
                
                <main className="flex-1">
                  <MemoizedRoutes />
                </main>
              </div>
            </BrowserRouter>
              </ViewModeProvider>
            </TenantProvider>
          </ThemeProvider>
        </SessionErrorBoundary>
        <Toaster />
        <PerformanceMonitor />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
