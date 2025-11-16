import React, { useState } from 'react';
import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Option {
  value: string;
  label: string;
  color?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

interface EditableSelectCellProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
  isSubtask?: boolean;
  getColorClass?: (value: string) => string;
}

export const EditableSelectCell = ({
  value,
  options,
  onChange,
  className = '',
  isSubtask = false,
  getColorClass,
}: EditableSelectCellProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);
  const colorClass = getColorClass ? getColorClass(value) : '';

  const handleSelect = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <TableCell
      className={cn('group cursor-pointer', isSubtask ? 'py-0 text-xs' : 'py-0', className)}
      style={{ height: isSubtask ? '51px' : '64px' }}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <div
            onClick={e => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            className={cn(
              'inline-flex cursor-pointer items-center rounded transition-opacity hover:opacity-80',
              isOpen && 'ring-2 ring-blue-500'
            )}
          >
            <Badge
              variant={selectedOption?.variant || 'outline'}
              className={cn(colorClass, isSubtask && 'px-2 py-0.5 text-xs', 'hover:opacity-100')}
            >
              {selectedOption?.label || value}
            </Badge>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {options.map(option => (
            <DropdownMenuItem
              key={option.value}
              onClick={e => handleSelect(option.value, e)}
              className="cursor-pointer"
            >
              <Badge
                variant={option.variant || 'outline'}
                className={cn(
                  getColorClass ? getColorClass(option.value) : '',
                  'w-full justify-center'
                )}
              >
                {option.label}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  );
};
