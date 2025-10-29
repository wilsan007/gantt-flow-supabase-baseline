/**
 * Composant: ScheduleForm
 * Formulaire de configuration de planification RRULE
 * Utilisé dans ActivityForm (onglet 2)
 */

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Info } from 'lucide-react';
import { format, addDays, addWeeks, addMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { OperationalSchedule } from '@/hooks/useOperationalSchedules';

interface ScheduleFormProps {
  value: Partial<OperationalSchedule>;
  onChange: (schedule: Partial<OperationalSchedule>) => void;
  activityId?: string;
}

type FrequencyType = 'daily' | 'weekly' | 'monthly';

const WEEK_DAYS = [
  { value: 'MO', label: 'Lun', fullLabel: 'Lundi' },
  { value: 'TU', label: 'Mar', fullLabel: 'Mardi' },
  { value: 'WE', label: 'Mer', fullLabel: 'Mercredi' },
  { value: 'TH', label: 'Jeu', fullLabel: 'Jeudi' },
  { value: 'FR', label: 'Ven', fullLabel: 'Vendredi' },
  { value: 'SA', label: 'Sam', fullLabel: 'Samedi' },
  { value: 'SU', label: 'Dim', fullLabel: 'Dimanche' },
];

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ value, onChange, activityId }) => {
  // États locaux
  const [frequency, setFrequency] = useState<FrequencyType>('weekly');
  const [weekDays, setWeekDays] = useState<string[]>(['MO']);
  const [monthDays, setMonthDays] = useState<string>('1');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [windowDays, setWindowDays] = useState<number>(30);

  // Parser RRULE existante
  useEffect(() => {
    if (value.rrule) {
      const rrule = value.rrule;
      
      if (rrule.startsWith('FREQ=DAILY')) {
        setFrequency('daily');
      } else if (rrule.startsWith('FREQ=WEEKLY')) {
        setFrequency('weekly');
        const match = rrule.match(/BYDAY=([A-Z,]+)/);
        if (match) {
          setWeekDays(match[1].split(','));
        }
      } else if (rrule.startsWith('FREQ=MONTHLY')) {
        setFrequency('monthly');
        const match = rrule.match(/BYMONTHDAY=([0-9,]+)/);
        if (match) {
          setMonthDays(match[1]);
        }
      }
    }

    if (value.start_date) {
      setStartDate(new Date(value.start_date));
    }
    if (value.until) {
      setEndDate(new Date(value.until));
    }
    if (value.generate_window_days) {
      setWindowDays(value.generate_window_days);
    }
  }, [value]);

  // Générer RRULE
  const generateRRule = (): string | null => {
    switch (frequency) {
      case 'daily':
        return 'FREQ=DAILY';
      case 'weekly':
        return weekDays.length > 0 ? `FREQ=WEEKLY;BYDAY=${weekDays.join(',')}` : null;
      case 'monthly':
        return monthDays.trim() ? `FREQ=MONTHLY;BYMONTHDAY=${monthDays}` : null;
      default:
        return null;
    }
  };

  // Générer preview des prochaines occurrences
  const generatePreview = (): Date[] => {
    const occurrences: Date[] = [];
    const maxOccurrences = 5;
    let currentDate = new Date(startDate);
    const endLimit = endDate || addMonths(startDate, 3);

    switch (frequency) {
      case 'daily':
        for (let i = 0; i < maxOccurrences && currentDate <= endLimit; i++) {
          occurrences.push(new Date(currentDate));
          currentDate = addDays(currentDate, 1);
        }
        break;

      case 'weekly':
        const targetDays = weekDays.map(d => WEEK_DAYS.findIndex(wd => wd.value === d));
        let attempts = 0;
        while (occurrences.length < maxOccurrences && attempts < 100) {
          const dayOfWeek = currentDate.getDay();
          const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajuster dimanche
          if (targetDays.includes(adjustedDay)) {
            occurrences.push(new Date(currentDate));
          }
          currentDate = addDays(currentDate, 1);
          attempts++;
        }
        break;

      case 'monthly':
        const days = monthDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
        let monthsChecked = 0;
        while (occurrences.length < maxOccurrences && monthsChecked < 12) {
          for (const day of days) {
            const testDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            if (testDate >= startDate && testDate <= endLimit) {
              occurrences.push(testDate);
              if (occurrences.length >= maxOccurrences) break;
            }
          }
          currentDate = addMonths(currentDate, 1);
          monthsChecked++;
        }
        break;
    }

    return occurrences.slice(0, maxOccurrences);
  };

  // Mettre à jour le parent
  useEffect(() => {
    onChange({
      activity_id: activityId,
      rrule: generateRRule(),
      start_date: format(startDate, 'yyyy-MM-dd'),
      until: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      timezone: 'Africa/Djibouti',
      generate_window_days: windowDays,
    });
  }, [frequency, weekDays, monthDays, startDate, endDate, windowDays]);

  const handleWeekDayToggle = (day: string, checked: boolean) => {
    if (checked) {
      setWeekDays([...weekDays, day]);
    } else {
      setWeekDays(weekDays.filter(d => d !== day));
    }
  };

  const preview = generatePreview();

  return (
    <div className="space-y-6">
      {/* Fréquence */}
      <div className="space-y-2">
        <Label>Fréquence de récurrence</Label>
        <Select value={frequency} onValueChange={(value: FrequencyType) => setFrequency(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Quotidien (tous les jours)</SelectItem>
            <SelectItem value="weekly">Hebdomadaire (jours spécifiques)</SelectItem>
            <SelectItem value="monthly">Mensuel (dates spécifiques)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Configuration Hebdomadaire */}
      {frequency === 'weekly' && (
        <div className="space-y-3">
          <Label>Jours de la semaine</Label>
          <div className="grid grid-cols-7 gap-2">
            {WEEK_DAYS.map((day) => (
              <div key={day.value} className="flex flex-col items-center">
                <Checkbox
                  id={`day-${day.value}`}
                  checked={weekDays.includes(day.value)}
                  onCheckedChange={(checked) => handleWeekDayToggle(day.value, checked as boolean)}
                />
                <Label
                  htmlFor={`day-${day.value}`}
                  className="text-xs cursor-pointer mt-1"
                  title={day.fullLabel}
                >
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
          {weekDays.length === 0 && (
            <p className="text-sm text-destructive">⚠️ Sélectionnez au moins un jour</p>
          )}
        </div>
      )}

      {/* Configuration Mensuelle */}
      {frequency === 'monthly' && (
        <div className="space-y-2">
          <Label htmlFor="monthDays">Jours du mois (séparés par des virgules)</Label>
          <Input
            id="monthDays"
            value={monthDays}
            onChange={(e) => setMonthDays(e.target.value)}
            placeholder="Ex: 1,15,30"
          />
          <p className="text-xs text-muted-foreground">
            Entrez les numéros des jours (1-31) séparés par des virgules
          </p>
        </div>
      )}

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date de début *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(startDate, 'PP', { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={(date) => date && setStartDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Date de fin (optionnel)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PP', { locale: fr }) : 'Aucune'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Fenêtre de génération */}
      <div className="space-y-2">
        <Label htmlFor="windowDays">Fenêtre de génération (jours)</Label>
        <Input
          id="windowDays"
          type="number"
          min="1"
          max="365"
          value={windowDays}
          onChange={(e) => setWindowDays(parseInt(e.target.value) || 30)}
        />
        <p className="text-xs text-muted-foreground">
          Les tâches seront générées jusqu'à {windowDays} jours à l'avance
        </p>
      </div>

      {/* Aperçu RRULE */}
      <div className="bg-muted p-4 rounded-lg space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Règle de récurrence (RRULE)</span>
        </div>
        <code className="text-xs block bg-background p-2 rounded">
          {generateRRule() || 'Aucune règle définie'}
        </code>
      </div>

      {/* Preview des occurrences */}
      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          📅 Aperçu des 5 prochaines occurrences
        </h4>
        {preview.length > 0 ? (
          <ul className="space-y-1">
            {preview.map((date, index) => (
              <li key={index} className="text-sm text-blue-700 dark:text-blue-300">
                {index + 1}. {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Aucune occurrence à afficher (vérifiez la configuration)
          </p>
        )}
      </div>
    </div>
  );
};
