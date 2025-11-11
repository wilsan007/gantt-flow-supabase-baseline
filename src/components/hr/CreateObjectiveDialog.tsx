import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useForm } from 'react-hook-form';
import { Target } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { Objective } from '@/hooks/usePerformance';

interface CreateObjectiveDialogProps {
  onCreateObjective: (objective: Omit<Objective, 'id' | 'created_at' | 'updated_at'>) => void;
  trigger?: React.ReactNode;
}

interface ObjectiveFormData {
  title: string;
  description: string;
  employee_name: string;
  department: string;
  type: 'individual' | 'team' | 'okr';
  due_date: string;
  progress: number;
  status: 'draft' | 'active';
}

const CreateObjectiveDialogBase = ({ onCreateObjective, trigger }: CreateObjectiveDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { employees, departments } = useEmployees();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ObjectiveFormData>({
    defaultValues: {
      progress: 0,
      status: 'draft',
      type: 'individual',
    },
  });

  const selectedEmployeeName = watch('employee_name');
  const selectedEmployee = employees.find(emp => emp.full_name === selectedEmployeeName);

  const onSubmit = (data: ObjectiveFormData) => {
    const employee = employees.find(emp => emp.full_name === data.employee_name);

    onCreateObjective({
      ...data,
      employee_id: employee?.user_id || undefined,
      department: employee?.job_title || data.department || 'Non spécifié',
    });

    setIsOpen(false);
    reset();
  };

  const handleEmployeeChange = (employeeName: string) => {
    setValue('employee_name', employeeName);
    const employee = employees.find(emp => emp.full_name === employeeName);
    if (employee?.job_title) {
      setValue('department', employee.job_title);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Target className="mr-2 h-4 w-4" />
            Nouvel objectif
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Créer un nouvel objectif</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'objectif *</Label>
              <Input
                id="title"
                {...register('title', { required: 'Le titre est obligatoire' })}
                placeholder="Ex: Améliorer la satisfaction client"
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type d'objectif</Label>
              <Select
                onValueChange={value => setValue('type', value as 'individual' | 'team' | 'okr')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individuel</SelectItem>
                  <SelectItem value="team">Équipe</SelectItem>
                  <SelectItem value="okr">OKR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Décrivez l'objectif en détail..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_name">Employé *</Label>
              <Select onValueChange={handleEmployeeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
                    <SelectItem key={employee.id} value={employee.full_name}>
                      {employee.full_name} {employee.job_title && `(${employee.job_title})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employee_name && (
                <p className="text-sm text-red-500">{errors.employee_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Département</Label>
              <Input
                id="department"
                {...register('department')}
                value={selectedEmployee?.job_title || watch('department') || ''}
                placeholder="Département"
                readOnly={!!selectedEmployee?.job_title}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Date d'échéance *</Label>
              <Input
                id="due_date"
                type="date"
                {...register('due_date', { required: "La date d'échéance est obligatoire" })}
              />
              {errors.due_date && <p className="text-sm text-red-500">{errors.due_date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut initial</Label>
              <Select onValueChange={value => setValue('status', value as 'draft' | 'active')}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Brouillon</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">Créer l'objectif</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
// 🎨 Export avec support mobile automatique + thème Hr
export const CreateObjectiveDialog = withUniversalDialog('hr', CreateObjectiveDialogBase);
