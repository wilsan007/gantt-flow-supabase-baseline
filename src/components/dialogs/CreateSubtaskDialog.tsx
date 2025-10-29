import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task , type Task } from '@/hooks/useTasksEnterprise';
import { useState } from 'react';

interface CreateSubtaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentTask: Task;
  onCreateSubtask: (data: {
    title: string;
    start_date: string;
    due_date: string;
    effort_estimate_h: number;
    linkedActionId?: string;
  }) => void;
  linkedActionId?: string;
}

export const CreateSubtaskDialog = ({ 
  open, 
  onOpenChange, 
  parentTask,
  onCreateSubtask,
  linkedActionId
}: CreateSubtaskDialogProps) => {
  const [title, setTitle] = useState(`Sous-tâche de ${parentTask.title}`);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(parentTask.start_date));
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date(parentTask.due_date));
  const [effortHours, setEffortHours] = useState<number>(1);

  const parentStartDate = new Date(parentTask.start_date);
  const parentDueDate = new Date(parentTask.due_date);

  const handleSubmit = () => {
    if (!title.trim() || !startDate || !dueDate) return;

    // Validation des dates
    if (startDate < parentStartDate || startDate > parentDueDate) {
      alert('La date de début doit être dans la période de la tâche principale');
      return;
    }
    
    if (dueDate < parentStartDate || dueDate > parentDueDate) {
      alert('La date de fin doit être dans la période de la tâche principale');
      return;
    }

    if (dueDate < startDate) {
      alert('La date de fin doit être après la date de début');
      return;
    }

    onCreateSubtask({
      title: title.trim(),
      start_date: startDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      effort_estimate_h: effortHours,
      linkedActionId
    });

    onOpenChange(false);
  };

  const handleCancel = () => {
    setTitle(`Sous-tâche de ${parentTask.title}`);
    setStartDate(new Date(parentTask.start_date));
    setDueDate(new Date(parentTask.due_date));
    setEffortHours(1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer une sous-tâche</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Tâche principale : {parentTask.title}
            <br />
            Période autorisée : {format(parentStartDate, 'dd/MM/yyyy')} - {format(parentDueDate, 'dd/MM/yyyy')}
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre de la sous-tâche</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom de la sous-tâche"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy') : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => 
                      date < parentStartDate || date > parentDueDate
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'dd/MM/yyyy') : <span>Choisir une date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    disabled={(date) => 
                      date < parentStartDate || date > parentDueDate || (startDate && date < startDate)
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="effort">Effort estimé (heures)</Label>
            <Input
              id="effort"
              type="number"
              min="0.5"
              step="0.5"
              value={effortHours}
              onChange={(e) => setEffortHours(parseFloat(e.target.value) || 1)}
              placeholder="Heures"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!title.trim() || !startDate || !dueDate}
          >
            Créer la sous-tâche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};