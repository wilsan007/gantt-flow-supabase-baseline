/**
 * Palette de 45 couleurs pour le Gantt Chart
 * Couleurs arrangées pour maximiser le contraste entre couleurs adjacentes
 * Ordre: Vert → Orange → Bleu → Rouge → Jaune → Violet → Cyan → Rose → Lime → Indigo...
 */

export const GANTT_COLORS = [
  // Séquence 1: Couleurs primaires très contrastées
  '#10b981', // 1. Vert émeraude
  '#f97316', // 2. Orange vif
  '#3b82f6', // 3. Bleu vif
  '#ef4444', // 4. Rouge vif
  '#eab308', // 5. Jaune vif

  // Séquence 2: Couleurs secondaires contrastées
  '#8b5cf6', // 6. Violet
  '#06b6d4', // 7. Cyan
  '#ec4899', // 8. Rose fuchsia
  '#84cc16', // 9. Lime
  '#6366f1', // 10. Indigo

  // Séquence 3: Variations avec fort contraste
  '#059669', // 11. Vert foncé
  '#fb923c', // 12. Orange pêche
  '#2563eb', // 13. Bleu royal
  '#dc2626', // 14. Rouge foncé
  '#fbbf24', // 15. Jaune doré

  // Séquence 4: Teintes claires contrastées
  '#34d399', // 16. Vert clair
  '#fdba74', // 17. Orange clair
  '#60a5fa', // 18. Bleu clair
  '#f87171', // 19. Rouge clair
  '#fde047', // 20. Jaune citron

  // Séquence 5: Couleurs profondes
  '#7c3aed', // 21. Violet foncé
  '#0891b2', // 22. Cyan foncé
  '#f43f5e', // 23. Rose rouge
  '#65a30d', // 24. Olive
  '#4f46e5', // 25. Indigo foncé

  // Séquence 6: Couleurs pastel contrastées
  '#a78bfa', // 26. Violet clair
  '#22d3ee', // 27. Cyan clair
  '#fb7185', // 28. Rose saumon
  '#a3e635', // 29. Lime clair
  '#818cf8', // 30. Indigo clair

  // Séquence 7: Couleurs tertiaires
  '#14b8a6', // 31. Teal
  '#ea580c', // 32. Orange brûlé
  '#1e40af', // 33. Bleu marine
  '#b91c1c', // 34. Rouge bordeaux
  '#ca8a04', // 35. Jaune moutarde

  // Séquence 8: Couleurs vives supplémentaires
  '#d946ef', // 36. Fuchsia
  '#0ea5e9', // 37. Bleu ciel
  '#f472b6', // 38. Rose bonbon
  '#22c55e', // 39. Vert pomme
  '#f59e0b', // 40. Orange ambre

  // Séquence 9: Couleurs finales (41-45)
  '#c026d3', // 41. Magenta
  '#2dd4bf', // 42. Teal clair
  '#be123c', // 43. Rose profond
  '#16a34a', // 44. Vert forêt
  '#9333ea', // 45. Pourpre
];

/**
 * Interface pour mapper les projets aux couleurs
 */
export interface ProjectColorMap {
  [projectId: string]: string;
}

/**
 * Assigne des couleurs aux projets dans l'ordre
 * @param projects Liste des projets
 * @returns Map des couleurs par projet ID
 */
export function assignProjectColors(
  projects: Array<{ id: string; name: string }>
): ProjectColorMap {
  const colorMap: ProjectColorMap = {};

  // NE PAS trier - utiliser l'ordre d'origine pour que les numéros correspondent
  // L'ordre des projets dans le tableau correspond à l'ordre d'affichage
  projects.forEach((project, index) => {
    // Assigner une couleur dans l'ordre, avec wrap-around si plus de 45 projets
    const color = GANTT_COLORS[index % GANTT_COLORS.length];
    colorMap[project.id] = color;
  });

  return colorMap;
}

/**
 * Obtient la couleur pour une tâche basée UNIQUEMENT sur project_id
 * @param task Tâche avec project_id
 * @param projectColorMap Map des couleurs de projets
 * @param taskIndex Index de la tâche (pour les tâches sans projet)
 * @param totalProjects Nombre total de projets
 * @returns Couleur hexadécimale
 */
export function getTaskColor(
  task: { project_id?: string },
  projectColorMap: ProjectColorMap,
  taskIndex: number,
  totalProjects: number
): string {
  // ✅ Si la tâche a un project_id, utiliser la couleur du projet
  if (task.project_id && projectColorMap[task.project_id]) {
    return projectColorMap[task.project_id];
  }

  // Pour les tâches sans projet, utiliser les couleurs restantes
  // Commencer après les couleurs des projets
  const colorIndex = (totalProjects + taskIndex) % GANTT_COLORS.length;
  return GANTT_COLORS[colorIndex];
}

/**
 * Convertit une couleur hex en RGB pour manipulation
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Assombrit une couleur pour la partie complétée
 */
export function darkenColor(hex: string, percent: number = 30): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = (100 - percent) / 100;
  const r = Math.round(rgb.r * factor);
  const g = Math.round(rgb.g * factor);
  const b = Math.round(rgb.b * factor);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Éclaircit une couleur pour la partie non complétée
 */
export function lightenColor(hex: string, percent: number = 50): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const factor = percent / 100;
  const r = Math.round(rgb.r + (255 - rgb.r) * factor);
  const g = Math.round(rgb.g + (255 - rgb.g) * factor);
  const b = Math.round(rgb.b + (255 - rgb.b) * factor);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
