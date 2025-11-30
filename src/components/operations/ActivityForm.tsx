/**
 * Formulaire de Création/Édition d'Activité Opérationnelle
 * Avec ASSIGNATION OBLIGATOIRE et gestion des actions
 * Pattern: Linear/Asana - Formulaire complet multi-étapes
 */

import React, { useState, useEffect } from 'react';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Calendar, CheckSquare, AlertCircle, UserCircle } from 'lucide-react';

interface ActivityFormWithAssignmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ActivityData) => void;
  initialData?: Partial<ActivityData>;
  mode?: 'create' | 'edit';
}

export interface ActivityData {
  name: string;
  description?: string;
  kind: 'recurring' | 'one_off';
  scope: 'org' | 'department' | 'team' | 'person';
  owner_employee_id: string; // OBLIGATOIRE
  owner_name?: string;
  department_id?: string;
  project_id?: string;
  task_title_template?: string;
  is_active: boolean;

  // Pour ponctuelle : DATE OBLIGATOIRE
  one_off_date?: string; // Format ISO: YYYY-MM-DD
}

export const ActivityFormWithAssignment: React.FC<ActivityFormWithAssignmentProps> = ({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = 'create',
}) => {
  const { employees, loading: loadingEmployees } = useHRMinimal({
    enabled: {
      employees: true,
      leaveRequests: false,
      attendances: false,
      leaveBalances: false,
      departments: false,
      absenceTypes: false,
    },
    limits: {
      employees: 15,
    },
  });

  const [formData, setFormData] = useState<ActivityData>({
    name: '',
    description: '',
    kind: 'recurring',
    scope: 'org',
    owner_employee_id: '',
    task_title_template: 'Activité {{date}}',
    is_active: true,
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentTab, setCurrentTab] = useState('info');

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData(prev => ({ ...prev, ...initialData }));
      } else {
        setFormData({
          name: '',
          description: '',
          kind: 'recurring',
          scope: 'org',
          owner_employee_id: '',
          task_title_template: 'Activité {{date}}',
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [open]); // Ne dépend que de 'open', pas de formData ou initialData

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validation nom
    if (!formData.name.trim()) {
      newErrors.name = "Le nom de l'activité est obligatoire";
    } else if (formData.name.length < 3) {
      newErrors.name = 'Le nom doit contenir au moins 3 caractères';
    }

    // Validation assignation OBLIGATOIRE
    if (!formData.owner_employee_id) {
      newErrors.owner = 'Vous devez assigner cette activité à une personne';
    }

    // Validation DATE pour activité ponctuelle
    if (formData.kind === 'one_off' && !formData.one_off_date) {
      newErrors.one_off_date = 'La date est obligatoire pour une activité ponctuelle';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Mettre à jour owner_name
      const selectedEmployee = employees.find(e => e.id === formData.owner_employee_id);
      const finalData = {
        ...formData,
        owner_name: selectedEmployee?.full_name || '',
      };
      onSubmit(finalData);
      onOpenChange(false);
    }
  };

  const selectedEmployee = employees.find(e => e.id === formData.owner_employee_id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {mode === 'edit' ? "Modifier l'activité" : 'Nouvelle activité opérationnelle'}
          </DialogTitle>
          <DialogDescription>
            Créez une activité récurrente ou ponctuelle avec son responsable
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList
                className={`grid w-full ${formData.kind === 'recurring' ? 'grid-cols-3' : 'grid-cols-2'}`}
              >
                <TabsTrigger value="info">Informations</TabsTrigger>
                {formData.kind === 'recurring' && (
                  <TabsTrigger value="planification">Planification</TabsTrigger>
                )}
                <TabsTrigger value="assignment">Assignation</TabsTrigger>
              </TabsList>

              {/* Onglet 1: Informations de base */}
              <TabsContent value="info" className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="name" className="required">
                    Nom de l'activité
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Rapport hebdomadaire des ventes"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez l'objectif de cette activité..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kind">Type</Label>
                    <Select
                      value={formData.kind}
                      onValueChange={(value: 'recurring' | 'one_off') =>
                        setFormData({ ...formData, kind: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recurring">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Récurrente
                          </div>
                        </SelectItem>
                        <SelectItem value="one_off">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4" />
                            Ponctuelle
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="scope">Portée</Label>
                    <Select
                      value={formData.scope}
                      onValueChange={(value: 'org' | 'department' | 'team' | 'person') =>
                        setFormData({ ...formData, scope: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="org">Organisation</SelectItem>
                        <SelectItem value="department">Département</SelectItem>
                        <SelectItem value="team">Équipe</SelectItem>
                        <SelectItem value="person">Individuelle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="task_title_template">Template du titre de tâche</Label>
                  <Input
                    id="task_title_template"
                    value={formData.task_title_template || ''}
                    onChange={e =>
                      setFormData({ ...formData, task_title_template: e.target.value })
                    }
                    placeholder="Activité {{date}}"
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    Variables disponibles : {'{'}
                    {'{'} date {'}'}
                    {'}'}, {'{'}
                    {'{'} isoWeek {'}'}
                    {'}'}, {'{'}
                    {'{'} year {'}'}
                    {'}'}, {'{'}
                    {'{'} month {'}'}
                    {'}'}, {'{'}
                    {'{'} day {'}'}
                    {'}'}
                  </p>
                </div>

                {/* DATE pour ponctuelle - affichée directement dans Info */}
                {formData.kind === 'one_off' && (
                  <div>
                    <Label htmlFor="one_off_date" className="required">
                      Date de la tâche ponctuelle
                    </Label>
                    <Input
                      id="one_off_date"
                      type="date"
                      value={formData.one_off_date || ''}
                      onChange={e => setFormData({ ...formData, one_off_date: e.target.value })}
                      className={errors.one_off_date ? 'border-red-500' : ''}
                    />
                    {errors.one_off_date && (
                      <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {errors.one_off_date}
                      </p>
                    )}
                    <p className="text-muted-foreground mt-1 text-xs">
                      Date à laquelle la tâche doit être effectuée
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Onglet 2: Planification (UNIQUEMENT pour récurrente) */}
              {formData.kind === 'recurring' && (
                <TabsContent value="planification" className="mt-4 space-y-4">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-900 dark:text-amber-100">
                          Planification récurrente
                        </p>
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                          Définissez quand cette activité doit se répéter (quotidien, hebdomadaire,
                          mensuel)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-muted-foreground py-8 text-center">
                    <Calendar className="mx-auto mb-3 h-12 w-12 opacity-50" />
                    <p>La planification détaillée sera configurée après la création</p>
                    <p className="mt-1 text-sm">
                      Vous pourrez définir la fréquence, les jours, etc.
                    </p>
                  </div>
                </TabsContent>
              )}

              {/* Onglet 3: Assignation OBLIGATOIRE */}
              <TabsContent value="assignment" className="mt-4 space-y-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        Assignation obligatoire
                      </p>
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        Chaque activité doit avoir un responsable. Cette personne sera assignée par
                        défaut aux tâches générées (sauf si les actions ont des assignations
                        spécifiques).
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="owner" className="required">
                    Responsable de l'activité
                  </Label>
                  <Select
                    value={formData.owner_employee_id}
                    onValueChange={value => setFormData({ ...formData, owner_employee_id: value })}
                  >
                    <SelectTrigger className={errors.owner ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionnez un employé" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingEmployees ? (
                        <SelectItem value="loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : employees.length === 0 ? (
                        <SelectItem value="empty" disabled>
                          Aucun employé disponible
                        </SelectItem>
                      ) : (
                        employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id}>
                            <div className="flex items-center gap-2">
                              <UserCircle className="h-4 w-4" />
                              <div>
                                <div className="font-medium">{employee.full_name}</div>
                                {employee.job_title && (
                                  <div className="text-muted-foreground text-xs">
                                    {employee.job_title}
                                  </div>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {errors.owner && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {errors.owner}
                    </p>
                  )}
                </div>

                {/* Affichage employé sélectionné */}
                {selectedEmployee && (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{selectedEmployee.full_name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          {selectedEmployee.job_title && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedEmployee.job_title}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {selectedEmployee.employee_id}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <Separator />
            <div className="flex items-center justify-between pt-2">
              <div className="text-muted-foreground text-sm">
                Étape {currentTab === 'info' ? '1' : '2'} sur 2
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                {currentTab === 'info' ? (
                  <Button type="button" onClick={() => setCurrentTab('assignment')}>
                    Suivant : Assignation
                  </Button>
                ) : (
                  <Button type="submit">
                    {mode === 'edit' ? 'Enregistrer' : "Créer l'activité"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityFormWithAssignment;
