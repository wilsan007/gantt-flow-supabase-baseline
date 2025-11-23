import * as React from 'react';

// Breakpoints standards de l'industrie
const MOBILE_BREAKPOINT = 768; // Pour les modales: mobile portrait strict
const LAYOUT_BREAKPOINT = 1024; // Pour l'UI: mobile + tablette (portrait + paysage)

/**
 * Hook pour détecter le mobile STRICT (< 768px)
 * Utilisé pour les MODALES: Drawer vs Dialog
 * - < 768px = Mobile portrait → Drawer (bottom sheet)
 * - >= 768px = Tablette/Desktop → Dialog classique
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}

/**
 * Hook pour détecter le layout mobile (< 1024px)
 * Utilisé pour l'UI: cacher éléments, layout compact, etc.
 * - < 1024px = Mobile/Tablette (portrait + paysage) → UI compacte
 * - >= 1024px = Desktop → UI complète
 */
export function useIsMobileLayout() {
  const [isMobileLayout, setIsMobileLayout] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${LAYOUT_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobileLayout(window.innerWidth < LAYOUT_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobileLayout(window.innerWidth < LAYOUT_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobileLayout;
}
