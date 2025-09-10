import { useProfiles } from '@/hooks/useProfiles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export const EmployeeManagement = () => {
  const { profiles, loading } = useProfiles();
  const isMobile = useIsMobile();

  if (loading) {
    return <div className="p-6 text-center">Chargement des employés...</div>;
  }

  // Extend the profile with additional properties as needed
  const extendedProfiles = profiles.map(profile => ({
    ...profile,
    contract_type: (profile as any).contract_type || 'CDI',
    job_title: (profile as any).job_title || '',
    employee_id: (profile as any).employee_id || '',
    hire_date: (profile as any).hire_date || ''
  }));

  const getContractTypeColor = (contractType?: string) => {
    switch (contractType) {
      case 'CDI': return 'default';
      case 'CDD': return 'secondary';
      case 'Stage': return 'outline';
      case 'Freelance': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
            <div className="text-2xl font-bold text-primary">{profiles.length}</div>
          </CardContent>
        </Card>

        <Card className="modern-card hover-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CDI</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {extendedProfiles.filter(p => p.contract_type === 'CDI').length}
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
              {extendedProfiles.filter(p => p.contract_type !== 'CDI' && p.contract_type).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <div className="space-y-4">
        {extendedProfiles.length === 0 ? (
          <Card className="modern-card">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun employé trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
            {extendedProfiles.map((employee) => (
              <Card key={employee.id} className="modern-card hover-glow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={employee.avatar_url || undefined} 
                        alt={employee.full_name} 
                      />
                      <AvatarFallback>
                        {employee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {employee.full_name}
                      </h3>
                      
                      {employee.job_title && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {employee.job_title}
                        </p>
                      )}

                      <div className="space-y-2">
                        {employee.employee_id && (
                          <p className="text-xs text-muted-foreground">
                            <strong>ID:</strong> {employee.employee_id}
                          </p>
                        )}
                        
                        {employee.hire_date && (
                          <p className="text-xs text-muted-foreground">
                            <strong>Embauché le:</strong> {new Date(employee.hire_date).toLocaleDateString()}
                          </p>
                        )}

                        {employee.contract_type && (
                          <Badge variant={getContractTypeColor(employee.contract_type)} className="text-xs">
                            {employee.contract_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};