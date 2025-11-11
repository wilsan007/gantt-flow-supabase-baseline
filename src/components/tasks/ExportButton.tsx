/**
 * 🎯 ExportButton - Bouton d'Export Multi-Format
 * Pattern: Notion, Linear, Airtable
 *
 * Fonctionnalités:
 * - Menu déroulant avec 3 formats (Excel, PDF, CSV)
 * - Icônes distinctives par format
 * - Export des tâches filtrées uniquement
 * - Feedback visuel (toast)
 */

import { Download, FileSpreadsheet, FileText, FileDown } from '@/lib/icons';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Task } from '@/hooks/optimized';
import { useTaskExport } from '@/hooks/useTaskExport';
import { TaskFilters } from './AdvancedFilters';

interface ExportButtonProps {
  tasks: Task[];
  filters?: TaskFilters;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ExportButton = ({
  tasks,
  filters,
  variant = 'outline',
  size = 'default',
  className = '',
}: ExportButtonProps) => {
  const { exportToExcel, exportToPDF, exportToCSV, isExporting } = useTaskExport();

  const handleExport = (format: 'excel' | 'pdf' | 'csv') => {
    const options = {
      includeMetadata: true,
      filters,
    };

    switch (format) {
      case 'excel':
        exportToExcel(tasks, options);
        break;
      case 'pdf':
        exportToPDF(tasks, options);
        break;
      case 'csv':
        exportToCSV(tasks, options);
        break;
    }
  };

  const tasksCount = tasks.length;
  const isDisabled = tasksCount === 0 || isExporting;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={isDisabled} className={className}>
          <Download className={`mr-2 h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
          {isExporting ? 'Export...' : 'Exporter'}
          {tasksCount > 0 && !isExporting && (
            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs">{tasksCount}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Format d'export
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleExport('excel')} className="cursor-pointer">
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          <div className="flex flex-col">
            <span className="font-medium">Excel (.xlsx)</span>
            <span className="text-xs text-muted-foreground">Tableau formaté avec métadonnées</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4 text-red-600" />
          <div className="flex flex-col">
            <span className="font-medium">PDF (.pdf)</span>
            <span className="text-xs text-muted-foreground">Document imprimable professionnel</span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
          <FileDown className="mr-2 h-4 w-4 text-blue-600" />
          <div className="flex flex-col">
            <span className="font-medium">CSV (.csv)</span>
            <span className="text-xs text-muted-foreground">Format universel compatible</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
