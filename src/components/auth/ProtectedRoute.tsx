import React from 'react';
import { Navigate } from 'react-router-dom';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredAccess?: keyof ReturnType<typeof useRoleBasedAccess>['accessRights'];
  requiredRole?: string;
  requiredPermission?: string;
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

/**
 * Composant pour protéger les routes basé sur les rôles et permissions
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredAccess,
  requiredRole,
  requiredPermission,
  fallbackPath = '/',
  showAccessDenied = true
}) => {
  const {
    accessRights,
    isLoading,
    hasRole,
    hasPermission,
    canAccess,
    getUserRoleNames,
    getAccessLevel,
    getAccessRestrictions
  } = useRoleBasedAccess();

  // Afficher un loader pendant la vérification des rôles
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Vérifier l'accès basé sur les critères fournis
  let hasAccess = true;
  let denialReason = '';

  if (requiredAccess && !canAccess(requiredAccess)) {
    hasAccess = false;
    denialReason = `Accès requis : ${requiredAccess}`;
  }

  if (requiredRole && !hasRole(requiredRole as any)) {
    hasAccess = false;
    denialReason = `Rôle requis : ${requiredRole}`;
  }

  if (requiredPermission && !hasPermission(requiredPermission as any)) {
    hasAccess = false;
    denialReason = `Permission requise : ${requiredPermission}`;
  }

  // Si l'accès est refusé
  if (!hasAccess) {
    if (!showAccessDenied) {
      return <Navigate to={fallbackPath} replace />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-red-600">
              Accès Refusé
            </CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Raison du refus */}
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium text-red-700">Raison :</span>
              </div>
              <p className="text-sm text-red-600 mt-1">{denialReason}</p>
            </div>

            {/* Informations sur les rôles actuels */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Vos rôles actuels :</p>
              <div className="flex flex-wrap gap-2">
                {getUserRoleNames().length > 0 ? (
                  getUserRoleNames().map((role) => (
                    <Badge key={role} variant="secondary">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">Aucun rôle assigné</Badge>
                )}
              </div>
            </div>

            {/* Niveau d'accès */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Niveau d'accès :</p>
              <Badge variant={
                getAccessLevel() === 'super_admin' ? 'default' :
                getAccessLevel() === 'admin' ? 'secondary' :
                getAccessLevel() === 'advanced' ? 'outline' :
                'destructive'
              }>
                {getAccessLevel()}
              </Badge>
            </div>

            {/* Restrictions d'accès */}
            {getAccessRestrictions().length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Restrictions actuelles :</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {getAccessRestrictions().map((restriction, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                      {restriction}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="pt-4 space-y-2">
              <Button 
                onClick={() => window.history.back()} 
                variant="outline" 
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <Button 
                onClick={() => window.location.href = fallbackPath} 
                className="w-full"
              >
                Aller au tableau de bord
              </Button>
            </div>

            {/* Message d'aide */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Si vous pensez que c'est une erreur, contactez votre administrateur.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // L'accès est autorisé, afficher le contenu
  return <>{children}</>;
};
