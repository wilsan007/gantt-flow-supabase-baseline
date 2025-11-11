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

// Icônes /vues/ (DynamicTable, Gantt, Kanban, Dialogs) - 26 icônes nouvelles
export { default as BookTemplate } from 'lucide-react/dist/esm/icons/book-template';
export { default as CalendarDays } from 'lucide-react/dist/esm/icons/calendar-days';
export { default as CalendarIcon } from 'lucide-react/dist/esm/icons/calendar';
// CheckCircle2 déjà défini plus haut
export { default as Copy } from 'lucide-react/dist/esm/icons/copy';
export { default as Download } from 'lucide-react/dist/esm/icons/download';
export { default as Edit } from 'lucide-react/dist/esm/icons/edit';
export { default as Eye } from 'lucide-react/dist/esm/icons/eye';
export { default as Link } from 'lucide-react/dist/esm/icons/link';
// MessageSquare déjà défini plus haut
export { default as Save } from 'lucide-react/dist/esm/icons/save';
export { default as Send } from 'lucide-react/dist/esm/icons/send';
export { default as Sparkles } from 'lucide-react/dist/esm/icons/sparkles';
// Target déjà défini plus haut
export { default as Trash2 } from 'lucide-react/dist/esm/icons/trash-2';
export { default as Upload } from 'lucide-react/dist/esm/icons/upload';
export { default as User } from 'lucide-react/dist/esm/icons/user';
// Icônes additionnelles TaskDetailsDialog
export { default as Building2 } from 'lucide-react/dist/esm/icons/building-2';
// CheckSquare déjà défini plus haut
export { default as Euro } from 'lucide-react/dist/esm/icons/euro';
export { default as FolderOpen } from 'lucide-react/dist/esm/icons/folder-open';
export { default as History } from 'lucide-react/dist/esm/icons/history';
export { default as MessageCircle } from 'lucide-react/dist/esm/icons/message-circle';

// Icônes /tasks/ et /onboarding/ - 15 icônes additionnelles
export { default as Briefcase } from 'lucide-react/dist/esm/icons/briefcase';
export { default as Bug } from 'lucide-react/dist/esm/icons/bug';
export { default as File } from 'lucide-react/dist/esm/icons/file';
export { default as FileDown } from 'lucide-react/dist/esm/icons/file-down';
export { default as FileImage } from 'lucide-react/dist/esm/icons/file-image';
export { default as FileSpreadsheet } from 'lucide-react/dist/esm/icons/file-spreadsheet';
export { default as Globe } from 'lucide-react/dist/esm/icons/globe';
// Star déjà défini plus haut
export { default as UserCheck } from 'lucide-react/dist/esm/icons/user-check';
export { default as UserMinus } from 'lucide-react/dist/esm/icons/user-minus';
export { default as Zap } from 'lucide-react/dist/esm/icons/zap';
export { default as Rocket } from 'lucide-react/dist/esm/icons/rocket';
export { default as Flag } from 'lucide-react/dist/esm/icons/flag';
export { default as Tag } from 'lucide-react/dist/esm/icons/tag';
export { default as Link2 } from 'lucide-react/dist/esm/icons/link-2';
export { default as Flame } from 'lucide-react/dist/esm/icons/flame';
export { default as Package } from 'lucide-react/dist/esm/icons/package';
export { default as Award } from 'lucide-react/dist/esm/icons/award';
export { default as Smile } from 'lucide-react/dist/esm/icons/smile';
export { default as Repeat } from 'lucide-react/dist/esm/icons/repeat';
// FolderKanban déjà défini plus haut
// BookTemplate, Edit, Filter déjà définis plus haut

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
