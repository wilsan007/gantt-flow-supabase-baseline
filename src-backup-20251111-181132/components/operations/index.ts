/**
 * Module: Operations (Activités Opérationnelles)
 * Exports centralisés
 */

// Pages & Layouts
export { OperationsPage } from './OperationsPage';
export { OperationsEmptyState } from './OperationsEmptyState';

// Cards & Lists
export { ActivityCard } from './ActivityCard';
export { OccurrencesList } from './OccurrencesList';
export { ActivityStatisticsCard } from './ActivityStatisticsCard';

// Forms & Dialogs
export { ActivityFormWithAssignment as ActivityForm } from './ActivityForm';
export { ActivityFormWithAssignment } from './ActivityFormWithAssignment';
export { ScheduleForm } from './ScheduleForm';
export { ActionTemplateList } from './ActionTemplateList';
export { ActionTemplateListEnhanced } from './ActionTemplateListEnhanced';
export { ActionTemplateForm } from './ActionTemplateForm';
export { ActivityDetailDialog } from './ActivityDetailDialog';
export { OneOffActivityDialog } from './OneOffActivityDialog';

// Types
export type { ActivityData as ActivityFormData } from './ActivityForm';
export type { ActionTemplate } from './ActionTemplateList';
export type { ActionTemplateData } from './ActionTemplateForm';
