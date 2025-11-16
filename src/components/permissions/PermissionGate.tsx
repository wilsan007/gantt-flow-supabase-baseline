import React from 'react';
import { Lock } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PermissionGateProps {
  /** Permission requise pour afficher le contenu */
  hasPermission: boolean;

  /** Contenu à afficher si permission accordée */
  children: React.ReactNode;

  /** Message à afficher si permission refusée */
  deniedMessage?: string;

  /** Fallback UI si permission refusée (par défaut: icône cadenas) */
  deniedFallback?: React.ReactNode;

  /** Mode d'affichage (défaut: 'hide') */
  mode?: 'hide' | 'disable' | 'lock';

  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * 🛡️ PermissionGate - Composant de Protection des Permissions
 *
 * Style Monday.com / Linear :
 * - 'hide' : Ne rien afficher si pas de permission
 * - 'disable' : Afficher grisé et non cliquable
 * - 'lock' : Afficher avec icône cadenas + tooltip
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  hasPermission,
  children,
  deniedMessage = "Vous n'avez pas la permission de modifier ce champ",
  deniedFallback,
  mode = 'hide',
  className,
}) => {
  // Mode 'hide' : Ne rien rendre si pas de permission
  if (!hasPermission && mode === 'hide') {
    return null;
  }

  // Si permission accordée, afficher normalement
  if (hasPermission) {
    return <>{children}</>;
  }

  // Mode 'disable' : Afficher désactivé
  if (mode === 'disable') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('pointer-events-none cursor-not-allowed opacity-50', className)}>
              {children}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{deniedMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Mode 'lock' : Afficher avec cadenas
  const lockFallback = deniedFallback || (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
            <Lock className="h-3 w-3" />
            <span className="text-xs italic">Protégé</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{deniedMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return <>{lockFallback}</>;
};

/**
 * Wrapper pour cellules éditables avec permission
 */
interface EditableWithPermissionProps {
  canEdit: boolean;
  children: React.ReactNode;
  readOnlyValue: React.ReactNode;
  deniedMessage?: string;
}

export const EditableWithPermission: React.FC<EditableWithPermissionProps> = ({
  canEdit,
  children,
  readOnlyValue,
  deniedMessage,
}) => {
  if (!canEdit) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-muted-foreground">
              {readOnlyValue}
              <Lock className="h-3 w-3 opacity-50" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{deniedMessage || 'Modification non autorisée'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{children}</>;
};
