import React, { useState, useEffect } from 'react';
import { ResponsiveModal, ResponsiveModalContent } from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { toast } from 'sonner';
import { QuickInviteDialog } from './QuickInviteDialog';

// Sub-components
import { TaskBasicInfo } from './creation/TaskBasicInfo';
import { TaskProperties } from './creation/TaskProperties';
import { TaskActions } from './creation/TaskActions';
import { TaskDescription } from './creation/TaskDescription';

interface TaskAction {
  id: string;
  name: string;
  description?: string;
}

interface ModernTaskCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTask: (taskData: any) => void;
  parentTask?: {
    start_date?: Date;
    due_date?: Date;
    title?: string;
  };
  initialValues?: {
    title?: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
}

export const ModernTaskCreationDialog: React.FC<ModernTaskCreationDialogProps> = ({
  open,
  onOpenChange,
  onCreateTask,
  parentTask,
  initialValues,
}) => {
  // États de base
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [status, setStatus] = useState<'todo' | 'doing' | 'blocked' | 'done'>('todo');
  const [startDate, setStartDate] = useState<Date | undefined>(parentTask?.start_date);
  const [dueDate, setDueDate] = useState<Date | undefined>(parentTask?.due_date);
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(
    initialValues?.priority || 'medium'
  );

  // Mettre à jour les états quand initialValues change ou quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      if (initialValues) {
        setTitle(initialValues.title || '');
        setDescription(initialValues.description || '');
        setPriority(initialValues.priority || 'medium');
      } else {
        // Reset si pas d'initialValues (ou garder les valeurs par défaut)
        // setTitle(''); // On ne reset pas ici pour éviter d'effacer si on ferme/rouvre sans changer initialValues
      }
    }
  }, [open, initialValues]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [effortEstimate, setEffortEstimate] = useState<number>(0);
  const [department, setDepartment] = useState('');
  const [project, setProject] = useState('');

  // Actions de la tâche
  const [actions, setActions] = useState<TaskAction[]>([]);
  const [newActionName, setNewActionName] = useState('');
  const [newActionDescription, setNewActionDescription] = useState('');

  // UI States
  const [showDescription, setShowDescription] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  // Données réelles depuis la base
  const { currentTenant } = useTenant();
  const [availableAssignees, setAvailableAssignees] = useState<
    Array<{ id: string; name: string; email: string }>
  >([]);
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [loadingData, setLoadingData] = useState(true);

  // Charger les données réelles au montage
  useEffect(() => {
    if (!currentTenant || !open) return;

    const loadRealData = async () => {
      setLoadingData(true);

      try {
        // 1. Charger les VRAIS employés du tenant
        const { data: employees, error: empError } = await supabase
          .from('employees')
          .select('user_id, full_name, email')
          .eq('tenant_id', currentTenant.id)
          .eq('status', 'active')
          .order('full_name');

        if (empError) {
          console.error('Erreur chargement employés:', empError);
          toast.error('Impossible de charger la liste des employés');
        } else {
          setAvailableAssignees(
            (employees || []).map(emp => ({
              id: emp.user_id,
              name: emp.full_name,
              email: emp.email,
            }))
          );
        }

        // 2. Charger les départements du tenant
        const { data: depts, error: deptError } = await supabase
          .from('departments')
          .select('name')
          .eq('tenant_id', currentTenant.id)
          .order('name');

        if (deptError) {
          console.error('Erreur chargement départements:', deptError);
        } else {
          setAvailableDepartments((depts || []).map(d => d.name));
        }

        // 3. Charger les VRAIS projets du tenant
        const { data: projects, error: projError } = await supabase
          .from('projects')
          .select('id, name')
          .eq('tenant_id', currentTenant.id)
          .order('name');

        if (projError) {
          console.error('Erreur chargement projets:', projError);
        } else {
          setAvailableProjects(projects || []);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadRealData();
  }, [currentTenant, open]);

  // Gestion des tags
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Gestion des actions
  const addAction = () => {
    if (newActionName.trim()) {
      const newAction: TaskAction = {
        id: Date.now().toString(),
        name: newActionName.trim(),
        description: newActionDescription.trim() || undefined,
      };
      setActions([...actions, newAction]);
      setNewActionName('');
      setNewActionDescription('');
    }
  };

  const removeAction = (actionId: string) => {
    setActions(actions.filter(a => a.id !== actionId));
  };

  // Validation des dates par rapport à la tâche parente
  const validateDate = (date: Date | undefined, type: 'start' | 'due'): boolean => {
    if (!date || !parentTask) return true;

    if (type === 'start' && parentTask.start_date) {
      if (date < parentTask.start_date) {
        return false;
      }
    }

    if (type === 'due' && parentTask.due_date) {
      if (date > parentTask.due_date) {
        return false;
      }
    }

    // Vérifier que la date de début est avant la date de fin
    if (type === 'start' && dueDate && date > dueDate) {
      return false;
    }

    if (type === 'due' && startDate && date < startDate) {
      return false;
    }

    return true;
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Le titre est obligatoire');
      return;
    }

    // Validation des dates
    if (startDate && !validateDate(startDate, 'start')) {
      alert(
        parentTask?.start_date
          ? `La date de début ne peut pas être avant ${format(parentTask.start_date, 'dd/MM/yyyy', { locale: fr })}`
          : 'Date de début invalide'
      );
      return;
    }

    if (dueDate && !validateDate(dueDate, 'due')) {
      alert(
        parentTask?.due_date
          ? `La date d'échéance ne peut pas être après ${format(parentTask.due_date, 'dd/MM/yyyy', { locale: fr })}`
          : "Date d'échéance invalide"
      );
      return;
    }

    setLoading(true);
    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        assignee,
        department,
        project,
        priority,
        status,
        start_date: startDate,
        due_date: dueDate,
        tags: tags.length > 0 ? tags : undefined,
        effort_estimate_h: effortEstimate > 0 ? effortEstimate : undefined,
        actions: actions.length > 0 ? actions : undefined,
      });

      // Reset
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la tâche');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('todo');
    setStartDate(undefined);
    setDueDate(undefined);
    setAssignee('');
    setPriority('medium');
    setTags([]);
    setActions([]);
    setEffortEstimate(0);
    setDepartment('');
    setProject('');
    setShowDescription(false);
    setShowActions(false);
  };

  // Callback après invitation réussie
  const handleInviteSuccess = async () => {
    toast.success("✅ Invitation envoyée! L'employé sera disponible une fois qu'il aura accepté.");

    // Recharger la liste des employés
    if (currentTenant) {
      const { data: employees } = await supabase
        .from('employees')
        .select('user_id, full_name, email')
        .eq('tenant_id', currentTenant.id)
        .eq('status', 'active')
        .order('full_name');

      setAvailableAssignees(
        (employees || []).map(emp => ({
          id: emp.user_id,
          name: emp.full_name,
          email: emp.email,
        }))
      );
    }
  };

  return (
    <>
      <QuickInviteDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onInviteSuccess={handleInviteSuccess}
      />

      <ResponsiveModal open={open} onOpenChange={onOpenChange}>
        <ResponsiveModalContent className="flex max-h-[95vh] flex-col p-0">
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-6">
              <TaskBasicInfo title={title} setTitle={setTitle} parentTask={parentTask} />

              <TaskProperties
                status={status}
                setStatus={setStatus}
                startDate={startDate}
                setStartDate={setStartDate}
                dueDate={dueDate}
                setDueDate={setDueDate}
                effortEstimate={effortEstimate}
                setEffortEstimate={setEffortEstimate}
                assignee={assignee}
                setAssignee={setAssignee}
                priority={priority}
                setPriority={setPriority}
                department={department}
                setDepartment={setDepartment}
                project={project}
                setProject={setProject}
                tags={tags}
                newTag={newTag}
                setNewTag={setNewTag}
                addTag={addTag}
                removeTag={removeTag}
                availableAssignees={availableAssignees}
                availableDepartments={availableDepartments}
                availableProjects={availableProjects}
                loadingData={loadingData}
                onInviteClick={() => setShowInviteDialog(true)}
                parentTask={parentTask}
              />

              <Separator />

              <TaskDescription
                description={description}
                setDescription={setDescription}
                showDescription={showDescription}
                setShowDescription={setShowDescription}
              />

              <TaskActions
                actions={actions}
                setActions={setActions}
                newActionName={newActionName}
                setNewActionName={setNewActionName}
                newActionDescription={newActionDescription}
                setNewActionDescription={setNewActionDescription}
                addAction={addAction}
                removeAction={removeAction}
                showActions={showActions}
                setShowActions={setShowActions}
              />

              <Separator />

              {/* Footer avec boutons */}
              <div className="flex items-center justify-between pt-2 pb-2">
                <div className="text-muted-foreground text-sm">
                  {actions.length > 0 && `${actions.length} action(s)`}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Annuler
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading || !title.trim()}>
                    {loading ? 'Création...' : 'Créer la Tâche'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>
    </>
  );
};
