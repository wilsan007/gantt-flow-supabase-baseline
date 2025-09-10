import { useState } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserPlus, Calendar, Phone, Mail, MapPin, Briefcase, Edit, Trash2, FileText, Eye } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EmployeeDetailsDialog } from './EmployeeDetailsDialog';

interface Employee {
  id: string;
  full_name: string;
  avatar_url?: string;
  job_title?: string;
  employee_id?: string;
  hire_date?: string;
  contract_type?: string;
  phone?: string;
  salary?: number;
  weekly_hours?: number;
  manager_id?: string;
  emergency_contact?: any;
}

interface Department {
  id: string;
  name: string;
}

export const EnhancedEmployeeManagement = () => {
  const { employees, departments, loading, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [viewingEmployee, setViewingEmployee] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const { register, handleSubmit, reset, setValue, watch } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const employeeData = {
        full_name: data.full_name,
        email: data.email || `${data.full_name.toLowerCase().replace(/\s+/g, '.')}@company.com`,
        job_title: data.job_title || null,
        employee_id: data.employee_id || `EMP${Date.now().toString().slice(-6)}`,
        hire_date: data.hire_date || null,
        contract_type: data.contract_type || 'CDI',
        phone: data.phone || null,
        salary: data.salary ? parseFloat(data.salary) : null,
        weekly_hours: data.weekly_hours ? parseFloat(data.weekly_hours) : 35,
        manager_id: data.manager_id || null,
        department_id: data.department_id || null,
        emergency_contact: data.emergency_name ? {
          name: data.emergency_name,
          phone: data.emergency_phone,
          relation: data.emergency_relation
        } : null
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, employeeData);
      } else {
        await createEmployee(employeeData);
      }

      toast({
        title: "Succès",
        description: `Employé ${editingEmployee ? 'modifié' : 'créé'} avec succès`
      });

      reset();
      setIsCreateDialogOpen(false);
      setEditingEmployee(null);
    } catch (error: any) {
      console.error('Error managing employee:', error);
      toast({
        title: "Erreur",
        description: `Impossible de ${editingEmployee ? 'modifier' : 'créer'} l'employé`,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setValue('full_name', employee.full_name);
    setValue('email', employee.email);
    setValue('job_title', employee.job_title);
    setValue('employee_id', employee.employee_id);
    setValue('hire_date', employee.hire_date);
    setValue('contract_type', employee.contract_type);
    setValue('phone', employee.phone);
    setValue('salary', employee.salary);
    setValue('weekly_hours', employee.weekly_hours);
    setValue('manager_id', employee.manager_id);
    setValue('department_id', employee.department_id);
    if (employee.emergency_contact) {
      setValue('emergency_name', employee.emergency_contact.name);
      setValue('emergency_phone', employee.emergency_contact.phone);
      setValue('emergency_relation', employee.emergency_contact.relation);
    }
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (employeeId: string) => {
    try {
      await deleteEmployee(employeeId);
      toast({
        title: "Succès",
        description: "Employé supprimé avec succès"
      });
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'employé",
        variant: "destructive"
      });
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getContractTypeColor = (contractType?: string) => {
    switch (contractType) {
      case 'CDI': return 'default';
      case 'CDD': return 'secondary';
      case 'Stage': return 'outline';
      case 'Freelance': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Chargement des employés...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Gestion Avancée des Employés
        </h2>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingEmployee(null);
            reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="hover-glow">
              <UserPlus className="h-4 w-4 mr-2" />
              {editingEmployee ? 'Modifier' : 'Nouvel employé'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Modifier l\'employé' : 'Créer un employé'}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Informations de base</TabsTrigger>
                <TabsTrigger value="work">Travail</TabsTrigger>
                <TabsTrigger value="emergency">Urgence</TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="full_name">Nom complet *</Label>
                      <Input
                        id="full_name"
                        placeholder="Jean Dupont"
                        {...register('full_name', { required: true })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="employee_id">ID Employé</Label>
                      <Input
                        id="employee_id"
                        placeholder="EMP001"
                        {...register('employee_id')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        placeholder="+33 1 23 45 67 89"
                        {...register('phone')}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="work" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="job_title">Poste</Label>
                      <Input
                        id="job_title"
                        placeholder="Développeur"
                        {...register('job_title')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="contract_type">Type de contrat</Label>
                      <Select onValueChange={(value) => setValue('contract_type', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="CDI" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="CDD">CDD</SelectItem>
                          <SelectItem value="Stage">Stage</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="hire_date">Date d'embauche</Label>
                      <Input
                        id="hire_date"
                        type="date"
                        {...register('hire_date')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="weekly_hours">Heures/semaine</Label>
                      <Input
                        id="weekly_hours"
                        type="number"
                        placeholder="35"
                        {...register('weekly_hours')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="salary">Salaire (€/an)</Label>
                      <Input
                        id="salary"
                        type="number"
                        placeholder="45000"
                        {...register('salary')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="manager_id">Manager</Label>
                      <Select onValueChange={(value) => setValue('manager_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un manager" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Aucun manager</SelectItem>
                          {employees.map(emp => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="emergency" className="space-y-4">
                  <h4 className="font-semibold">Contact d'urgence</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergency_name">Nom</Label>
                      <Input
                        id="emergency_name"
                        placeholder="Marie Dupont"
                        {...register('emergency_name')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="emergency_phone">Téléphone</Label>
                      <Input
                        id="emergency_phone"
                        placeholder="+33 1 23 45 67 89"
                        {...register('emergency_phone')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="emergency_relation">Relation</Label>
                      <Select onValueChange={(value) => setValue('emergency_relation', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conjoint">Conjoint(e)</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="enfant">Enfant</SelectItem>
                          <SelectItem value="frere_soeur">Frère/Sœur</SelectItem>
                          <SelectItem value="ami">Ami(e)</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <div className="flex gap-2 mt-6">
                  <Button type="submit" className="flex-1">
                    {editingEmployee ? 'Modifier' : 'Créer'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingEmployee(null);
                      reset();
                    }}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
        <Card className="modern-card hover-glow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{employees.length}</div>
              <div className="text-sm text-muted-foreground">Total Employés</div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {employees.filter(e => e.contract_type === 'CDI').length}
              </div>
              <div className="text-sm text-muted-foreground">CDI</div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {employees.filter(e => e.contract_type && e.contract_type !== 'CDI').length}
              </div>
              <div className="text-sm text-muted-foreground">Temporaires</div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {employees.filter(e => {
                  const hireDate = e.hire_date ? new Date(e.hire_date) : null;
                  const threeMonthsAgo = new Date();
                  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                  return hireDate && hireDate > threeMonthsAgo;
                }).length}
              </div>
              <div className="text-sm text-muted-foreground">Nouveaux (3m)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Rechercher un employé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Employee List */}
      <div className="space-y-4">
        {filteredEmployees.length === 0 ? (
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun employé trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {filteredEmployees.map((employee) => (
              <Card key={employee.id} className="modern-card hover-glow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={employee.avatar_url || undefined} />
                          <AvatarFallback>
                            {employee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{employee.full_name}</h3>
                          {employee.job_title && (
                            <p className="text-sm text-muted-foreground">{employee.job_title}</p>
                          )}
                          {employee.contract_type && (
                            <Badge variant={getContractTypeColor(employee.contract_type)} className="text-xs mt-1">
                              {employee.contract_type}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingEmployee(employee)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(employee)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(employee.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      {employee.employee_id && (
                        <p><strong>ID:</strong> {employee.employee_id}</p>
                      )}
                      {employee.hire_date && (
                        <p><strong>Embauché:</strong> {new Date(employee.hire_date).toLocaleDateString()}</p>
                      )}
                      {employee.phone && (
                        <p><strong>Tél:</strong> {employee.phone}</p>
                      )}
                      {employee.weekly_hours && (
                        <p><strong>Temps:</strong> {employee.weekly_hours}h/sem</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Employee Details Dialog */}
      <EmployeeDetailsDialog
        employee={viewingEmployee}
        isOpen={!!viewingEmployee}
        onOpenChange={(open) => !open && setViewingEmployee(null)}
      />
    </div>
  );
};