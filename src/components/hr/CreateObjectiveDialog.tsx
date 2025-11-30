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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { Plus, Target } from 'lucide-react';
import { useEmployees } from '@/hooks/useEmployees';
import { Objective } from '@/hooks/usePerformance';

interface CreateObjectiveDialogProps {
  onCreateObjective: (objective: Omit<Objective, 'id' | 'created_at' | 'updated_at'>) => void;
  trigger?: React.ReactNode;
  objectiveTemplates?: any[];
  onCreateTemplate?: (data: {
    title: string;
    category: string;
    description?: string;
  }) => Promise<void>;
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

export const CreateObjectiveDialog = ({
  onCreateObjective,
  trigger,
  objectiveTemplates = [],
  onCreateTemplate,
}: CreateObjectiveDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateData, setNewTemplateData] = useState({
    title: '',
    category: '',
    description: '',
  });
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
      employee_id: employee?.user_id || '',
      title: data.title,
      description: data.description,
      target_date: data.due_date,
      status: data.status,
      progress: data.progress,
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
    <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
      <ResponsiveModalTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Target className="mr-2 h-4 w-4" />
            Nouvel objectif
          </Button>
        )}
      </ResponsiveModalTrigger>
      <ResponsiveModalContent className="sm:max-w-[600px]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Créer un nouvel objectif</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {objectiveTemplates.length > 0 && !isCreatingTemplate && (
              <div className="bg-muted/20 space-y-2 rounded-lg border p-3">
                <Label htmlFor="template">Modèle d'objectif (Optionnel)</Label>
                <Select
                  onValueChange={value => {
                    if (value === 'new_template') {
                      setIsCreatingTemplate(true);
                      return;
                    }
                    const template = objectiveTemplates.find(t => t.id === value);
                    if (template) {
                      setValue('title', template.title);
                      setValue('description', template.description || '');
                      setValue('type', 'okr');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un modèle..." />
                  </SelectTrigger>
                  <SelectContent>
                    {objectiveTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title} ({template.category})
                      </SelectItem>
                    ))}
                    <SelectItem
                      value="new_template"
                      className="text-primary mt-1 border-t pt-1 font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Créer un nouveau modèle d'OKR
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {isCreatingTemplate && (
              <div className="bg-primary/5 border-primary/20 space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-primary font-medium">Nouveau modèle d'OKR</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCreatingTemplate(false)}
                    className="h-6 px-2"
                  >
                    Annuler
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template_title">Titre du modèle</Label>
                  <Input
                    id="template_title"
                    value={newTemplateData.title}
                    onChange={e =>
                      setNewTemplateData({ ...newTemplateData, title: e.target.value })
                    }
                    placeholder="Ex: Augmenter la rétention client"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template_category">Catégorie</Label>
                  <Select
                    value={newTemplateData.category}
                    onValueChange={val => setNewTemplateData({ ...newTemplateData, category: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ventes">Ventes</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="RH">Ressources Humaines</SelectItem>
                      <SelectItem value="IT">IT & Développement</SelectItem>
                      <SelectItem value="Opérations">Opérations</SelectItem>
                      <SelectItem value="Direction">Direction Générale</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template_desc">Description par défaut</Label>
                  <Textarea
                    id="template_desc"
                    value={newTemplateData.description}
                    onChange={e =>
                      setNewTemplateData({ ...newTemplateData, description: e.target.value })
                    }
                    placeholder="Description du modèle..."
                    rows={2}
                  />
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={!newTemplateData.title || !newTemplateData.category}
                  onClick={async () => {
                    if (onCreateTemplate) {
                      await onCreateTemplate(newTemplateData);
                      setIsCreatingTemplate(false);
                      setNewTemplateData({ title: '', category: '', description: '' });
                    }
                  }}
                >
                  Enregistrer le modèle
                </Button>
              </div>
            )}

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
                {errors.due_date && (
                  <p className="text-sm text-red-500">{errors.due_date.message}</p>
                )}
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
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
