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
      <NotionStyleSidebar
        accessRights={accessRights}
        accessLoading={accessLoading}
        isTenantAdmin={isTenantAdmin}
        signOut={signOut}
      />

      {/* Menu Mobile Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Sidebar Mobile */}
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] lg:hidden">
            <NotionStyleSidebar
              accessRights={accessRights}
              accessLoading={accessLoading}
              isTenantAdmin={isTenantAdmin}
              signOut={signOut}
            />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Header Mobile/Tablet - VERSION MINIMALE */}
        <header className="bg-background sticky top-0 z-[60] lg:hidden">
          <div className="flex items-center justify-between px-2 py-1.5">
            {/* Menu Hamburger uniquement */}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Avatar utilisateur uniquement */}
            <SimpleUserMenu
              user={user}
              isTenantAdmin={isTenantAdmin}
              tenantName={tenantName}
              onSignOut={signOut}
            />
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

        {/* Page Content with Scroll */}
        <main className="bg-muted/30 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};
