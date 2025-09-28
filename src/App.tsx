import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { Auth } from "@/components/Auth";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationButton } from "@/components/notifications/NotificationButton";
import { RoleManagementButton } from "@/components/admin/RoleManagementButton";
import { LogoutButton } from "@/components/LogoutButton";
import { SessionIndicator } from "@/components/SessionIndicator";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { TenantProvider } from "./contexts/TenantContext";
import Index from "./pages/Index";
import HRPage from "./pages/HRPage";
import ProjectPage from "./pages/ProjectPage";
import TaskManagementPage from "./pages/TaskManagementPage";
import SuperAdminPage from "./pages/SuperAdminPage";
import TenantOwnerSignup from "./pages/TenantOwnerSignup";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, session, loading, signOut } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading session...</div>;
  }

  if (!user || !session) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/signup/tenant-owner" element={<TenantOwnerSignup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<Auth />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <TenantProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background text-foreground">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <nav className="flex items-center space-x-6">
                  <Link to="/" className="text-lg font-semibold">Tableau de Bord</Link>
                  <Link to="/hr" className="text-sm font-medium text-muted-foreground hover:text-foreground">Ressources Humaines</Link>
                  <Link to="/projects" className="text-sm font-medium text-muted-foreground hover:text-foreground">Projets & Alertes</Link>
                  <Link to="/tasks" className="text-sm font-medium text-muted-foreground hover:text-foreground">Gestion des Tâches</Link>
                  <Link to="/super-admin" className="text-sm font-medium text-yellow-600 hover:text-yellow-500">👑 Super Admin</Link>
                </nav>
                <div className="flex items-center gap-2">
                  <SessionIndicator />
                  <RoleManagementButton />
                  <NotificationButton />
                  <ThemeToggle />
                  <LogoutButton onSignOut={signOut} />
                </div>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/hr" element={<HRPage />} />
              <Route path="/projects" element={<ProjectPage />} />
              <Route path="/tasks" element={<TaskManagementPage />} />
              <Route path="/super-admin" element={<SuperAdminPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </TenantProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
