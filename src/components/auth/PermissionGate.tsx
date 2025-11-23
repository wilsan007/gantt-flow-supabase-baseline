import React from 'react';
import { usePermission, useCanUser } from '@/hooks/usePermissions';
import { PermissionContext } from '@/lib/permissionManager';
import { AlertTriangle, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  action?: string;
  resource?: string;
  context?: Partial<PermissionContext>;
  fallback?: React.ReactNode;
  showFallback?: boolean;
  requireAll?: boolean; // Pour les permissions multiples
  permissions?: string[]; // Pour vérifier plusieurs permissions
}

/**
 * Composant pour contrôler l'affichage basé sur les permissions
 * Utilise le système de cache intelligent pour des performances optimales
 *
 * @security ⚠️ ATTENTION: Ce composant n'offre qu'une sécurité visuelle (UX).
 * Les véritables vérifications de sécurité DOIVENT être effectuées côté serveur
 * (RLS, Edge Functions, API) car tout code client peut être contourné.
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  action,
  resource,
  context,
  fallback,
  showFallback = false,
  requireAll = true,
  permissions = [],
}) => {
  // Vérification d'une permission spécifique
  const singlePermissionCheck = usePermission(permission || '', context);

  // Vérification d'une action/ressource
  const actionResourceCheck = useCanUser(action || '', resource || '', context);

  // Déterminer quelle vérification utiliser
  let hasAccess = false;
  let isLoading = false;

  if (permission) {
    hasAccess = singlePermissionCheck.granted;
    isLoading = singlePermissionCheck.isLoading;
  } else if (action && resource) {
    hasAccess = actionResourceCheck.canAccess;
    isLoading = actionResourceCheck.isLoading;
  }

  // Gestion du loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="text-muted-foreground flex animate-pulse items-center gap-2 text-sm">
          <div className="bg-muted h-4 w-4 rounded"></div>
          <span>Vérification des permissions...</span>
        </div>
      </div>
    );
  }

  // Si l'accès est accordé, afficher le contenu
  if (hasAccess) {
    return <>{children}</>;
  }

  // Si l'accès est refusé et qu'on doit afficher un fallback
  if (showFallback) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Fallback par défaut
    return (
      <Card className="border-muted-foreground/30 border-dashed">
        <CardContent className="flex items-center justify-center p-4">
          <div className="text-muted-foreground text-center">
            <Lock className="mx-auto mb-2 h-6 w-6 opacity-50" />
            <p className="text-sm">Accès restreint</p>
            <p className="text-xs opacity-70">Permissions insuffisantes pour afficher ce contenu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Par défaut, ne rien afficher si l'accès est refusé
  return null;
};

/**
 * Composant pour afficher un message d'accès refusé
 */
interface AccessDeniedProps {
  title?: string;
  message?: string;
  showIcon?: boolean;
  className?: string;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = 'Accès refusé',
  message = "Vous n'avez pas les permissions nécessaires pour accéder à cette fonctionnalité.",
  showIcon = true,
  className = '',
}) => {
  return (
    <Card className={`border-destructive/20 ${className}`}>
      <CardContent className="flex items-center gap-3 p-4">
        {showIcon && <AlertTriangle className="text-destructive h-5 w-5 flex-shrink-0" />}
        <div>
          <h4 className="text-destructive font-medium">{title}</h4>
          <p className="text-muted-foreground mt-1 text-sm">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * HOC pour protéger un composant entier
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permissionConfig: {
    permission?: string;
    action?: string;
    resource?: string;
    context?: Partial<PermissionContext>;
    fallback?: React.ComponentType;
  }
) {
  return function ProtectedComponent(props: P) {
    const FallbackComponent = permissionConfig.fallback || AccessDenied;

    return (
      <PermissionGate
        permission={permissionConfig.permission}
        action={permissionConfig.action}
        resource={permissionConfig.resource}
        context={permissionConfig.context}
        showFallback={true}
        fallback={<FallbackComponent />}
      >
        <Component {...props} />
      </PermissionGate>
    );
  };
}

/**
 * Hook pour conditionner l'affichage dans les composants
 */
export const useConditionalRender = (
  permission?: string,
  action?: string,
  resource?: string,
  context?: Partial<PermissionContext>
) => {
  const singlePermissionCheck = usePermission(permission || '', context);
  const actionResourceCheck = useCanUser(action || '', resource || '', context);

  let canRender = false;
  let isLoading = false;

  if (permission) {
    canRender = singlePermissionCheck.granted;
    isLoading = singlePermissionCheck.isLoading;
  } else if (action && resource) {
    canRender = actionResourceCheck.canAccess;
    isLoading = actionResourceCheck.isLoading;
  }

  return {
    canRender,
    isLoading,
    renderIf: (component: React.ReactNode) => (canRender ? component : null),
    renderUnless: (component: React.ReactNode) => (!canRender ? component : null),
  };
};

/**
 * Composant pour les boutons conditionnels
 */
interface ConditionalButtonProps {
  children: React.ReactNode;
  permission?: string;
  action?: string;
  resource?: string;
  context?: Partial<PermissionContext>;
  disabledFallback?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export const ConditionalButton: React.FC<ConditionalButtonProps> = ({
  children,
  permission,
  action,
  resource,
  context,
  disabledFallback,
  className = '',
  disabled = false,
  onClick,
}) => {
  const { canRender, isLoading } = useConditionalRender(permission, action, resource, context);

  if (isLoading) {
    return (
      <button className={`cursor-not-allowed opacity-50 ${className}`} disabled={true}>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
          Chargement...
        </div>
      </button>
    );
  }

  if (!canRender) {
    if (disabledFallback) {
      return <>{disabledFallback}</>;
    }
    return null;
  }

  return (
    <button className={className} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
};

/**
 * Composant pour les liens conditionnels
 */
interface ConditionalLinkProps {
  children: React.ReactNode;
  href?: string;
  to?: string;
  permission?: string;
  action?: string;
  resource?: string;
  context?: Partial<PermissionContext>;
  className?: string;
}

export const ConditionalLink: React.FC<ConditionalLinkProps> = ({
  children,
  href,
  to,
  permission,
  action,
  resource,
  context,
  className = '',
}) => {
  const { canRender, isLoading } = useConditionalRender(permission, action, resource, context);

  if (isLoading || !canRender) {
    return null;
  }

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  if (to) {
    // Assumant l'utilisation de React Router
    const Link = require('react-router-dom').Link;
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }

  return <>{children}</>;
};

export default PermissionGate;
