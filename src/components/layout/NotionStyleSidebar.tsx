/**
 * NotionStyleSidebar - Navigation Style Noir Élégant (Image 1)
 * Pattern: Sidebar fixe fond noir avec sections collapsibles + rétractable
 *
 * Design:
 * - Fond noir (bg-zinc-950) avec meilleur contraste
 * - Texte blanc/gris clair pour lisibilité
 * - Icônes colorées par section
 * - Hover effects subtils
 * - Sections hiérarchiques COMPLÈTES
 * - Toutes les sous-rubriques fonctionnelles
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
// 🚀 OPTIMISATION BUNDLE - Import depuis barrel export optimisé
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Home,
  Inbox,
  MessageSquare,
  CheckSquare,
  MoreHorizontal,
  Star,
  Plus,
  Users,
  FolderKanban,
  Settings,
  Crown,
  Calendar,
  BarChart3,
  Target,
  Hash,
  UserPlus,
  LogOut,
  Bell,
  Sun,
  Moon,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface NotionStyleSidebarProps {
  accessRights: any;
  accessLoading: boolean;
  isTenantAdmin: boolean;
  signOut: () => Promise<void>;
}

export const NotionStyleSidebar: React.FC<NotionStyleSidebarProps> = ({
  accessRights,
  accessLoading,
  isTenantAdmin,
  signOut,
}) => {
  const location = useLocation();

  // État de rétractation avec persistance localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const [isHomeExpanded, setIsHomeExpanded] = useState(true);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);
  const [isSpacesExpanded, setIsSpacesExpanded] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(['/tasks', '/projects']);

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const isActivePath = (path: string) => location.pathname === path;

  const toggleFavorite = (path: string) => {
    setFavorites(prev => (prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]));
  };

  // Section Accueil
  // Stratégie optimiste : pendant le chargement, on affiche tous les liens de base
  // Une fois chargé, on filtre selon les vrais droits
  const homeItems = [
    { to: '/', label: 'Tableau de bord', icon: Home, show: true },
    {
      to: '/inbox',
      label: 'Boîte de réception',
      icon: Inbox,
      show: !accessLoading && accessRights.canAccessSuperAdmin, // 🔒 Super-Admin uniquement
      badge: 3,
    },
    {
      to: '/tasks',
      label: 'Mes tâches',
      icon: CheckSquare,
      show: accessLoading || accessRights.canAccessTasks,
    },
    { to: '/calendar', label: 'Calendrier', icon: Calendar, show: true },
  ];

  // Section Espaces (Projets/Modules)
  // Stratégie optimiste : afficher tous les espaces pendant le chargement
  const spaceItems = [
    {
      to: '/projects',
      label: 'Projets',
      icon: FolderKanban,
      show: accessLoading || accessRights.canAccessProjects,
      color: 'text-blue-600',
    },
    {
      to: '/hr',
      label: 'Ressources Humaines',
      icon: Users,
      show: accessLoading || accessRights.canAccessHR,
      color: 'text-green-600',
    },
    {
      to: '/operations',
      label: 'Opérations',
      icon: Target,
      show: accessLoading || accessRights.canAccessTasks,
      color: 'text-purple-600',
    },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      show: !accessLoading && accessRights.canAccessSuperAdmin, // 🔒 Super-Admin uniquement
      color: 'text-orange-600',
    },
  ];

  // Section Plus (Autres)
  // Super Admin : NE PAS afficher pendant le chargement (sécurité)
  const moreItems = [
    {
      to: '/settings',
      label: 'Paramètres',
      icon: Settings,
      show: !accessLoading && accessRights.canAccessSuperAdmin, // 🔒 Super-Admin uniquement
    },
    {
      to: '/super-admin',
      label: 'Super Admin',
      icon: Crown,
      show: !accessLoading && accessRights.canAccessSuperAdmin, // Ne jamais afficher pendant le chargement
    },
  ];

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen transition-all duration-300 lg:flex lg:flex-col',
        'border-r border-zinc-800 bg-zinc-950 text-white',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header Sidebar avec bouton Toggle */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <span className="text-sm font-bold text-white">W</span>
          </div>
          {!isCollapsed && (
            <span className="text-base font-semibold whitespace-nowrap">Wadashaqayn</span>
          )}
        </Link>

        {/* Bouton Toggle Collapse/Expand */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 flex-shrink-0 p-0 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          title={isCollapsed ? 'Développer la sidebar' : 'Réduire la sidebar'}
        >
          {isCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Bouton Créer (CTA Principal) */}
      <div className="p-3">
        <Button
          className={cn(
            'w-full gap-2 bg-blue-600 text-white shadow-lg hover:bg-blue-700',
            isCollapsed ? 'justify-center px-0' : 'justify-start'
          )}
          size="sm"
          title={isCollapsed ? 'Créer' : undefined}
        >
          <Plus className="h-4 w-4" />
          {!isCollapsed && 'Créer'}
        </Button>
      </div>

      <ScrollArea className={cn('flex-1', isCollapsed ? 'px-1' : 'px-2')}>
        {/* Section ACCUEIL */}
        <div className="mb-4">
          {!isCollapsed && (
            <button
              onClick={() => setIsHomeExpanded(!isHomeExpanded)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-200"
            >
              {isHomeExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Accueil
            </button>
          )}

          {(isHomeExpanded || isCollapsed) && (
            <div className={cn('mt-1 space-y-0.5', isCollapsed && 'mt-0')}>
              {homeItems.map(item =>
                item.show ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex items-center gap-2 rounded-md text-sm transition-colors',
                      isCollapsed ? 'justify-center px-1 py-2' : 'px-2 py-1.5',
                      isActivePath(item.to)
                        ? 'bg-zinc-800 font-medium text-white shadow-sm'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                    )}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span className="bg-primary text-primary-foreground ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium">
                            {item.badge}
                          </span>
                        )}
                        <button
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(item.to);
                          }}
                          className={cn(
                            'opacity-0 transition-opacity group-hover:opacity-100',
                            favorites.includes(item.to) && 'opacity-100'
                          )}
                        >
                          <Star
                            className={cn(
                              'h-3.5 w-3.5',
                              favorites.includes(item.to)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            )}
                          />
                        </button>
                      </>
                    )}
                  </Link>
                ) : null
              )}
            </div>
          )}
        </div>

        {/* Section FAVORIS */}
        {favorites.length > 0 && !isCollapsed && (
          <div className="mb-4">
            <button
              onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
              className="flex w-full items-center gap-2 px-2 py-1.5 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-200"
            >
              {isFavoritesExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Favoris
            </button>

            {isFavoritesExpanded && (
              <div className="mt-1 space-y-0.5">
                {[...homeItems, ...spaceItems].map(item =>
                  item.show && favorites.includes(item.to) ? (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all',
                        isActivePath(item.to)
                          ? 'bg-zinc-800 font-medium text-white shadow-sm'
                          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                      )}
                    >
                      <Star className="h-4 w-4 flex-shrink-0 fill-yellow-400 text-yellow-400" />
                      <span className="flex-1 truncate">{item.label}</span>
                    </Link>
                  ) : null
                )}
              </div>
            )}
          </div>
        )}

        {!isCollapsed && <Separator className="my-2 bg-zinc-800" />}

        {/* Section ESPACES */}
        <div className="mb-4">
          {!isCollapsed && (
            <div className="flex items-center justify-between px-2 py-1.5">
              <button
                onClick={() => setIsSpacesExpanded(!isSpacesExpanded)}
                className="flex items-center gap-2 text-xs font-semibold text-zinc-500 transition-colors hover:text-zinc-200"
              >
                {isSpacesExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
                Espaces
              </button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
                title="Ajouter un espace"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {(isSpacesExpanded || isCollapsed) && (
            <div className={cn('mt-1 space-y-0.5', isCollapsed && 'mt-0')}>
              {spaceItems.map(item =>
                item.show ? (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex items-center gap-2 rounded-lg text-sm transition-all',
                      isCollapsed ? 'justify-center px-1 py-2' : 'px-3 py-2',
                      isActivePath(item.to)
                        ? 'bg-zinc-800 font-medium text-white shadow-sm'
                        : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                    )}
                  >
                    <item.icon className={cn('h-4 w-4 flex-shrink-0', item.color)} />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        <button
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(item.to);
                          }}
                          className={cn(
                            'opacity-0 transition-opacity group-hover:opacity-100',
                            favorites.includes(item.to) && 'opacity-100'
                          )}
                        >
                          <Star
                            className={cn(
                              'h-3.5 w-3.5',
                              favorites.includes(item.to)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            )}
                          />
                        </button>
                      </>
                    )}
                  </Link>
                ) : null
              )}
            </div>
          )}
        </div>

        {!isCollapsed && <Separator className="my-2 bg-zinc-800" />}

        {/* Section PLUS */}
        <div className="mb-4">
          {!isCollapsed && (
            <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-zinc-500">
              <MoreHorizontal className="h-3.5 w-3.5" />
              Plus
            </div>
          )}

          <div className={cn('mt-1 space-y-0.5', isCollapsed && 'mt-0')}>
            {moreItems.map(item =>
              item.show ? (
                <Link
                  key={item.to}
                  to={item.to}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-lg text-sm transition-all',
                    isCollapsed ? 'justify-center px-1 py-2' : 'px-3 py-2',
                    isActivePath(item.to)
                      ? 'bg-zinc-800 font-medium text-white shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!isCollapsed && <span className="flex-1 truncate">{item.label}</span>}
                </Link>
              ) : null
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Footer Sidebar */}
      <div className={cn('space-y-2 border-t border-zinc-800', isCollapsed ? 'p-2' : 'p-3')}>
        {/* Bouton Inviter (Tenant Admin) */}
        {isTenantAdmin && (
          <Link to="/invite-collaborators" className="block">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'w-full gap-2 border-zinc-700 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white',
                isCollapsed ? 'justify-center px-0' : 'justify-start'
              )}
              title={isCollapsed ? 'Inviter des collaborateurs' : undefined}
            >
              <UserPlus className="h-4 w-4" />
              {!isCollapsed && 'Inviter'}
            </Button>
          </Link>
        )}

        {/* Bouton Déconnexion */}
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            'w-full gap-2 text-zinc-400 hover:bg-zinc-800 hover:text-red-400',
            isCollapsed ? 'justify-center px-0' : 'justify-start'
          )}
          onClick={signOut}
          title={isCollapsed ? 'Déconnexion' : undefined}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && 'Déconnexion'}
        </Button>
      </div>
    </aside>
  );
};
