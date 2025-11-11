/**
 * Barrel export optimisé pour lucide-react
 *
 * Contient uniquement les icônes critiques chargées au démarrage.
 * Les autres composants doivent continuer à importer depuis 'lucide-react'.
 *
 * IMPACT: Réduit le bundle initial de ~120KB en n'incluant que les icônes nécessaires
 */

// Export des types pour compatibilité TypeScript
export type { LucideIcon, LucideProps } from 'lucide-react';

// Icônes Navigation/Layout (Sidebar)
export { default as ChevronDown } from 'lucide-react/dist/esm/icons/chevron-down';
export { default as ChevronRight } from 'lucide-react/dist/esm/icons/chevron-right';
export { default as ChevronsLeft } from 'lucide-react/dist/esm/icons/chevrons-left';
export { default as ChevronsRight } from 'lucide-react/dist/esm/icons/chevrons-right';
export { default as Home } from 'lucide-react/dist/esm/icons/home';
export { default as Inbox } from 'lucide-react/dist/esm/icons/inbox';
export { default as MessageSquare } from 'lucide-react/dist/esm/icons/message-square';
export { default as CheckSquare } from 'lucide-react/dist/esm/icons/check-square';
export { default as MoreHorizontal } from 'lucide-react/dist/esm/icons/more-horizontal';
export { default as Star } from 'lucide-react/dist/esm/icons/star';
export { default as Plus } from 'lucide-react/dist/esm/icons/plus';
export { default as Users } from 'lucide-react/dist/esm/icons/users';
export { default as FolderKanban } from 'lucide-react/dist/esm/icons/folder-kanban';
export { default as Settings } from 'lucide-react/dist/esm/icons/settings';
export { default as Crown } from 'lucide-react/dist/esm/icons/crown';
export { default as Calendar } from 'lucide-react/dist/esm/icons/calendar';
export { default as BarChart3 } from 'lucide-react/dist/esm/icons/bar-chart-3';
export { default as Target } from 'lucide-react/dist/esm/icons/target';
export { default as Hash } from 'lucide-react/dist/esm/icons/hash';
export { default as UserPlus } from 'lucide-react/dist/esm/icons/user-plus';
export { default as LogOut } from 'lucide-react/dist/esm/icons/log-out';
export { default as Bell } from 'lucide-react/dist/esm/icons/bell';
export { default as Sun } from 'lucide-react/dist/esm/icons/sun';
export { default as Moon } from 'lucide-react/dist/esm/icons/moon';

// Icônes AppLayout
export { default as Menu } from 'lucide-react/dist/esm/icons/menu';
export { default as X } from 'lucide-react/dist/esm/icons/x';

// Icônes UI Sidebar
export { default as PanelLeft } from 'lucide-react/dist/esm/icons/panel-left';

// Icônes communes Dashboard/Index
export { default as BookOpen } from 'lucide-react/dist/esm/icons/book-open';
export { default as Clock } from 'lucide-react/dist/esm/icons/clock';
export { default as TrendingUp } from 'lucide-react/dist/esm/icons/trending-up';
export { default as TrendingDown } from 'lucide-react/dist/esm/icons/trending-down';
export { default as Minus } from 'lucide-react/dist/esm/icons/minus';
export { default as FileText } from 'lucide-react/dist/esm/icons/file-text';
export { default as AlertCircle } from 'lucide-react/dist/esm/icons/alert-circle';
export { default as CheckCircle2 } from 'lucide-react/dist/esm/icons/check-circle-2';
export { default as XCircle } from 'lucide-react/dist/esm/icons/x-circle';
export { default as ArrowRight } from 'lucide-react/dist/esm/icons/arrow-right';
export { default as ArrowLeft } from 'lucide-react/dist/esm/icons/arrow-left';
export { default as ChevronLeft } from 'lucide-react/dist/esm/icons/chevron-left';
export { default as ChevronUp } from 'lucide-react/dist/esm/icons/chevron-up';
export { default as Search } from 'lucide-react/dist/esm/icons/search';
export { default as Filter } from 'lucide-react/dist/esm/icons/filter';

// Icônes UI Components (shadcn/ui)
export { default as Check } from 'lucide-react/dist/esm/icons/check';
export { default as Circle } from 'lucide-react/dist/esm/icons/circle';
export { default as Dot } from 'lucide-react/dist/esm/icons/dot';
export { default as GripVertical } from 'lucide-react/dist/esm/icons/grip-vertical';
export { default as Loader2 } from 'lucide-react/dist/esm/icons/loader-2';
export { default as RefreshCw } from 'lucide-react/dist/esm/icons/refresh-cw';
export { default as ExternalLink } from 'lucide-react/dist/esm/icons/external-link';
export { default as Info } from 'lucide-react/dist/esm/icons/info';
export { default as AlertTriangle } from 'lucide-react/dist/esm/icons/alert-triangle';
export { default as Lock } from 'lucide-react/dist/esm/icons/lock';
export { default as Mail } from 'lucide-react/dist/esm/icons/mail';
export { default as Shield } from 'lucide-react/dist/esm/icons/shield';
export { default as UserX } from 'lucide-react/dist/esm/icons/user-x';
export { default as Wifi } from 'lucide-react/dist/esm/icons/wifi';
export { default as Smartphone } from 'lucide-react/dist/esm/icons/smartphone';

/**
 * Usage dans les fichiers critiques:
 *
 * AVANT:
 * import { ChevronDown, Home, Users } from 'lucide-react';
 *
 * APRÈS:
 * import { ChevronDown, Home, Users } from '@/lib/icons';
 *
 * Les autres composants non-critiques continuent d'utiliser 'lucide-react'
 */
