/**
 * Absence Calendar - Calendrier visuel des absences
 * Pattern: BambooHR/Factorial - Vue mensuelle épurée
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Absence {
  id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  type?: string;
}

interface AbsenceCalendarProps {
  absences: Absence[];
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
}

export const AbsenceCalendar: React.FC<AbsenceCalendarProps> = ({
  absences,
  currentMonth = new Date(),
  onMonthChange,
}) => {
  const [displayMonth, setDisplayMonth] = React.useState(currentMonth);

  // Générer les jours du mois
  const daysInMonth = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      absences: Absence[];
    }> = [];

    // Jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        absences: [],
      });
    }

    // Jours du mois actuel
    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filtrer les absences pour ce jour
      const dayAbsences = absences.filter((absence) => {
        const start = new Date(absence.start_date).toISOString().split('T')[0];
        const end = new Date(absence.end_date).toISOString().split('T')[0];
        return dateStr >= start && dateStr <= end && absence.status === 'approved';
      });

      days.push({
        date,
        isCurrentMonth: true,
        absences: dayAbsences,
      });
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length; // 6 semaines de 7 jours
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        absences: [],
      });
    }

    return days;
  }, [displayMonth, absences]);

  const handlePrevMonth = () => {
    const newDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1);
    setDisplayMonth(newDate);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1);
    setDisplayMonth(newDate);
    onMonthChange?.(newDate);
  };

  const monthName = displayMonth.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <Card className="modern-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium capitalize">
            {monthName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille des jours */}
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map((day, index) => {
            const isToday =
              day.date.toDateString() === new Date().toDateString();
            const hasAbsences = day.absences.length > 0;

            return (
              <div
                key={index}
                className={cn(
                  'relative min-h-[60px] p-2 rounded-lg border transition-colors',
                  day.isCurrentMonth
                    ? 'bg-background border-border'
                    : 'bg-muted/30 border-transparent',
                  isToday && 'ring-2 ring-primary',
                  hasAbsences && 'bg-red-50 border-red-200',
                  !day.isCurrentMonth && 'opacity-40'
                )}
              >
                <div
                  className={cn(
                    'text-xs font-medium mb-1',
                    isToday ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {day.date.getDate()}
                </div>
                {hasAbsences && (
                  <div className="space-y-1">
                    {day.absences.slice(0, 2).map((absence) => (
                      <div
                        key={absence.id}
                        className="text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded truncate"
                        title={absence.employee_name}
                      >
                        {absence.employee_name.split(' ')[0]}
                      </div>
                    ))}
                    {day.absences.length > 2 && (
                      <div className="text-[10px] text-muted-foreground">
                        +{day.absences.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-50 border border-red-200"></div>
            <span>Absences</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded ring-2 ring-primary"></div>
            <span>Aujourd'hui</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
