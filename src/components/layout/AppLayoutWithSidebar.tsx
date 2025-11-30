/**
 * AppLayoutWithSidebar - Layout principal avec Sidebar Notion
 * Pattern: Sidebar desktop + Menu mobile hamburger
 *
 * Fonctionnalités:
 * - Sidebar fixe (desktop)
 * - Menu hamburger (mobile)
 * - Header responsive
 * - Transitions fluides
 */

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
// 🚀 OPTIMISATION BUNDLE - Import depuis barrel export optimisé
import { Menu, X, Building2 } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { NotionStyleSidebar } from './NotionStyleSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationButton } from '@/components/notifications/NotificationButton';
import { RoleIndicator } from '@/components/auth/RoleIndicator';
import { SessionIndicator } from '@/components/SessionIndicator';
import { UserMenu } from '@/components/user/UserMenu';
import { SimpleUserMenu } from '@/components/user/SimpleUserMenu';
import { supabase } from '@/integrations/supabase/client';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useTenant } from '@/contexts/TenantContext';
import { useScrollDirection } from '@/hooks/use-scroll-direction';
import { useIsMobileLayout } from '@/hooks/use-mobile';

interface AppLayoutWithSidebarProps {
  children: React.ReactNode;
  accessRights: any;
  accessLoading: boolean;
  showWarning: boolean;
  timeLeftFormatted: string;
  signOut: () => Promise<void>;
  isTenantAdmin: boolean;
  user?: any;
}

export const AppLayoutWithSidebar: React.FC<AppLayoutWithSidebarProps> = ({
  children,
  accessRights,
  accessLoading,
  showWarning,
  timeLeftFormatted,
  signOut,
  isTenantAdmin,
  user,
}) => {
  const { isSuperAdmin: checkIsSuperAdmin } = useUserRoles();
  const isSuperAdmin = checkIsSuperAdmin();
  const { currentTenant } = useTenant();
  const tenantName = currentTenant?.name;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Ref vers le conteneur scrollable principal
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Détection du scroll et du layout mobile pour cacher les éléments UI
  const { isScrollingDown } = useScrollDirection(scrollContainerRef);
  const isMobile = useIsMobileLayout(); // < 1024px pour layout (portrait + paysage)

  // Fermer le menu lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Empêcher le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar Desktop - Toujours visible sur large screens */}
      <div className="hidden lg:block">
        <NotionStyleSidebar
          accessRights={accessRights}
          accessLoading={accessLoading}
          isTenantAdmin={isTenantAdmin}
          signOut={signOut}
        />
      </div>

      {/* Menu Mobile Overlay - REDESIGNED */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop cliquable - AVEC BLUR */}
          <div
            className="animate-in fade-in absolute inset-0 bg-black/40 backdrop-blur-sm duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fermer le menu"
          />

          {/* Sidebar Mobile - Design Moderne & Élégant */}
          <div className="animate-in slide-in-from-left absolute inset-y-0 left-0 w-fit overflow-hidden rounded-r-3xl border-r border-white/10 bg-zinc-950 shadow-2xl duration-300">
            {/* Contenu de la sidebar - Sans padding pour fusionner avec le fond */}
            <div className="pb-6">
              <NotionStyleSidebar
                accessRights={accessRights}
                accessLoading={accessLoading}
                isTenantAdmin={isTenantAdmin}
                signOut={signOut}
                onLinkClick={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div ref={scrollContainerRef} className="flex flex-1 flex-col overflow-y-auto">
        {/* Menu Hamburger Floating - TOUJOURS VISIBLE en mode mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`bg-background/80 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 fixed top-4 left-4 z-[80] h-11 w-11 rounded-full border shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 lg:hidden`}
          aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Menu Utilisateur Floating - TOUJOURS VISIBLE en mode mobile (à droite) */}
        {user && (
          <div className="fixed top-4 right-4 z-[80] lg:hidden">
            {isSuperAdmin ? (
              <UserMenu
                user={user}
                isSuperAdmin={isSuperAdmin}
                isTenantAdmin={isTenantAdmin}
                tenantName={tenantName}
                onSignOut={signOut}
                className="bg-background/95 border-border hover:bg-accent flex h-10 w-10 items-center justify-center rounded-full border p-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110"
              />
            ) : (
              <SimpleUserMenu
                user={user}
                isTenantAdmin={isTenantAdmin}
                tenantName={tenantName}
                onSignOut={signOut}
                className="bg-background/95 border-border hover:bg-accent flex h-10 w-10 items-center justify-center rounded-full border p-0 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110"
              />
            )}
          </div>
        )}

        {/* Header Desktop (optionnel - pour actions supplémentaires) */}
        <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30 hidden border-b backdrop-blur lg:block">
          <div className="flex items-center justify-between px-6 py-2.5">
            {/* Nom et Logo Entreprise Tenant */}
            <div className="flex items-center gap-3">
              {/* Logo de l'entreprise */}
              {currentTenant?.logo_url ? (
                <div className="border-primary/20 bg-background flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border-2 shadow-sm">
                  <img
                    src={currentTenant.logo_url}
                    alt={`Logo ${tenantName}`}
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="border-primary/30 from-primary/5 to-accent/5 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed bg-gradient-to-br">
                  <Building2 className="text-primary/60 h-5 w-5" />
                </div>
              )}

              {/* Nom de l'entreprise */}
              <h1 className="from-primary via-accent to-tech-purple bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent">
                {tenantName || 'Mon Entreprise'}
              </h1>
            </div>

            {/* Actions Desktop */}
            <div className="flex items-center gap-2">
              {showWarning && (
                <div className="flex items-center gap-2 rounded-md bg-orange-100 px-3 py-1.5 text-sm font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  ⏰ {timeLeftFormatted}
                </div>
              )}

              <NotificationButton />
              <RoleIndicator />
              <SessionIndicator />
              <ThemeToggle />
              {/* Menu Utilisateur - Conditionnel selon rôle */}
              {user &&
                (isSuperAdmin ? (
                  <UserMenu
                    user={user}
                    isSuperAdmin={isSuperAdmin}
                    isTenantAdmin={isTenantAdmin}
                    tenantName={tenantName}
                    onSignOut={signOut}
                  />
                ) : (
                  <SimpleUserMenu
                    user={user}
                    isTenantAdmin={isTenantAdmin}
                    tenantName={tenantName}
                    onSignOut={signOut}
                  />
                ))}
            </div>
          </div>
        </header>

        {/* Page Content with Scroll - SANS ESPACE EN HAUT */}
        <main className="bg-muted/30 flex-1 overflow-y-auto">
          <div className="flex min-h-full w-full flex-col">
            <div className="flex-1">{children}</div>
            <footer className="text-muted-foreground py-6 text-center text-xs">
              <div className="flex justify-center gap-4">
                <a href="/privacy-policy" className="hover:underline">
                  Politique de Confidentialité
                </a>
                <a href="/terms-of-use" className="hover:underline">
                  Conditions d'Utilisation
                </a>
              </div>
              <p className="mt-2">
                © {new Date().getFullYear()} Wadashaqayn. Tous droits réservés.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};
