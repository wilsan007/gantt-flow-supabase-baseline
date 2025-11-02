/**
 * ResponsiveHeader - Menu Navigation avec Hamburger
 * Pattern Mobile-First - Linear/Notion
 * 
 * Fonctionnalités:
 * - Menu hamburger sur mobile/tablet
 * - Overlay qui se superpose au contenu
 * - Auto-fermeture après sélection
 * - Transitions fluides
 * - Adaptatif desktop/mobile
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  FolderKanban, 
  CheckSquare,
  Settings,
  Crown,
  UserPlus,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationButton } from '@/components/notifications/NotificationButton';
import { RoleManagementButton } from '@/components/admin/RoleManagementButton';
import { LogoutButton } from '@/components/LogoutButton';
import { SessionIndicator } from '@/components/SessionIndicator';
import { RoleIndicator } from '@/components/auth/RoleIndicator';
import { cn } from '@/lib/utils';

interface ResponsiveHeaderProps {
  accessRights: any;
  showWarning: boolean;
  timeLeftFormatted: string;
  signOut: () => Promise<void>;
  isTenantAdmin: boolean;
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  accessRights,
  showWarning,
  timeLeftFormatted,
  signOut,
  isTenantAdmin
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Fermer le menu lors du changement de route
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Empêcher le scroll du body quand le menu est ouvert
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Fermer le menu avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const menuItems = [
    { to: '/', label: 'Accueil', icon: Home, show: true },
    { to: '/hr', label: 'Ressources Humaines', icon: Users, show: accessRights.canAccessHR },
    { to: '/projects', label: 'Projets', icon: FolderKanban, show: accessRights.canAccessProjects },
    { to: '/tasks', label: 'Tâches', icon: CheckSquare, show: accessRights.canAccessTasks },
    { to: '/operations', label: 'Opérations', icon: Settings, show: accessRights.canAccessTasks },
    { to: '/super-admin', label: 'Super Admin', icon: Crown, show: accessRights.canAccessSuperAdmin },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <>
      {/* Header Principal */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo + Menu Hamburger (Mobile/Tablet) */}
            <div className="flex items-center gap-4">
              {/* Bouton Hamburger - Visible mobile/tablet */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden -ml-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>

              {/* Logo/Titre */}
              <Link to="/" className="font-semibold text-lg">
                Wadashaqeen
              </Link>

              {/* Navigation Desktop - Caché sur mobile/tablet */}
              <nav className="hidden lg:flex items-center space-x-1">
                {menuItems.map((item) =>
                  item.show ? (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActivePath(item.to)
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  ) : null
                )}
              </nav>
            </div>

            {/* Actions (Droite) */}
            <div className="flex items-center gap-2">
              {/* Bouton Inviter (Tenant Admin uniquement) - Desktop */}
              {isTenantAdmin && (
                <Link to="/invite-collaborators" className="hidden md:block">
                  <Button variant="default" size="sm" className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden xl:inline">Inviter</span>
                  </Button>
                </Link>
              )}

              {/* Warning Timer */}
              {showWarning && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-md text-sm font-medium">
                  ⏰ <span className="hidden md:inline">Déconnexion dans</span> {timeLeftFormatted}
                </div>
              )}

              {/* Boutons d'action - Responsive */}
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <div className="hidden sm:block">
                  <NotificationButton />
                </div>
                {accessRights.canManageRoles && (
                  <div className="hidden md:block">
                    <RoleManagementButton />
                  </div>
                )}
                <div className="hidden sm:block">
                  <RoleIndicator />
                </div>
                <div className="hidden md:block">
                  <SessionIndicator />
                </div>
                <div className="hidden sm:block">
                  <LogoutButton onSignOut={signOut} />
                </div>
                
                {/* Menu Mobile rapide */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="sm:hidden"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay + Menu Sidebar Mobile/Tablet */}
      {isMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-background border-r shadow-2xl lg:hidden transform transition-transform duration-300 ease-in-out">
            {/* Header du menu */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Fermer le menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-180px)]">
              {menuItems.map((item) =>
                item.show ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      isActivePath(item.to)
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ) : null
              )}

              {/* Bouton Inviter dans le menu mobile */}
              {isTenantAdmin && (
                <>
                  <div className="my-2 border-t" />
                  <Link
                    to="/invite-collaborators"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <UserPlus className="h-5 w-5" />
                    Inviter des collaborateurs
                  </Link>
                </>
              )}
            </nav>

            {/* Actions du bas */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background space-y-2">
              {showWarning && (
                <div className="flex items-center justify-center gap-2 px-3 py-2 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-md text-sm font-medium mb-2">
                  ⏰ Déconnexion dans {timeLeftFormatted}
                </div>
              )}
              
              <div className="flex items-center justify-between gap-2">
                <RoleIndicator />
                <SessionIndicator />
              </div>
              
              <Button
                variant="destructive"
                size="sm"
                className="w-full gap-2"
                onClick={() => {
                  setIsMenuOpen(false);
                  signOut();
                }}
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
