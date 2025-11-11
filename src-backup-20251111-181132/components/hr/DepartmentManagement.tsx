import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Building, Users, Edit, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  budget?: number;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
}

export const DepartmentManagement = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchData = async () => {
    try {
      setLoading(true);

      const [departmentsRes, employeesRes] = await Promise.all([
        supabase.from('departments').select('*').order('name'),
        supabase.from('profiles').select('id, full_name'),
      ]);

      if (departmentsRes.error) throw departmentsRes.error;
      if (employeesRes.error) throw employeesRes.error;

      setDepartments(departmentsRes.data || []);
      setEmployees(employeesRes.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      const departmentData = {
        name: data.name,
        description: data.description || null,
        manager_id: data.manager_id || null,
        budget: data.budget ? parseFloat(data.budget) : null,
      };

      let error;
      if (editingDepartment) {
        ({ error } = await supabase
          .from('departments')
          .update(departmentData)
          .eq('id', editingDepartment.id));
      } else {
        ({ error } = await supabase.from('departments').insert(departmentData));
      }

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Département ${editingDepartment ? 'modifié' : 'créé'} avec succès`,
      });

      reset();
      setIsCreateDialogOpen(false);
      setEditingDepartment(null);
      fetchData();
    } catch (error: any) {
      console.error('Error managing department:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de ${editingDepartment ? 'modifier' : 'créer'} le département`,
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setValue('name', department.name);
    setValue('description', department.description);
    setValue('manager_id', department.manager_id);
    setValue('budget', department.budget);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (departmentId: string) => {
    try {
      const { error } = await supabase.from('departments').delete().eq('id', departmentId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Département supprimé avec succès',
      });

      fetchData();
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le département',
        variant: 'destructive',
      });
    }
  };

  // Note: Employee count functionality can be added later when department_id is linked to profiles

  if (loading) {
    return <div className="p-6 text-center">Chargement des départements...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent">
          Départements
        </h2>

        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={open => {
            setIsCreateDialogOpen(open);
            if (!open) {
              setEditingDepartment(null);
              reset();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="hover-glow">
              <Plus className="mr-2 h-4 w-4" />
              Nouveau département
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? 'Modifier le département' : 'Créer un département'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  placeholder="Ressources Humaines"
                  {...register('name', { required: true })}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description du département..."
                  {...register('description')}
                />
              </div>

              <div>
                <Label htmlFor="manager_id">Manager</Label>
                <Select onValueChange={value => setValue('manager_id', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucun manager</SelectItem>
                    {employees.map(employee => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="budget">Budget annuel (€)</Label>
                <Input id="budget" type="number" placeholder="100000" {...register('budget')} />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingDepartment ? 'Modifier' : 'Créer'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingDepartment(null);
                    reset();
                  }}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Departments Grid */}
      <div className="space-y-4">
        {departments.length === 0 ? (
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Building className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun département configuré</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {departments.map(department => {
              const manager = employees.find(emp => emp.id === department.manager_id);

              return (
                <Card key={department.id} className="modern-card hover-glow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Building className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="text-lg font-semibold">{department.name}</h3>
                            {department.description && (
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                {department.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(department)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(department.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {manager && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Manager: {manager.full_name}
                            </Badge>
                          </div>
                        )}

                        {department.budget && (
                          <p className="text-muted-foreground">
                            <strong>Budget:</strong> {department.budget.toLocaleString()} €
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Employés du département</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
