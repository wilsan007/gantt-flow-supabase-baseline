import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { Auth } from "@/components/Auth";
import { ThemeProvider } from "next-themes";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NotificationButton } from "@/components/notifications/NotificationButton";
import { RoleManagementButton } from "@/components/admin/RoleManagementButton";
import Index from "./pages/Index";
import HRPage from "./pages/HRPage";
import ProjectPage from "./pages/ProjectPage";
import TaskManagementPage from "./pages/TaskManagementPage";
import NotFound from "./pages/NotFound";
import type { User, Session } from '@supabase/supabase-js';

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session existante au démarrage
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setSession(session);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleAuthStateChange = (user: User | null, session: Session | null) => {
    setUser(user);
    setSession(session);
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (!user || !session) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Auth onAuthStateChange={handleAuthStateChange} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground">
              <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4">
                  <div className="flex items-center justify-between">
                    <nav className="flex items-center space-x-6">
                      <Link to="/" className="text-lg font-semibold">
                        Tableau de Bord
                      </Link>
                      <Link 
                        to="/hr" 
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Ressources Humaines
                      </Link>
                      <Link 
                        to="/projects" 
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Projets & Alertes
                      </Link>
                      <Link 
                        to="/tasks" 
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Gestion des Tâches
                      </Link>
                    </nav>
                    <div className="flex items-center gap-2">
                      <RoleManagementButton />
                      <NotificationButton />
                      <ThemeToggle />
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
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
