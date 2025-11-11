/**
 * 🏥 Dialog Justificatif d'Absence - Pattern BambooHR
 */

import { useState } from 'react';
import { useHRSelfService } from '@/hooks/useHRSelfService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileUp, CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ABSENCE_TYPES = [
  { value: 'sick_leave', label: 'Arrêt maladie' },
  { value: 'medical_appointment', label: 'Rendez-vous médical' },
  { value: 'family_emergency', label: 'Urgence familiale' },
  { value: 'personal_leave', label: 'Congé personnel' },
  { value: 'other', label: 'Autre' },
];

interface AbsenceJustificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function AbsenceJustificationDialogBase({
  open,
  onOpenChange,
  onSuccess,
}: AbsenceJustificationDialogProps) {
  const { createAbsenceJustification, loading } = useHRSelfService();

  const [absenceDate, setAbsenceDate] = useState<Date | undefined>(new Date());
  const [absenceType, setAbsenceType] = useState('');
  const [reason, setReason] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!absenceDate || !absenceType || !reason) {
      return;
    }

    await createAbsenceJustification({
      absence_date: format(absenceDate, 'yyyy-MM-dd'),
      absence_type: absenceType,
      reason,
      document_url: documentUrl || null,
    });

    // Reset form
    setAbsenceDate(new Date());
    setAbsenceType('');
    setReason('');
    setDocumentUrl('');

    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Justifier une Absence
          </DialogTitle>
          <DialogDescription>
            Soumettez un justificatif pour votre absence (certificat médical, etc.)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Les justificatifs d'absence doivent être soumis dans les 48h suivant l'absence.
            </AlertDescription>
          </Alert>

          {/* Date d'absence */}
          <div className="space-y-2">
            <Label>Date de l'absence *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !absenceDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {absenceDate ? (
                    format(absenceDate, 'PPP', { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={absenceDate}
                  onSelect={setAbsenceDate}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Type d'absence */}
          <div className="space-y-2">
            <Label>Type d'absence *</Label>
            <Select value={absenceType} onValueChange={setAbsenceType} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {ABSENCE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Raison */}
          <div className="space-y-2">
            <Label htmlFor="reason">Raison / Détails *</Label>
            <Textarea
              id="reason"
              placeholder="Expliquez brièvement la raison de votre absence..."
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              required
            />
          </div>

          {/* Document justificatif */}
          <div className="space-y-2">
            <Label htmlFor="document">
              Document justificatif (URL)
              {absenceType === 'sick_leave' && <span className="text-red-500"> *</span>}
            </Label>
            <div className="flex gap-2">
              <Input
                id="document"
                type="url"
                placeholder="https://... (certificat médical, justificatif...)"
                value={documentUrl}
                onChange={e => setDocumentUrl(e.target.value)}
                required={absenceType === 'sick_leave'}
              />
              <Button type="button" variant="outline" size="icon">
                <FileUp className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {absenceType === 'sick_leave'
                ? 'Certificat médical obligatoire pour arrêt maladie'
                : 'Téléchargez ou collez le lien du justificatif'}
            </p>
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
            <Button type="submit" disabled={loading || !absenceDate || !absenceType || !reason}>
              {loading ? 'Envoi en cours...' : 'Soumettre le justificatif'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
// 🎨 Export avec support mobile automatique + thème Hr
export const AbsenceJustificationDialog = withUniversalDialog('hr', AbsenceJustificationDialogBase);
