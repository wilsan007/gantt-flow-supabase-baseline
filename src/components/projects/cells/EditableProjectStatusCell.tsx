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

interface EditableProjectStatusCellProps {
  value: string;
  onChange: (value: string) => Promise<void> | void;
  readOnly?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planification', color: 'bg-gray-500' },
  { value: 'active', label: 'En cours', color: 'bg-blue-500' },
  { value: 'on_hold', label: 'En pause', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Terminé', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Annulé', color: 'bg-red-500' },
];

export const EditableProjectStatusCell: React.FC<EditableProjectStatusCellProps> = ({
  value,
  onChange,
  readOnly = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const currentStatus = STATUS_OPTIONS.find(s => s.value === value) || STATUS_OPTIONS[0];

  const handleChange = async (newValue: string) => {
    if (newValue === value) return;

    setIsLoading(true);
    try {
      await onChange(newValue);
    } catch (error) {
      console.error('Erreur changement statut projet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (readOnly) {
    return (
      <TableCell className="py-2">
        <Badge className={cn('cursor-not-allowed opacity-60', currentStatus.color)}>
          {currentStatus.label}
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
              'flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-white transition-colors hover:opacity-80',
              currentStatus.color
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                {currentStatus.label}
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {STATUS_OPTIONS.map(status => (
            <DropdownMenuItem
              key={status.value}
              onClick={() => handleChange(status.value)}
              className="flex items-center gap-2"
            >
              <div className={cn('h-3 w-3 rounded-full', status.color)} />
              {status.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  );
};
