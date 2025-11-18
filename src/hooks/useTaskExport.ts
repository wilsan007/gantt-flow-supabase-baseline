/**
 * 🎯 useTaskExport - Hook d'Export Excel/PDF (OPTIMISÉ avec Code Splitting)
 * Pattern: Notion, Linear, Monday.com
 *
 * Optimisations:
 * - Lazy loading des bibliothèques lourdes (xlsx, jspdf)
 * - Bundle initial réduit de ~740 KB
 * - Chargement à la demande uniquement lors de l'export
 */

import { useCallback, useState } from 'react';
import { Task } from '@/hooks/optimized';
import { TaskFilters } from '@/components/tasks/AdvancedFilters';
import { useToast } from '@/hooks/use-toast';

// Mapper les valeurs pour l'export
const STATUS_LABELS: Record<string, string> = {
  todo: 'À faire',
  doing: 'En cours',
  blocked: 'Bloqué',
  done: 'Terminé',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

interface ExportOptions {
  filename?: string;
  includeMetadata?: boolean;
  filters?: TaskFilters;
}

export const useTaskExport = () => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  /**
   * Préparer les données pour l'export
   */
  const prepareExportData = useCallback((tasks: Task[]) => {
    return tasks.map(task => ({
      ID: task.id,
      Titre: task.title,
      Description: task.description || '',
      Statut: STATUS_LABELS[task.status] || task.status,
      Priorité: PRIORITY_LABELS[task.priority] || task.priority,
      'Assigné à':
        typeof task.assignee === 'string'
          ? task.assignee
          : task.assignee?.full_name || 'Non assigné',
      Projet: task.project_name || task.project_id || 'Aucun',
      'Date début': task.start_date || '',
      'Date fin': task.due_date || '',
      Progression: task.progress ? `${task.progress}%` : '0%',
      'Effort estimé (h)': task.effort_estimate_h || 0,
      'Tâche parente': task.parent_task_id || '',
      'Créée le': task.created_at ? new Date(task.created_at).toLocaleDateString('fr-FR') : '',
    }));
  }, []);

  /**
   * Export vers Excel (LAZY LOADED)
   */
  const exportToExcel = useCallback(
    async (tasks: Task[], options: ExportOptions = {}) => {
      if (isExporting) return false;

      setIsExporting(true);

      try {
        const {
          filename = `taches_${new Date().toISOString().split('T')[0]}.xlsx`,
          includeMetadata = true,
          filters,
        } = options;

        // Charger ExcelJS dynamiquement (code splitting)
        toast({
          title: '⏳ Chargement...',
          description: "Préparation de l'export Excel",
        });

        const ExcelJS = await import('exceljs');

        // Préparer les données
        const exportData = prepareExportData(tasks);

        // Créer le workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Wadashaqayn';
        workbook.created = new Date();

        // Feuille principale avec les tâches
        const worksheet = workbook.addWorksheet('Tâches');

        // Ajouter les colonnes avec largeurs
        worksheet.columns = [
          { header: 'ID', key: 'ID', width: 35 },
          { header: 'Titre', key: 'Titre', width: 40 },
          { header: 'Description', key: 'Description', width: 50 },
          { header: 'Statut', key: 'Statut', width: 12 },
          { header: 'Priorité', key: 'Priorité', width: 12 },
          { header: 'Assigné à', key: 'Assigné à', width: 20 },
          { header: 'Projet', key: 'Projet', width: 25 },
          { header: 'Date début', key: 'Date début', width: 12 },
          { header: 'Date fin', key: 'Date fin', width: 12 },
          { header: 'Progression (%)', key: 'Progression (%)', width: 12 },
          { header: 'Effort estimé', key: 'Effort estimé', width: 15 },
          { header: 'Tâche parente', key: 'Tâche parente', width: 35 },
          { header: 'Créée le', key: 'Créée le', width: 12 },
        ];

        // Ajouter les données
        exportData.forEach(row => {
          worksheet.addRow(row);
        });

        // Styliser l'en-tête
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF4F46E5' },
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Ajouter feuille de métadonnées si demandé
        if (includeMetadata) {
          const metadataSheet = workbook.addWorksheet('Métadonnées');
          metadataSheet.columns = [
            { header: 'Propriété', key: 'propriete', width: 20 },
            { header: 'Valeur', key: 'valeur', width: 40 },
          ];

          const metadata: Array<{ propriete: string; valeur: string }> = [
            { propriete: 'Date export', valeur: new Date().toLocaleString('fr-FR') },
            { propriete: 'Nombre de tâches', valeur: tasks.length.toString() },
            { propriete: 'Filtres appliqués', valeur: filters ? 'Oui' : 'Non' },
          ];

          if (filters) {
            if (filters.search) {
              metadata.push({ propriete: 'Recherche', valeur: filters.search });
            }
            if (filters.status.length > 0) {
              metadata.push({ propriete: 'Statuts', valeur: filters.status.join(', ') });
            }
            if (filters.priority.length > 0) {
              metadata.push({ propriete: 'Priorités', valeur: filters.priority.join(', ') });
            }
            if (filters.dateFrom || filters.dateTo) {
              metadata.push({
                propriete: 'Période',
                valeur: `${filters.dateFrom || '...'} → ${filters.dateTo || '...'}`,
              });
            }
          }

          metadata.forEach(row => metadataSheet.addRow(row));
          metadataSheet.getRow(1).font = { bold: true };
        }

        // Télécharger le fichier
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        window.URL.revokeObjectURL(url);

        toast({
          title: '✅ Export Excel réussi',
          description: `${tasks.length} tâches exportées vers ${filename}`,
        });

        return true;
      } catch (error) {
        console.error('Erreur export Excel:', error);
        toast({
          title: '❌ Erreur export Excel',
          description: "Impossible d'exporter les tâches",
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsExporting(false);
      }
    },
    [prepareExportData, toast, isExporting]
  );

  /**
   * Export vers PDF (LAZY LOADED)
   */
  const exportToPDF = useCallback(
    async (tasks: Task[], options: ExportOptions = {}) => {
      if (isExporting) return false;

      setIsExporting(true);

      try {
        const {
          filename = `taches_${new Date().toISOString().split('T')[0]}.pdf`,
          includeMetadata = true,
          filters,
        } = options;

        // Charger jsPDF et autoTable dynamiquement (code splitting)
        toast({
          title: '⏳ Chargement...',
          description: "Préparation de l'export PDF",
        });

        const [jsPDFModule, autoTableModule] = await Promise.all([
          import('jspdf'),
          import('jspdf-autotable'),
        ]);

        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;

        // Créer le document PDF
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape pour plus de colonnes

        // Titre
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Export des Tâches', 14, 15);

        // Métadonnées
        if (includeMetadata) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          let yPos = 25;

          doc.text(`Date: ${new Date().toLocaleString('fr-FR')}`, 14, yPos);
          yPos += 5;
          doc.text(`Nombre de tâches: ${tasks.length}`, 14, yPos);
          yPos += 5;

          if (filters) {
            if (filters.search) {
              doc.text(`Recherche: "${filters.search}"`, 14, yPos);
              yPos += 5;
            }
            if (filters.status.length > 0) {
              doc.text(
                `Statuts: ${filters.status.map(s => STATUS_LABELS[s] || s).join(', ')}`,
                14,
                yPos
              );
              yPos += 5;
            }
            if (filters.priority.length > 0) {
              doc.text(
                `Priorités: ${filters.priority.map(p => PRIORITY_LABELS[p] || p).join(', ')}`,
                14,
                yPos
              );
              yPos += 5;
            }
          }

          yPos += 5;
        }

        // Préparer les données du tableau
        const tableData = tasks.map(task => [
          task.title.substring(0, 30) + (task.title.length > 30 ? '...' : ''),
          STATUS_LABELS[task.status] || task.status,
          PRIORITY_LABELS[task.priority] || task.priority,
          typeof task.assignee === 'string'
            ? task.assignee.substring(0, 15)
            : task.assignee?.full_name?.substring(0, 15) || 'N/A',
          task.project_name?.substring(0, 20) || 'Aucun',
          task.start_date || '',
          task.due_date || '',
          task.progress ? `${task.progress}%` : '0%',
        ]);

        // Créer le tableau avec autoTable
        autoTable(doc, {
          head: [['Titre', 'Statut', 'Priorité', 'Assigné', 'Projet', 'Début', 'Fin', 'Prog.']],
          body: tableData,
          startY: includeMetadata ? 50 : 25,
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          headStyles: {
            fillColor: [59, 130, 246], // Bleu
            textColor: 255,
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [245, 247, 250],
          },
          columnStyles: {
            0: { cellWidth: 60 }, // Titre
            1: { cellWidth: 20 }, // Statut
            2: { cellWidth: 20 }, // Priorité
            3: { cellWidth: 30 }, // Assigné
            4: { cellWidth: 40 }, // Projet
            5: { cellWidth: 22 }, // Début
            6: { cellWidth: 22 }, // Fin
            7: { cellWidth: 15 }, // Progression
          },
        });

        // Pied de page avec numéro de page
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.text(
            `Page ${i} / ${pageCount}`,
            doc.internal.pageSize.getWidth() / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }

        // Télécharger le PDF
        doc.save(filename);

        toast({
          title: '✅ Export PDF réussi',
          description: `${tasks.length} tâches exportées vers ${filename}`,
        });

        return true;
      } catch (error) {
        console.error('Erreur export PDF:', error);
        toast({
          title: '❌ Erreur export PDF',
          description: "Impossible d'exporter les tâches",
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsExporting(false);
      }
    },
    [toast, isExporting]
  );

  /**
   * Export CSV (léger, pas de lazy loading nécessaire)
   */
  const exportToCSV = useCallback(
    async (tasks: Task[], options: ExportOptions = {}) => {
      if (isExporting) return false;

      setIsExporting(true);

      try {
        const { filename = `taches_${new Date().toISOString().split('T')[0]}.csv` } = options;

        toast({
          title: '⏳ Chargement...',
          description: "Préparation de l'export CSV",
        });

        const exportData = prepareExportData(tasks);

        // Créer le CSV manuellement (pas besoin de librairie externe)
        const headers = Object.keys(exportData[0] || {});
        const csvRows = [
          // En-têtes
          headers.join(','),
          // Données
          ...exportData.map(row =>
            headers
              .map(header => {
                const value = (row as any)[header];
                // Échapper les virgules et guillemets
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              })
              .join(',')
          ),
        ];
        const csv = csvRows.join('\n');

        // Télécharger avec BOM UTF-8 pour Excel
        const bom = '\uFEFF';
        const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        URL.revokeObjectURL(link.href);

        toast({
          title: '✅ Export CSV réussi',
          description: `${tasks.length} tâches exportées vers ${filename}`,
        });

        return true;
      } catch (error) {
        console.error('Erreur export CSV:', error);
        toast({
          title: '❌ Erreur export CSV',
          description: "Impossible d'exporter les tâches",
          variant: 'destructive',
        });
        return false;
      } finally {
        setIsExporting(false);
      }
    },
    [prepareExportData, toast, isExporting]
  );

  return {
    exportToExcel,
    exportToPDF,
    exportToCSV,
    isExporting,
  };
};
