import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalTrigger,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';
import { Badge } from '@/components/ui/badge';
import { Building, Plus, Users, Briefcase, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useHRMinimal } from '@/hooks/useHRMinimal';

interface Department {
  id: string;
  name: string;
  manager_id: string | null;
  description: string | null;
  created_at: string;
  employee_count?: number;
}

export function DepartmentManagement() {
  const { departments, employees, loading, refreshData } = useHRMinimal();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
  });
  const { toast } = useToast();

  const handleCreateDepartment = async () => {
    try {
      const { error } = await supabase.from('departments').insert([newDepartment]).select();

      if (error) throw error;

      toast({
        title: 'Département créé',
        description: 'Le département a été ajouté avec succès.',
      });
      setIsAddDialogOpen(false);
      refreshData();
      setNewDepartment({ name: '', description: '' });
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le département.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      const { error } = await supabase
        .from('departments')
        .update({
          name: selectedDepartment.name,
          description: selectedDepartment.description,
        })
        .eq('id', selectedDepartment.id);

      if (error) throw error;

      toast({
        title: 'Département mis à jour',
        description: 'Les modifications ont été enregistrées.',
      });
      setIsEditDialogOpen(false);
      refreshData();
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le département.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      const { error } = await supabase.from('departments').delete().eq('id', id);

      if (error) throw error;

      toast({
        title: 'Département supprimé',
        description: 'Le département a été supprimé avec succès.',
      });
      refreshData();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le département.',
        variant: 'destructive',
      });
    }
  };

  // Calculate employee counts per department
  const departmentsWithCounts = (departments || []).map(dept => ({
    ...dept,
    employee_count: employees.filter(e => e.department_id === dept.id).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Départements</h2>
          <p className="text-muted-foreground">
            Gérez la structure organisationnelle de votre entreprise
          </p>
        </div>
        <ResponsiveModal open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <ResponsiveModalTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un département
            </Button>
          </ResponsiveModalTrigger>
          <ResponsiveModalContent>
            <ResponsiveModalHeader>
              <ResponsiveModalTitle>Nouveau département</ResponsiveModalTitle>
              <ResponsiveModalDescription>
                Créez un nouveau département pour organiser vos équipes.
              </ResponsiveModalDescription>
            </ResponsiveModalHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du département</Label>
                <Input
                  id="name"
                  value={newDepartment.name}
                  onChange={e => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  placeholder="Ex: Marketing, IT, RH..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newDepartment.description}
                  onChange={e =>
                    setNewDepartment({
                      ...newDepartment,
                      description: e.target.value,
                    })
                  }
                  placeholder="Description du département"
                />
              </div>
              <Button onClick={handleCreateDepartment} className="mt-4 w-full">
                Créer le département
              </Button>
            </div>
          </ResponsiveModalContent>
        </ResponsiveModal>
      </div>

      {departmentsWithCounts.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20 opacity-75"></div>
              <div className="relative rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 p-6 dark:from-blue-900/30 dark:to-indigo-900/30">
                <Building className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Aucun département pour le moment</h3>
            <p className="text-muted-foreground mb-6 max-w-md text-center">
              Organisez votre entreprise en créant des départements. Cela vous permet de mieux
              structurer vos équipes et gérer les ressources.
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Créer votre premier département
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {departmentsWithCounts.map(dept => (
            <Card key={dept.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{dept.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Ouvrir menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedDepartment(dept);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => handleDeleteDepartment(dept.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dept.employee_count}</div>
                <p className="text-muted-foreground text-xs">Employés dans ce département</p>
                <div className="text-muted-foreground mt-4 flex items-center text-sm">
                  <Briefcase className="mr-1 h-4 w-4" />
                  {dept.description || 'Aucune description'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ResponsiveModal open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ResponsiveModalContent>
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>Modifier le département</ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Modifiez les informations du département existant.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
          {selectedDepartment && (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nom du département</Label>
                <Input
                  id="edit-name"
                  value={selectedDepartment.name}
                  onChange={e =>
                    setSelectedDepartment({
                      ...selectedDepartment,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={selectedDepartment.description || ''}
                  onChange={e =>
                    setSelectedDepartment({
                      ...selectedDepartment,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <Button onClick={handleUpdateDepartment} className="mt-4 w-full">
                Enregistrer les modifications
              </Button>
            </div>
          )}
        </ResponsiveModalContent>
      </ResponsiveModal>
    </div>
  );
}
