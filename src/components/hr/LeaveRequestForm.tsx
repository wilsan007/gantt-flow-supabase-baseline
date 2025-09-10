import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CalendarDays } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useHR } from '@/hooks/useHR';
import { useToast } from '@/hooks/use-toast';

const leaveRequestSchema = z.object({
  absence_type_id: z.string().min(1, 'Type d\'absence requis'),
  start_date: z.string().min(1, 'Date de début requise'),
  end_date: z.string().min(1, 'Date de fin requise'),
  reason: z.string().optional(),
});

type LeaveRequestForm = z.infer<typeof leaveRequestSchema>;

export const LeaveRequestForm = () => {
  const [open, setOpen] = useState(false);
  const { absenceTypes, createLeaveRequest } = useHR();
  const { toast } = useToast();
  
  const form = useForm<LeaveRequestForm>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      absence_type_id: '',
      start_date: '',
      end_date: '',
      reason: '',
    } as LeaveRequestForm,
  });

  const onSubmit = async (values: LeaveRequestForm) => {
    try {
      // S'assurer que tous les champs requis sont présents
      if (!values.absence_type_id || !values.start_date || !values.end_date) {
        throw new Error('Tous les champs requis doivent être remplis');
      }
      
      await createLeaveRequest({
        absence_type_id: values.absence_type_id,
        start_date: values.start_date,
        end_date: values.end_date,
        reason: values.reason || undefined
      });
      
      toast({
        title: "Demande créée",
        description: "Votre demande de congé a été soumise avec succès.",
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la demande. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          Demander un congé
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de congé</DialogTitle>
          <DialogDescription>
            Remplissez les informations pour votre demande de congé.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="absence_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type d'absence</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {absenceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: type.color }}
                            />
                            {type.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motif (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Précisez le motif de votre demande..."
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Création...' : 'Créer la demande'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};