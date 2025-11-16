import React, { useState, useRef, useEffect } from 'react';
import { TableCell } from '@/components/ui/table';
import { Calendar } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/taskHelpers';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface EditableDateCellProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isSubtask?: boolean;
}

export const EditableDateCell = ({
  value,
  onChange,
  className = '',
  isSubtask = false,
}: EditableDateCellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value ? new Date(value) : undefined
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const formattedDate = format(date, 'yyyy-MM-dd');
      onChange(formattedDate);
      setIsOpen(false);
    }
  };

  return (
    <TableCell
      className={cn('group cursor-pointer', isSubtask ? 'py-0 text-xs' : 'py-0', className)}
      style={{ height: isSubtask ? '51px' : '64px' }}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            onClick={e => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
              isOpen && 'bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950'
            )}
          >
            <Calendar className={`${isSubtask ? 'h-3 w-3' : 'h-4 w-4'} text-foreground/60`} />
            <span className={cn(isSubtask && 'text-xs', 'text-foreground')}>
              {value ? formatDate(value) : 'Sélectionner date'}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </TableCell>
  );
};
