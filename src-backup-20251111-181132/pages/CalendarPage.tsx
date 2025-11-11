/**
 * 📅 CalendarPage - Vue Calendrier Complète
 *
 * Page dédiée au calendrier des tâches avec :
 * - Vue mois/semaine/jour
 * - Navigation temporelle
 * - Détails des tâches par jour
 * - Statistiques de charge de travail
 */

import { TaskCalendar } from '@/components/tasks/TaskCalendar';

export default function CalendarPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto space-y-6 p-6">
        <TaskCalendar />
      </div>
    </div>
  );
}
