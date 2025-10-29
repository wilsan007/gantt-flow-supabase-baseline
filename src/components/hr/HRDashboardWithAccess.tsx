/**
 * HRDashboardWithAccess - Dashboard RH avec gestion d'accès
 * Affiche un message clair si l'utilisateur n'a pas accès
 */

import React from 'react';
import { useHRMinimal } from '@/hooks/useHRMinimal';
import { AccessDenied } from '@/components/ui/access-denied';
import { LoadingState } from '@/components/table/LoadingState';

interface HRDashboardWithAccessProps {
  children: React.ReactNode;
}

export const HRDashboardWithAccess: React.FC<HRDashboardWithAccessProps> = ({ children }) => {
  const { loading, canAccess, accessInfo } = useHRMinimal();

  // Afficher le loader pendant le chargement
  if (loading) {
    return <LoadingState message="Vérification des permissions..." />;
  }

  // Afficher le message d'accès refusé si nécessaire
  if (!canAccess && accessInfo?.reason) {
    return (
      <AccessDenied
        reason={accessInfo.reason as any}
        module="Ressources Humaines"
        currentRole={accessInfo.currentRole}
        requiredRole={accessInfo.requiredRole}
      />
    );
  }

  // Afficher le contenu si l'utilisateur a accès
  return <>{children}</>;
};
