/**
 * 🏠 Dialog Demande Télétravail - Pattern Notion/Linear
 */

import { useState } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Home, CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const FREQUENCIES = [
  { value: 'one_time', label: 'Ponctuel (1 jour)' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'bi_weekly', label: 'Bi-hebdomadaire' },
  { value: 'monthly', label: 'Mensuel' },
];

interface RemoteWorkRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RemoteWorkRequestDialog({
  open,
  onOpenChange,
  onSuccess,
}: RemoteWorkRequestDialogProps) {
  const { createRemoteWorkRequest, loading } = useHRSelfService();

  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [frequency, setFrequency] = useState('one_time');
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !reason) {
      return;
    }

    await createRemoteWorkRequest({
      start_date: format(startDate, 'yyyy-MM-dd'),
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : format(startDate, 'yyyy-MM-dd'),
      frequency,
      reason,
    });

    // Reset form
    setStartDate(new Date());
    setEndDate(undefined);
    setFrequency('one_time');
    setReason('');

    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Demande de Télétravail
          </DialogTitle>
          <DialogDescription>
            Demandez l'autorisation de travailler à distance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Les demandes de télétravail doivent être soumises au moins 48h à l'avance.
            </AlertDescription>
          </Alert>

          {/* Fréquence */}
          <div className="space-y-2">
            <Label>Type de demande *</Label>
            <Select value={frequency} onValueChange={setFrequency} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date début */}
            <div className="space-y-2">
              <Label>Date de début *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? (
                      format(startDate, 'PPP', { locale: fr })
                    ) : (
                      <span>Sélectionner</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date fin */}
            {frequency !== 'one_time' && (
              <div className="space-y-2">
                <Label>Date de fin (optionnel)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? (
                        format(endDate, 'PPP', { locale: fr })
                      ) : (
                        <span>Indéterminée</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={fr}
                      disabled={(date) =>
                        startDate ? date < startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>

          {/* Raison */}
          <div className="space-y-2">
            <Label htmlFor="reason">Raison de la demande *</Label>
            <Textarea
              id="reason"
              placeholder="Expliquez pourquoi vous souhaitez travailler à distance..."
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Ex: Contraintes familiales, déménagement, réduction temps de trajet, etc.
            </p>
          </div>

          {/* Informations complémentaires */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-medium">Rappel des conditions :</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Connexion internet stable requise</li>
              <li>Disponibilité pendant les heures de travail</li>
              <li>Participation aux réunions en visio</li>
              <li>Respect des règles de sécurité des données</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !startDate || !reason}
            >
              {loading ? 'Envoi en cours...' : 'Soumettre la demande'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
