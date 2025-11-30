import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/components/ui/responsive-modal';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  UserPlus,
  Search,
  MoreHorizontal,
  Mail,
  Phone,
  Building,
  Calendar,
  Shield,
  FileText,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Power,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useHRMinimal, Employee } from '@/hooks/useHRMinimal';
import { useIsMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface NewEmployee {
  full_name: string;
  email: string;
  employee_id: string;
  department_id: string;
  job_title: string;
  hire_date: string;
  contract_type: string;
  status: string;
}

export function EnhancedEmployeeManagement() {
  const {
    employees,
    departments: hrDepartments,
    loading,
    error,
    refresh,
    loadMore,
  } = useHRMinimal({
    enabled: {
      employees: true,
      departments: true,
      leaveRequests: false, // Pas besoin dans cette page
      attendances: false,
      leaveBalances: false,
      absenceTypes: false,
    },
    limits: {
      employees: 20, // Charger seulement 20 au début
    },
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Fetch departments separately since useHRMinimal doesn't export them
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase.from('departments').select('*');
      if (data) setDepartments(data);
    };
    fetchDepartments();
  }, []);

  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    email: '',
    employee_id: '',
    department_id: '',
    job_title: '',
    hire_date: new Date().toISOString().split('T')[0],
    contract_type: 'CDI',
    status: 'active',
    role_id: '', // Will store selected role ID
  });

  // Roles state
  const [roles, setRoles] = useState<Array<{ id: string; name: string; display_name: string }>>([]);
  const DEFAULT_EMPLOYEE_ROLE_ID = '3733965a-d485-4cdc-87a4-ae8f5abc5cd9';

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('roles')
        .select('id, name, display_name')
        .not('name', 'in', '(tenant_admin,admin)')
        .order('display_name');

      if (data && !error) {
        setRoles(data);
      }
    };
    fetchRoles();
  }, []);

  // Import Excel Logic
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        throw new Error('Aucune feuille de calcul trouvée');
      }

      const employeesToImport: any[] = [];

      // Assume Row 1 is header
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        // Mapping columns (Adjust indices based on template)
        // A: Full Name, B: Email, C: Role, D: Job Title, E: Phone, F: Salary
        const fullName = row.getCell(1).text;
        const email = row.getCell(2).text;

        if (fullName && email) {
          employeesToImport.push({
            fullName,
            email: email, // email is already a string from .text
            role: row.getCell(3).text?.toLowerCase() || 'employee',
            jobTitle: row.getCell(4).text,
            phone: row.getCell(5).text,
            salary: row.getCell(6).value,
            // Department mapping would be complex without IDs, skipping for now or defaulting
          });
        }
      });

      if (employeesToImport.length === 0) {
        toast({
          title: 'Aucune donnée',
          description: 'Aucun employé valide trouvé dans le fichier.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Importation en cours',
        description: `${employeesToImport.length} employés trouvés. Traitement...`,
      });

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error('Session expirée');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-import-employees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ employees: employeesToImport }),
        }
      );

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Erreur d'importation");

      toast({
        title: 'Importation terminée',
        description: `${result.success} employés créés/mis à jour. ${result.failed} erreurs.`,
        variant: result.failed > 0 ? 'destructive' : 'default',
      });

      if (result.success > 0) {
        refresh();
      }
    } catch (error: any) {
      console.error('Import Error:', error);
      toast({
        title: "Erreur d'importation",
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateEmployee = async () => {
    try {
      if (!newEmployee.email || !newEmployee.full_name) {
        toast({
          title: 'Champs manquants',
          description: "L'email et le nom complet sont requis.",
          variant: 'destructive',
        });
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          title: 'Session expirée',
          description: 'Veuillez vous reconnecter.',
          variant: 'destructive',
        });
        return;
      }

      // Use the bulk-import-employees function for immediate creation + email
      // This satisfies the requirement to create everything immediately and send credentials
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bulk-import-employees`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            employees: [
              {
                email: newEmployee.email,
                fullName: newEmployee.full_name,
                roleId: newEmployee.role_id || DEFAULT_EMPLOYEE_ROLE_ID, // Use selected role or default
                department: newEmployee.department_id,
                jobTitle: newEmployee.job_title,
                hireDate: newEmployee.hire_date,
                contractType: newEmployee.contract_type,
              },
            ],
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la création de l'employé");
      }

      // Check if the single operation was successful
      if (result.failed > 0) {
        const errorMsg = result.errors?.[0]?.error || 'Erreur inconnue';
        throw new Error(errorMsg);
      }

      toast({
        title: 'Employé créé',
        description: 'Le compte a été créé et les identifiants envoyés par email.',
      });
      setIsAddDialogOpen(false);
      refresh();
      setNewEmployee({
        full_name: '',
        email: '',
        employee_id: '',
        department_id: '',
        job_title: '',
        hire_date: new Date().toISOString().split('T')[0],
        contract_type: 'CDI',
        status: 'active',
        role_id: '',
      });
    } catch (error: any) {
      console.error('Error creating employee:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Impossible de créer l'employé.",
        variant: 'destructive',
      });
    }
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch =
      employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      departmentFilter === 'all' || employee.department_id === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'active':
        return <UserCheck className="mr-1 h-4 w-4" />;
      case 'inactive':
        return <UserX className="mr-1 h-4 w-4" />;
      case 'on_leave':
        return <Clock className="mr-1 h-4 w-4" />;
      default:
        return null;
    }
  };

  const getInitials = (fullName: string) => {
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'inactive':
        return 'Inactif';
      case 'on_leave':
        return 'En congé';
      default:
        return 'Non défini';
    }
  };

  // Mobile Card Component for Employee with Glassmorphism
  const EmployeeCard = ({ employee }: { employee: Employee }) => (
    <Card className="group relative mb-3 overflow-hidden border-none bg-white/60 backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 dark:bg-gray-900/60">
      {/* Gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-500/0 via-blue-500/0 to-cyan-500/0 transition-all duration-500 group-hover:from-purple-500/10 group-hover:via-blue-500/10 group-hover:to-cyan-500/10" />

      <CardContent className="relative z-10 p-4">
        <div className="mb-3 flex items-start gap-3">
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-purple-500/20 transition-all duration-300 group-hover:ring-purple-500/50">
              <AvatarImage src={employee.avatar_url || ''} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 font-semibold text-white">
                {getInitials(employee.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -right-1 -bottom-1 h-4 w-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 ring-2 ring-white dark:ring-gray-900" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-base font-bold text-transparent dark:from-white dark:to-gray-300">
              {employee.full_name}
            </h3>
            <p className="text-muted-foreground truncate text-sm font-medium">
              {employee.job_title || 'Poste non défini'}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {departments?.find(d => d.id === employee.department_id)?.name || 'Sans département'}
            </p>
          </div>
          <Badge
            className={cn(
              'flex-shrink-0 font-semibold shadow-lg transition-all duration-300',
              employee.status === 'active' &&
                'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-emerald-500/50',
              employee.status === 'inactive' &&
                'bg-gradient-to-r from-gray-500 to-slate-500 text-white hover:shadow-gray-500/50',
              employee.status === 'on_leave' &&
                'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-amber-500/50'
            )}
          >
            {getStatusLabel(employee.status)}
          </Badge>
        </div>

        <div className="mb-3 space-y-2 rounded-lg bg-gradient-to-r from-purple-50/50 to-blue-50/50 p-3 dark:from-purple-950/20 dark:to-blue-950/20">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-3.5 w-3.5 flex-shrink-0 text-purple-500" />
            <span className="truncate">{employee.email}</span>
          </div>
          {employee.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
              <span>{employee.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-3.5 w-3.5 flex-shrink-0 text-cyan-500" />
            <span>{employee.contract_type || 'Type non défini'}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-purple-200 transition-all duration-300 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 dark:border-purple-800 dark:hover:from-purple-950 dark:hover:to-blue-950"
            onClick={() => {
              setSelectedEmployee(employee);
              setIsDetailsOpen(true);
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            Détails
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:from-purple-700 hover:to-blue-700"
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="relative space-y-4 p-4 md:space-y-6 md:p-6">
      {/* Gradient Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-cyan-50/50 dark:from-purple-950/20 dark:via-blue-950/10 dark:to-cyan-950/20" />

      <div className="relative z-10">
        {/* Header with Gradient */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-6 shadow-2xl shadow-purple-500/20">
            {/* Animated gradient overlay */}
            <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-purple-600/0 via-white/10 to-purple-600/0" />
            <h2 className="relative z-10 flex items-center gap-3 text-2xl font-bold tracking-tight text-white md:text-3xl">
              <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                <UserPlus className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              Employés
            </h2>
            <p className="relative z-10 mt-2 text-sm text-white/90 md:text-base">
              Gérez votre effectif et les informations des employés
            </p>
          </div>
          <ResponsiveModal open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <div className="flex w-full gap-2 sm:w-auto">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={handleImportClick}
                className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 sm:flex-none"
              >
                <FileText className="mr-2 h-4 w-4" />
                Importer Excel
              </Button>
              <ResponsiveModalTrigger asChild>
                <Button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 transition-all duration-300 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl hover:shadow-purple-500/40 sm:flex-none">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Ajouter un employé
                </Button>
              </ResponsiveModalTrigger>
            </div>
            <ResponsiveModalContent className="sm:max-w-[600px]">
              <ResponsiveModalHeader>
                <ResponsiveModalTitle className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Ajouter un nouvel employé
                </ResponsiveModalTitle>
              </ResponsiveModalHeader>
              <div className="grid gap-4 px-4 py-4 md:px-0">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={newEmployee.full_name}
                    onChange={e =>
                      setNewEmployee({
                        ...newEmployee,
                        full_name: e.target.value,
                      })
                    }
                    placeholder="Ex: Jean Dupont"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newEmployee.email}
                      onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">ID Employé</Label>
                    <Input
                      id="employeeId"
                      value="Généré automatiquement"
                      disabled
                      className="bg-muted text-muted-foreground"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="department">Département</Label>
                    <Select
                      value={newEmployee.department_id}
                      onValueChange={value =>
                        setNewEmployee({
                          ...newEmployee,
                          department_id: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map(dept => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        )) || []}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select
                      value={newEmployee.role_id}
                      onValueChange={value =>
                        setNewEmployee({
                          ...newEmployee,
                          role_id: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Employé (par défaut)" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.display_name || role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="jobTitle">Titre du poste</Label>
                    <Input
                      id="jobTitle"
                      value={newEmployee.job_title}
                      onChange={e =>
                        setNewEmployee({
                          ...newEmployee,
                          job_title: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="hireDate">Date d'embauche</Label>
                    <Input
                      id="hireDate"
                      type="date"
                      value={newEmployee.hire_date}
                      onChange={e =>
                        setNewEmployee({
                          ...newEmployee,
                          hire_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contractType">Type de contrat</Label>
                    <Select
                      value={newEmployee.contract_type}
                      onValueChange={value =>
                        setNewEmployee({ ...newEmployee, contract_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CDI">CDI</SelectItem>
                        <SelectItem value="CDD">CDD</SelectItem>
                        <SelectItem value="Freelance">Freelance</SelectItem>
                        <SelectItem value="Stage">Stage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreateEmployee} className="mt-4 w-full">
                  Créer l'employé
                </Button>
              </div>
            </ResponsiveModalContent>
          </ResponsiveModal>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <Building className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Département" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les départements</SelectItem>
                {departments?.map(dept => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <UserCheck className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="on_leave">En congé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Employee List */}
        {loading ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">Chargement des employés...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Aucun employé trouvé</p>
            </CardContent>
          </Card>
        ) : isMobile ? (
          // Mobile: Card Layout
          <div className="space-y-3">
            {filteredEmployees.map(employee => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>
        ) : (
          // Desktop: Table Layout
          <div className="bg-card rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead>Poste & Département</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map(employee => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={employee.avatar_url || ''} />
                          <AvatarFallback>{getInitials(employee.full_name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{employee.full_name}</div>
                          <div className="text-muted-foreground text-sm">
                            {employee.contract_type || 'Type non défini'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {employee.job_title || 'Poste non défini'}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {departments?.find(d => d.id === employee.department_id)?.name ||
                            'Sans département'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('flex w-fit items-center', getStatusColor(employee.status))}
                      >
                        {getStatusIcon(employee.status)}
                        {getStatusLabel(employee.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="text-muted-foreground h-3 w-3" />
                          {employee.email}
                        </div>
                        {employee.phone && (
                          <div className="mt-1 flex items-center gap-2">
                            <Phone className="text-muted-foreground h-3 w-3" />
                            {employee.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Power className="mr-2 h-4 w-4" />
                            Désactiver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Employee Details Modal */}
        {selectedEmployee && (
          <ResponsiveModal open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <ResponsiveModalContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
              <ResponsiveModalHeader>
                <ResponsiveModalTitle>Détails de l'employé</ResponsiveModalTitle>
              </ResponsiveModalHeader>
              <div className="space-y-6 px-4 py-4 md:px-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                    <AvatarImage src={selectedEmployee.avatar_url || ''} />
                    <AvatarFallback className="text-xl sm:text-2xl">
                      {getInitials(selectedEmployee.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold sm:text-2xl">{selectedEmployee.full_name}</h3>
                    <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
                      <Briefcase className="h-4 w-4" />
                      <span>{selectedEmployee.job_title || 'Poste non défini'}</span>
                      <span>•</span>
                      <span>
                        {departments?.find(d => d.id === selectedEmployee.department_id)?.name ||
                          'Sans département'}
                      </span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(selectedEmployee.status)} variant="secondary">
                    {getStatusLabel(selectedEmployee.status)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <UserPlus className="h-4 w-4" />
                        Informations personnelles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                        <span className="break-all">{selectedEmployee.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                        <span>{selectedEmployee.phone || 'Non renseigné'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <FileText className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                        <span>Code: {selectedEmployee.employee_id}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Building className="h-4 w-4" />
                        Informations professionnelles
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Embauché(e) le:</div>
                          <div className="text-muted-foreground">
                            {selectedEmployee.hire_date
                              ? format(new Date(selectedEmployee.hire_date), 'dd MMMM yyyy', {
                                  locale: fr,
                                })
                              : 'Non renseigné'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <DollarSign className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Salaire:</div>
                          <div className="text-muted-foreground">
                            {selectedEmployee.salary
                              ? `${selectedEmployee.salary.toLocaleString()} €`
                              : 'Non renseigné'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Type:</div>
                          <div className="text-muted-foreground">
                            {selectedEmployee.contract_type || 'Non défini'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <Clock className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Heures/semaine:</div>
                          <div className="text-muted-foreground">
                            {selectedEmployee.weekly_hours || 35}h
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ResponsiveModalContent>
          </ResponsiveModal>
        )}
      </div>
    </div>
  );
}
