/**
 * AccessDenied - Composant pour afficher les restrictions d'accès
 * Pattern: Notion, Linear, Monday.com - Messages clairs et professionnels
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, UserX, AlertCircle, Info, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type AccessDeniedReason =
  | 'no_role' // Aucun rôle assigné
  | 'insufficient_permissions' // Permissions insuffisantes
  | 'wrong_tenant' // Mauvais tenant
  | 'module_restricted' // Module restreint
  | 'feature_restricted' // Fonctionnalité restreinte
  | 'no_data'; // Aucune donnée disponible

interface AccessDeniedProps {
  reason: AccessDeniedReason;
  module?: string;
  requiredRole?: string;
  requiredPermission?: string;
  currentRole?: string;
  contactEmail?: string;
  onGoBack?: () => void;
  showContactButton?: boolean;
}

const REASON_CONFIG: Record<
  AccessDeniedReason,
  {
    icon: React.ReactNode;
    title: string;
    description: (props: AccessDeniedProps) => string;
    suggestion: string;
    color: string;
  }
> = {
  no_role: {
    icon: <UserX className="h-8 w-8" />,
    title: 'Aucun rôle assigné',
    description: () => "Vous n'avez pas encore de rôle assigné dans cette organisation.",
    suggestion: "Contactez votre administrateur pour qu'il vous assigne un rôle approprié.",
    color: 'text-orange-500',
  },
  insufficient_permissions: {
    icon: <Shield className="h-8 w-8" />,
    title: 'Permissions insuffisantes',
    description: props => {
      if (props.currentRole && props.requiredRole && props.module) {
        return `Vous êtes "${props.currentRole}" alors qu'il faut être "${props.requiredRole}" pour accéder au module "${props.module}".`;
      }
      if (props.module && props.requiredRole) {
        return `L'accès au module "${props.module}" nécessite le rôle "${props.requiredRole}".`;
      }
      if (props.requiredPermission) {
        return `Cette action nécessite la permission "${props.requiredPermission}".`;
      }
      return "Vous n'avez pas les permissions nécessaires pour accéder à cette ressource.";
    },
    suggestion: "Demandez à votre administrateur d'ajuster vos permissions.",
    color: 'text-red-500',
  },
  wrong_tenant: {
    icon: <Lock className="h-8 w-8" />,
    title: 'Organisation incorrecte',
    description: () => 'Ces données appartiennent à une autre organisation.',
    suggestion: 'Vérifiez que vous êtes connecté à la bonne organisation.',
    color: 'text-yellow-500',
  },
  module_restricted: {
    icon: <AlertCircle className="h-8 w-8" />,
    title: 'Module restreint',
    description: props =>
      `Le module "${props.module || 'ce module'}" est réservé aux utilisateurs autorisés.`,
    suggestion: "Contactez votre administrateur pour obtenir l'accès.",
    color: 'text-blue-500',
  },
  feature_restricted: {
    icon: <Lock className="h-8 w-8" />,
    title: 'Fonctionnalité restreinte',
    description: () => "Cette fonctionnalité n'est pas disponible avec votre rôle actuel.",
    suggestion: 'Mettez à niveau votre rôle pour accéder à cette fonctionnalité.',
    color: 'text-purple-500',
  },
  no_data: {
    icon: <Info className="h-8 w-8" />,
    title: 'Aucune donnée disponible',
    description: props =>
      `Aucune donnée n'est disponible dans le module "${props.module || 'ce module'}".`,
    suggestion: "Les données seront visibles une fois qu'elles auront été créées.",
    color: 'text-gray-500',
  },
};

export const AccessDenied: React.FC<AccessDeniedProps> = ({
  reason,
  module,
  requiredRole,
  requiredPermission,
  currentRole,
  contactEmail = 'admin@wadashaqeen.com',
  onGoBack,
  showContactButton = true,
}) => {
  const navigate = useNavigate();
  const config = REASON_CONFIG[reason];

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      navigate(-1);
    }
  };

  const handleContactAdmin = () => {
    window.location.href = `mailto:${contactEmail}?subject=Demande d'accès - ${module || 'Module'}&body=Bonjour,%0D%0A%0D%0AJe souhaiterais obtenir l'accès au module "${module || 'ce module'}".%0D%0A%0D%0ARôle actuel: ${currentRole || 'Non assigné'}%0D%0ARôle requis: ${requiredRole || 'Non spécifié'}%0D%0A%0D%0AMerci.`;
  };

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 ${config.color}`}>{config.icon}</div>
          <CardTitle className="text-2xl">{config.title}</CardTitle>
          <CardDescription className="mt-2 text-base">
            {config.description({ reason, module, requiredRole, requiredPermission, currentRole })}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informations détaillées */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Suggestion</AlertTitle>
            <AlertDescription>{config.suggestion}</AlertDescription>
          </Alert>

          {/* Informations sur le rôle actuel */}
          {currentRole && (
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-sm font-medium">Informations sur votre compte :</p>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  • <strong>Rôle actuel :</strong> {currentRole}
                </p>
                {requiredRole && (
                  <p>
                    • <strong>Rôle requis :</strong> {requiredRole}
                  </p>
                )}
                {requiredPermission && (
                  <p>
                    • <strong>Permission requise :</strong> {requiredPermission}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button variant="outline" onClick={handleGoBack} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>

            {showContactButton && (
              <Button onClick={handleContactAdmin} className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contacter l'administrateur
              </Button>
            )}
          </div>

          {/* Note de sécurité */}
          <p className="text-center text-xs text-muted-foreground">
            Ces restrictions sont en place pour protéger les données sensibles de votre
            organisation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Composant compact pour afficher un message d'accès refusé inline
 */
export const AccessDeniedInline: React.FC<
  Pick<AccessDeniedProps, 'reason' | 'module' | 'requiredRole'>
> = ({ reason, module, requiredRole }) => {
  const config = REASON_CONFIG[reason];

  return (
    <Alert variant="destructive" className="my-4">
      <div className="flex items-start gap-3">
        <div className={config.color}>{config.icon}</div>
        <div className="flex-1">
          <AlertTitle>{config.title}</AlertTitle>
          <AlertDescription>
            {config.description({ reason, module, requiredRole })}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
};

/**
 * Hook pour détecter automatiquement le type de restriction
 */
export const useAccessDeniedReason = (
  hasRole: boolean,
  hasPermission: boolean,
  hasData: boolean,
  module?: string
): AccessDeniedReason | null => {
  if (!hasRole) return 'no_role';
  if (!hasPermission) return 'insufficient_permissions';
  if (!hasData) return 'no_data';
  return null;
};
