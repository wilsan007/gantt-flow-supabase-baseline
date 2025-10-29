/**
 * TaskDialogManager - Gestionnaire de dialogues pour les tâches
 * Pattern: Dialog orchestration (Linear/Notion)
 */

import React from 'react';

interface TaskDialogManagerProps {
  children?: React.ReactNode;
}

export const TaskDialogManager: React.FC<TaskDialogManagerProps> = ({ children }) => {
  return <>{children}</>;
};
