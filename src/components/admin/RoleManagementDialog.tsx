import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { withUniversalDialog } from '@/components/ui/universal-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  UserPlus,
  Shield,
  Settings,
  Crown,
  Briefcase,
  User,
  Eye,
  Search,
  Calendar,
  Building,
} from 'lucide-react';
import { useRoleManagement } from '@/hooks/useRoleManagement';
import { useEmployees } from '@/hooks/useEmployees';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RoleManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RoleManagementDialogBase: React.FC<RoleManagementDialogProps> = ({ open, onOpenChange }) => {
  const {
    roles,
    permissions,
    userRoles,
    loading,
    assignUserRole,
    removeUserRole,
    getRolePermissions,
    updateRolePermissions,
    getPermissionsByResource,
  } = useRoleManagement();

  const { employees } = useEmployees();

  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [contextType, setContextType] = useState<string>('global');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRolePermissions, setEditingRolePermissions] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);

  const getRoleIcon = (roleName: string) => {
    switch (roleName) {
      case 'tenant_admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'hr_manager':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'project_manager':
        return <Briefcase className="h-4 w-4 text-green-500" />;
      case 'team_lead':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'employee':
        return <User className="h-4 w-4 text-gray-500" />;
      case 'contractor':
        return <User className="h-4 w-4 text-orange-500" />;
      case 'intern':
        return <User className="h-4 w-4 text-pink-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-400" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getHierarchyBadge = (level: number) => {
    if (level <= 10) return { label: 'Direction', variant: 'default' as const };
    if (level <= 30) return { label: 'Management', variant: 'secondary' as const };
    if (level <= 50) return { label: 'Opérationnel', variant: 'outline' as const };
    return { label: 'Externe', variant: 'destructive' as const };
  };

  const filteredUserRoles = userRoles.filter(ur => {
    const employee = employees.find(e => e.user_id === ur.user_id);
    return (
      employee?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ur.role.display_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleAssignRole = async () => {
    if (!selectedEmployee || !selectedRole) return;

    await assignUserRole(
      selectedEmployee,
      selectedRole,
      contextType,
      undefined, // context_id
      expiresAt || undefined
    );

    // Reset form
    setSelectedEmployee('');
    setSelectedRole('');
    setContextType('global');
    setExpiresAt('');
  };

  const handleEditRolePermissions = async (roleId: string) => {
    setEditingRolePermissions(roleId);
    const perms = await getRolePermissions(roleId);
    setRolePermissions(perms.map(p => p.id));
  };

  const handleSaveRolePermissions = async () => {
    if (!editingRolePermissions) return;

    await updateRolePermissions(editingRolePermissions, rolePermissions);
    setEditingRolePermissions('');
    setRolePermissions([]);
  };

  const permissionsByResource = getPermissionsByResource();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestion des Rôles et Permissions
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="user-roles" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="user-roles">Rôles Utilisateurs</TabsTrigger>
            <TabsTrigger value="roles">Rôles Système</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>

          {/* Onglet Rôles Utilisateurs */}
          <TabsContent value="user-roles" className="flex flex-1 flex-col overflow-hidden">
            <div className="grid flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-2">
              {/* Assignation de rôles */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Assigner un Rôle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="employee">Employé</Label>
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un employé" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map(employee => (
                          <SelectItem key={employee.id} value={employee.user_id || employee.id}>
                            {employee.full_name} - {employee.job_title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="role">Rôle</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center gap-2">
                              {getRoleIcon(role.name)}
                              {role.display_name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="context">Contexte</Label>
                    <Select value={contextType} onValueChange={setContextType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="global">Global</SelectItem>
                        <SelectItem value="project">Projet spécifique</SelectItem>
                        <SelectItem value="department">Département spécifique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="expires">Date d'expiration (optionnel)</Label>
                    <Input
                      id="expires"
                      type="date"
                      value={expiresAt}
                      onChange={e => setExpiresAt(e.target.value)}
                    />
                  </div>

                  <Button
                    onClick={handleAssignRole}
                    disabled={!selectedEmployee || !selectedRole || loading}
                    className="w-full"
                  >
                    Assigner le Rôle
                  </Button>
                </CardContent>
              </Card>

              {/* Liste des rôles assignés */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Rôles Assignés</h3>
                  <div className="relative">
                    <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-64 pl-8"
                    />
                  </div>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {filteredUserRoles.map(userRole => {
                      const employee = employees.find(e => e.user_id === userRole.user_id);
                      const hierarchyBadge = getHierarchyBadge(userRole.role.hierarchy_level);

                      return (
                        <Card key={userRole.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {getRoleIcon(userRole.role.name)}
                                <div>
                                  <p className="font-medium">
                                    {employee?.full_name || 'Utilisateur inconnu'}
                                  </p>
                                  <p className="text-muted-foreground text-sm">
                                    {employee?.job_title}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1">
                                <Badge variant={hierarchyBadge.variant}>
                                  {userRole.role.display_name}
                                </Badge>
                                <div className="flex gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {userRole.context_type || 'Global'}
                                  </Badge>
                                  {userRole.expires_at && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Calendar className="mr-1 h-3 w-3" />
                                      Expire{' '}
                                      {formatDistanceToNow(new Date(userRole.expires_at), {
                                        addSuffix: true,
                                        locale: fr,
                                      })}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeUserRole(userRole.id)}
                            >
                              Retirer
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          {/* Onglet Rôles Système */}
          <TabsContent value="roles" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {roles.map(role => {
                  const hierarchyBadge = getHierarchyBadge(role.hierarchy_level);

                  return (
                    <Card key={role.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          {getRoleIcon(role.name)}
                          {role.display_name}
                          {role.is_system_role && (
                            <Badge variant="outline" className="text-xs">
                              Système
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <p className="text-muted-foreground text-sm">{role.description}</p>

                          <div className="flex items-center justify-between">
                            <Badge variant={hierarchyBadge.variant} className="text-xs">
                              {hierarchyBadge.label}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              Niveau {role.hierarchy_level}
                            </span>
                          </div>

                          <div className="text-muted-foreground text-xs">
                            {userRoles.filter(ur => ur.role_id === role.id).length} utilisateur(s)
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRolePermissions(role.id)}
                            className="w-full"
                          >
                            <Settings className="mr-1 h-3 w-3" />
                            Permissions
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Onglet Permissions */}
          <TabsContent value="permissions" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-6">
                {Object.entries(permissionsByResource).map(([resource, perms]) => (
                  <Card key={resource}>
                    <CardHeader>
                      <CardTitle className="capitalize">{resource}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {perms.map(permission => (
                          <div key={permission.id} className="rounded border p-3">
                            <div className="text-sm font-medium">{permission.display_name}</div>
                            <div className="text-muted-foreground text-xs">
                              {permission.description}
                            </div>
                            <div className="mt-2 flex gap-1">
                              <Badge variant="outline" className="text-xs">
                                {permission.action}
                              </Badge>
                              {permission.context && (
                                <Badge variant="secondary" className="text-xs">
                                  {permission.context}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Dialog pour éditer les permissions de rôle */}
        <Dialog open={!!editingRolePermissions} onOpenChange={() => setEditingRolePermissions('')}>
          <DialogContent className="max-h-[80vh] max-w-4xl overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                Permissions - {roles.find(r => r.id === editingRolePermissions)?.display_name}
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1">
              <div className="space-y-4">
                {Object.entries(permissionsByResource).map(([resource, perms]) => (
                  <Card key={resource}>
                    <CardHeader>
                      <CardTitle className="text-base capitalize">{resource}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {perms.map(permission => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={rolePermissions.includes(permission.id)}
                              onCheckedChange={checked => {
                                if (checked) {
                                  setRolePermissions(prev => [...prev, permission.id]);
                                } else {
                                  setRolePermissions(prev =>
                                    prev.filter(id => id !== permission.id)
                                  );
                                }
                              }}
                            />
                            <label htmlFor={permission.id} className="flex-1">
                              <div className="text-sm font-medium">{permission.display_name}</div>
                              <div className="text-muted-foreground text-xs">
                                {permission.description}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingRolePermissions('')}>
                Annuler
              </Button>
              <Button onClick={handleSaveRolePermissions}>Sauvegarder</Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};
// 🎨 Export avec support mobile automatique + thème Admin
export const RoleManagementDialog = withUniversalDialog('admin', RoleManagementDialogBase);
