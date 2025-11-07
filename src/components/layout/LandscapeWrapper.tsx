/**
 * Higher-Order Component pour forcer le mode paysage
 * Enveloppe les vues complexes (Table, Gantt, Kanban)
 * Pattern: HOC React moderne avec TypeScript
 */

import React from 'react';
import { useForceLandscape } from '@/hooks/useForcelandscape';
import { useOrientationPreference } from '@/hooks/useOrientationPreference';
import { RotateDeviceMessage } from '@/components/ui/rotate-device-message';

interface LandscapeWrapperProps {
  children: React.ReactNode;
  /**
   * Force la rotation même sur tablette
   * Par défaut: true
   */
  forceOnTablet?: boolean;
  /**
   * Message personnalisé
   */
  customMessage?: string;
  /**
   * Classe CSS additionnelle
   */
  className?: string;
  /**
   * Type de vue pour les préférences
   */
  viewType?: 'table' | 'gantt' | 'kanban';
}

/**
 * Composant wrapper qui force le mode paysage sur mobile/tablette
 * Affiche un message élégant en mode portrait
 *
 * @example
 * <LandscapeWrapper>
 *   <GanttChart {...props} />
 * </LandscapeWrapper>
 */
export const LandscapeWrapper: React.FC<LandscapeWrapperProps> = ({
  children,
  forceOnTablet = true,
  customMessage,
  className = '',
  viewType,
}) => {
  const { shouldShowRotateMessage, deviceType, isLandscape } = useForceLandscape();
  const { shouldForceOrientation, dismissView } = useOrientationPreference();

  // Sur desktop, toujours afficher le contenu
  if (deviceType === 'desktop') {
    return <>{children}</>;
  }

  // Vérifier les préférences utilisateur
  if (viewType && !shouldForceOrientation(viewType)) {
    return <>{children}</>;
  }

  // Sur tablette, vérifier si on force la rotation
  if (deviceType === 'tablet' && !forceOnTablet) {
    return <>{children}</>;
  }

  // Handler pour "Ne plus afficher"
  const handleDismiss = () => {
    if (viewType) {
      dismissView(viewType);
    }
  };

  // Afficher le message de rotation si nécessaire
  if (shouldShowRotateMessage) {
    return (
      <RotateDeviceMessage
        message={customMessage}
        className={className}
        onDismiss={viewType ? handleDismiss : undefined}
        showDismissButton={!!viewType}
      />
    );
  }

  // Mode paysage OK, afficher le contenu avec optimisations
  return (
    <div className={`landscape-optimized h-full w-full ${className}`}>
      {children}

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .landscape-optimized {
          /* Optimisations spécifiques au mode paysage */
          --safe-area-inset-left: env(safe-area-inset-left, 0);
          --safe-area-inset-right: env(safe-area-inset-right, 0);
          padding-left: var(--safe-area-inset-left);
          padding-right: var(--safe-area-inset-right);
        }

        /* Désactiver le scroll bounce sur iOS */
        @media (max-width: 1024px) and (orientation: landscape) {
          .landscape-optimized {
            overscroll-behavior: none;
            -webkit-overflow-scrolling: touch;
          }
        }
      `,
        }}
      />
    </div>
  );
};

/**
 * HOC pour wrapper automatiquement un composant
 *
 * @example
 * export default withLandscape(GanttChart);
 */
export function withLandscape<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<LandscapeWrapperProps, 'children'>
) {
  return function WithLandscapeComponent(props: P) {
    return (
      <LandscapeWrapper {...options}>
        <Component {...props} />
      </LandscapeWrapper>
    );
  };
}
