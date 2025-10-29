/**
 * TaskTableHeader - En-tête du tableau de tâches
 * Pattern: Sticky header (Notion/Airtable)
 */

import React from 'react';

interface TaskTableHeaderProps {
  actionColumns?: Array<{ id: string; title: string }>;
}

export const TaskTableHeader: React.FC<TaskTableHeaderProps> = ({ actionColumns = [] }) => {
  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      <div className="flex">
        {/* Colonnes fixes */}
        <div className="flex-shrink-0 flex border-r">
          <div className="w-12 px-2 py-3 text-xs font-medium text-muted-foreground border-r">#</div>
          <div className="w-64 px-4 py-3 text-xs font-medium text-muted-foreground border-r">Tâche</div>
          <div className="w-32 px-4 py-3 text-xs font-medium text-muted-foreground border-r">Assigné à</div>
          <div className="w-32 px-4 py-3 text-xs font-medium text-muted-foreground border-r">Statut</div>
          <div className="w-24 px-4 py-3 text-xs font-medium text-muted-foreground border-r">Priorité</div>
          <div className="w-32 px-4 py-3 text-xs font-medium text-muted-foreground border-r">Échéance</div>
          <div className="w-24 px-4 py-3 text-xs font-medium text-muted-foreground border-r">Effort (h)</div>
          <div className="w-24 px-4 py-3 text-xs font-medium text-muted-foreground">Actions</div>
        </div>

        {/* Colonnes d'actions dynamiques */}
        {actionColumns.length > 0 && (
          <div className="flex">
            {actionColumns.map((column) => (
              <div
                key={column.id}
                className="w-48 px-4 py-3 text-xs font-medium text-muted-foreground border-r"
              >
                {column.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
