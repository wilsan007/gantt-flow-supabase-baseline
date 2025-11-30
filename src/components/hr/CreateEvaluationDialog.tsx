import { useState } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
} from '@/components/ui/responsive-modal';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Star } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { Evaluation } from '@/hooks/usePerformance';

interface CreateEvaluationDialogProps {
  onCreateEvaluation: (evaluation: Omit<Evaluation, 'id' | 'created_at' | 'updated_at'>) => void;
  trigger?: React.ReactNode;
}

interface EvaluationFormData {
  employee_name: string;
  evaluator_name: string;
  period: string;
  type: 'annual' | 'quarterly' | '360';
  status: 'scheduled' | 'in_progress';
  overall_score: number;
}

export const CreateEvaluationDialog = ({
  onCreateEvaluation,
  trigger,
}: CreateEvaluationDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { employees } = useEmployees();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EvaluationFormData>({
    defaultValues: {
      status: 'scheduled',
      type: 'quarterly',
      overall_score: 0,
    },
  });

  const selectedType = watch('type');

  const onSubmit = (data: EvaluationFormData) => {
    const employee = employees.find(emp => emp.full_name === data.employee_name);
    const evaluator = employees.find(emp => emp.full_name === data.evaluator_name);

    onCreateEvaluation({
      ...data,
      employee_id: employee?.user_id || undefined,
      evaluator_id: evaluator?.user_id || undefined,
    });

    setIsOpen(false);
    reset();
  };

  // Générer automatiquement la période basée sur le type
  const generatePeriod = (type: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);

    switch (type) {
      case 'annual':
        return year.toString();
      case 'quarterly':
        return `Q${quarter} ${year}`;
      case '360':
        return `360° ${year}`;
      default:
        return '';
    }
  };

  const handleTypeChange = (type: string) => {
    setValue('type', type as 'annual' | 'quarterly' | '360');
    const period = generatePeriod(type);
    setValue('period', period);
  };

  return (
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <ResponsiveModalTrigger asChild>
        {trigger || (
          <Button>
            <Star className="mr-2 h-4 w-4" />
            Nouvelle évaluation
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent className="sm:max-w-[600px]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Créer une nouvelle évaluation</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_name">Employé évalué *</Label>
                <Select onValueChange={value => setValue('employee_name', value)}>
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
                <Label htmlFor="evaluator_name">Évaluateur *</Label>
                <Select onValueChange={value => setValue('evaluator_name', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un évaluateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.full_name}>
                        {employee.full_name} {employee.job_title && `(${employee.job_title})`}
                      </SelectItem>
                    ))}
                    <SelectItem value="Direction RH">Direction RH</SelectItem>
                    <SelectItem value="Direction Générale">Direction Générale</SelectItem>
                  </SelectContent>
                </Select>
                {errors.evaluator_name && (
                  <p className="text-sm text-red-500">{errors.evaluator_name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type d'évaluation *</Label>
                <Select onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type d'évaluation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarterly">Trimestrielle</SelectItem>
                    <SelectItem value="annual">Annuelle</SelectItem>
                    <SelectItem value="360">Évaluation 360°</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="period">Période *</Label>
                <Input
                  id="period"
                  {...register('period', { required: 'La période est obligatoire' })}
                  placeholder="Ex: Q1 2024"
                  value={watch('period')}
                />
                {errors.period && <p className="text-sm text-red-500">{errors.period.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Statut initial</Label>
                <Select
                  onValueChange={value => setValue('status', value as 'scheduled' | 'in_progress')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Planifiée</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedType === '360' && (
                <div className="space-y-2">
                  <Label htmlFor="overall_score">Score initial (optionnel)</Label>
                  <Input
                    id="overall_score"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    {...register('overall_score', { min: 0, max: 5 })}
                    placeholder="0.0"
                  />
                </div>
              )}
            </div>

            <div className="bg-muted rounded-lg p-4">
              <h4 className="mb-2 font-medium">Information</h4>
              <p className="text-muted-foreground text-sm">
                {selectedType === 'annual' &&
                  "L'évaluation annuelle permet un bilan complet des performances sur l'année."}
                {selectedType === 'quarterly' &&
                  "L'évaluation trimestrielle offre un suivi régulier des objectifs."}
                {selectedType === '360' &&
                  "L'évaluation 360° implique plusieurs évaluateurs pour une vision complète."}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer l'évaluation</Button>
            </div>
          </form>
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
