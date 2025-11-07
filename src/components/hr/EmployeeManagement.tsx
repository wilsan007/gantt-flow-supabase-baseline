import { useEmployees } from '@/hooks/useEmployees';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const EmployeeManagement = () => {
  const { employees, departments, loading } = useEmployees();
  const isMobile = useIsMobile();

  if (loading) {
    return <div className="p-6 text-center">Chargement des employés...</div>;
  }

  const getContractTypeColor = (contractType?: string) => {
    switch (contractType) {
      case 'CDI':
        return 'default';
      case 'CDD':
        return 'secondary';
      case 'Stage':
        return 'outline';
      case 'Freelance':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent">
          Gestion des Employés
        </h2>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employés</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{employees.length}</div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CDI</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {employees.filter(e => e.contract_type === 'CDI').length}
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CDD/Autres</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {employees.filter(e => e.contract_type !== 'CDI' && e.contract_type).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <div className="space-y-4">
        {employees.length === 0 ? (
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Aucun employé trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {employees.map(employee => {
              const department = departments.find(d => d.id === employee.department_id);

              return (
                <Card key={employee.user_id} className="modern-card hover-glow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={employee.avatar_url || undefined}
                          alt={employee.full_name}
                        />
                        <AvatarFallback>
                          {employee.full_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-semibold">{employee.full_name}</h3>

                        {employee.job_title && (
                          <p className="mb-2 text-sm text-muted-foreground">{employee.job_title}</p>
                        )}

                        <div className="space-y-2">
                          {employee.employee_id && (
                            <p className="text-xs text-muted-foreground">
                              <strong>ID:</strong> {employee.employee_id}
                            </p>
                          )}

                          {employee.hire_date && (
                            <p className="text-xs text-muted-foreground">
                              <strong>Embauché le:</strong>{' '}
                              {new Date(employee.hire_date).toLocaleDateString()}
                            </p>
                          )}

                          {department && (
                            <p className="text-xs text-muted-foreground">
                              <strong>Département:</strong> {department.name}
                            </p>
                          )}

                          {employee.contract_type && (
                            <Badge
                              variant={getContractTypeColor(employee.contract_type)}
                              className="text-xs"
                            >
                              {employee.contract_type}
                            </Badge>
                          )}
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
