import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { withUniversalDialog } from '@/components/ui/universal-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Plus } from '@/lib/icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ActionCreationDialogProps {
  onCreateAction: (actionData: {
    title: string;
    weight_percentage: number;
    due_date?: string;
    notes?: string;
  }) => void;
  selectedTaskId?: string;
}

const ActionCreationDialogBase = ({
  onCreateAction,
  selectedTaskId,
}: ActionCreationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [weight, setWeight] = useState([20]);
  const [dueDate, setDueDate] = useState<Date>();
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;

    onCreateAction({
      title: title.trim(),
      weight_percentage: weight[0],
      due_date: dueDate?.toISOString(),
      notes: notes.trim() || undefined,
    });

    // Reset form
    setTitle('');
    setWeight([20]);
    setDueDate(undefined);
    setNotes('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          disabled={!selectedTaskId}
          title={!selectedTaskId ? "Sélectionnez d'abord une tâche" : 'Créer une action détaillée'}
        >
          <Plus className="mr-2 h-4 w-4" />
          Action Détaillée
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Créer une Nouvelle Action</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Titre */}
          <div className="grid gap-2">
            <Label htmlFor="title">Titre de l'action *</Label>
            <Input
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Révision du code..."
              maxLength={40}
            />
            <p className="text-xs text-muted-foreground">
              {title.length}/40 caractères (max 2 lignes : 0-20, 21-40)
            </p>
          </div>

          {/* Poids */}
          <div className="grid gap-2">
            <Label>Poids de l'action: {weight[0]}%</Label>
            <Slider
              value={weight}
              onValueChange={setWeight}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Date d'échéance */}
          <div className="grid gap-2">
            <Label>Date d'échéance (optionnelle)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, 'PPP', { locale: fr }) : 'Sélectionner une date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optionnelles)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Détails supplémentaires, instructions..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim()}>
            Créer l'Action
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
// 🎨 Export avec support mobile automatique + thème Tasks
export const ActionCreationDialog = withUniversalDialog('tasks', ActionCreationDialogBase);
