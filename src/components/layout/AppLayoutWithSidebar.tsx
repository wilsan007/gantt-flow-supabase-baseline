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

import React, { useState, useEffect } from 'react';
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

      {/* Menu Mobile Overlay - FONCTIONNEL ET ANIMÉ */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          {/* Backdrop cliquable - SANS BLUR */}
          <div
            className="animate-in fade-in absolute inset-0 bg-black/60 duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Fermer le menu"
          />

          {/* Sidebar Mobile qui slide depuis la gauche */}
          <div className="bg-background animate-in slide-in-from-left absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r shadow-2xl duration-300">
            {/* Bouton fermer en haut */}
            <div className="bg-background sticky top-0 z-10 flex items-center justify-between border-b p-4">
              <span className="text-lg font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Contenu de la sidebar */}
            <div className="p-2">
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
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Header Mobile/Tablet - SIMPLIFIÉ SANS AVATAR */}
        <header className="bg-background/95 sticky top-0 z-[70] border-b backdrop-blur-sm lg:hidden">
          <div className="flex items-center gap-3 px-3 py-2.5">
            {/* Menu Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent h-9 w-9 shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Logo/Nom du tenant */}
            <div className="flex flex-1 items-center gap-2">
              {currentTenant?.logo_url ? (
                <img
                  src={currentTenant.logo_url}
                  alt={tenantName || ''}
                  className="h-7 w-7 rounded object-contain"
                />
              ) : (
                <Building2 className="text-primary h-5 w-5" />
              )}
              <span className="truncate text-sm font-semibold">{tenantName || 'Wadashaqayn'}</span>
            </div>
          </div>
        </header>

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
          <div className="h-full w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};
