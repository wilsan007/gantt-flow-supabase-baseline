import React, { useState } from 'react';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Crown, 
  Shield, 
  Users, 
  Briefcase, 
  User, 
  ChevronDown,
  CheckCircle,
  XCircle
} from 'lucide-react';

/**
 * Composant pour afficher le rôle de l'utilisateur et ses permissions
 */
export const RoleIndicator = () => {
  const {
    isLoading,
    isSuperAdmin,
    isTenantAdmin,
    isHRManager,
    isProjectManager,
    getUserRoleNames,
    getAccessLevel,
    getAvailableFeatures,
    getAccessRestrictions,
    accessRights
  } = useRoleBasedAccess();

  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 w-20 bg-muted rounded"></div>
      </div>
    );
  }

  // Déterminer l'icône et la couleur basées sur le rôle principal
  const getRoleDisplay = () => {
    if (isSuperAdmin) {
      return {
        icon: Crown,
        label: 'Super Admin',
        variant: 'default' as const,
        color: 'text-yellow-600'
      };
    }
    if (isTenantAdmin) {
      return {
        icon: Shield,
        label: 'Admin',
        variant: 'secondary' as const,
        color: 'text-blue-600'
      };
    }
    if (isHRManager) {
      return {
        icon: Users,
        label: 'RH Manager',
        variant: 'outline' as const,
        color: 'text-green-600'
      };
    }
    if (isProjectManager) {
      return {
        icon: Briefcase,
        label: 'Chef de Projet',
        variant: 'outline' as const,
        color: 'text-purple-600'
      };
    }
    return {
      icon: User,
      label: 'Employé',
      variant: 'outline' as const,
      color: 'text-gray-600'
    };
  };

  const roleDisplay = getRoleDisplay();
  const IconComponent = roleDisplay.icon;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <IconComponent className={`h-4 w-4 mr-1 ${roleDisplay.color}`} />
          <span className="text-sm font-medium">{roleDisplay.label}</span>
          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 space-y-4">
          {/* En-tête avec rôle principal */}
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className={`p-2 rounded-full bg-muted ${roleDisplay.color}`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <p className="font-medium">{roleDisplay.label}</p>
              <p className="text-xs text-muted-foreground">
                Niveau : {getAccessLevel()}
              </p>
            </div>
          </div>

          {/* Tous les rôles */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Rôles assignés :</p>
            <div className="flex flex-wrap gap-1">
              {getUserRoleNames().map((role) => (
                <Badge key={role} variant="secondary" className="text-xs">
                  {role}
                </Badge>
              ))}
            </div>
          </div>

          {/* Fonctionnalités disponibles */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Accès autorisé :</p>
            <div className="space-y-1">
              {getAvailableFeatures().map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-xs">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Restrictions */}
          {getAccessRestrictions().length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Restrictions :</p>
              <div className="space-y-1">
                {getAccessRestrictions().map((restriction, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span>{restriction}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Permissions spécifiques */}
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">Permissions détaillées :</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1">
                {accessRights.canManageUsers ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Gestion utilisateurs</span>
              </div>
              <div className="flex items-center gap-1">
                {accessRights.canManageProjects ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Gestion projets</span>
              </div>
              <div className="flex items-center gap-1">
                {accessRights.canViewReports ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Rapports</span>
              </div>
              <div className="flex items-center gap-1">
                {accessRights.canManageRoles ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Gestion rôles</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
