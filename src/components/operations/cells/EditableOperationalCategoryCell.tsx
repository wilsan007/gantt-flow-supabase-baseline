import React, { useState } from 'react';
import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditableOperationalCategoryCellProps {
  value: string;
  onChange: (value: string) => Promise<void> | void;
  readOnly?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-500' },
  { value: 'inspection', label: 'Inspection', color: 'bg-blue-500' },
  { value: 'reporting', label: 'Reporting', color: 'bg-purple-500' },
  { value: 'communication', label: 'Communication', color: 'bg-cyan-500' },
  { value: 'administrative', label: 'Administratif', color: 'bg-gray-500' },
  { value: 'training', label: 'Formation', color: 'bg-green-500' },
  { value: 'meeting', label: 'Réunion', color: 'bg-yellow-500' },
  { value: 'other', label: 'Autre', color: 'bg-slate-500' },
];

export const EditableOperationalCategoryCell: React.FC<EditableOperationalCategoryCellProps> = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const currentCategory = CATEGORY_OPTIONS.find(c => c.value === value) || CATEGORY_OPTIONS[7];

  const handleChange = async (newValue: string) => {
    if (newValue === value) return;

    setIsLoading(true);
    try {
      await onChange(newValue);
    } catch (error) {
      console.error('Erreur changement catégorie:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (readOnly) {
    return (
      <TableCell className="py-2">
        <Badge variant="outline" className={cn('cursor-not-allowed opacity-60')}>
          {currentCategory.label}
        </Badge>
      </TableCell>
    );
  }

  return (
    <TableCell className="py-2" onClick={e => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'hover:bg-accent flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium transition-colors'
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <div className={cn('h-2 w-2 rounded-full', currentCategory.color)} />
                {currentCategory.label}
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {CATEGORY_OPTIONS.map(category => (
            <DropdownMenuItem
              key={category.value}
              onClick={() => handleChange(category.value)}
              className="flex items-center gap-2"
            >
              <div className={cn('h-3 w-3 rounded-full', category.color)} />
              {category.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  );
};
