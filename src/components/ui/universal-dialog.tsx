/**
 * 🎨 UNIVERSAL DIALOG - Wrapper Intelligent
 *
 * Transforme automatiquement les Dialog classiques :
 * - 📱 Mobile → Drawer (bottom sheet)
 * - 💻 Desktop → Dialog classique
 * - 🎨 Thème automatique par module
 *
 * ✅ Zéro refactoring des dialogs existants
 * ✅ Support mobile instantané
 * ✅ Migration progressive possible
 *
 * Usage:
 * <UniversalDialog module="tasks">
 *   <Dialog open={open} onOpenChange={setOpen}>
 *     <DialogContent>...</DialogContent>
 *   </Dialog>
 * </UniversalDialog>
 */

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Drawer, DrawerClose, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X } from '@/lib/icons';
import { getDialogTheme, type DialogModule } from '@/lib/dialog-themes';
import { cn } from '@/lib/utils';

export interface UniversalDialogProps {
  /** Module pour appliquer le bon thème */
  module: DialogModule;

  /** Contenu (Dialog classique) */
  children: React.ReactNode;

  /** Classe CSS custom */
  className?: string;

  /** Désactiver le mode mobile (force desktop) */
  forceMobileOff?: boolean;
}

/**
 * Wrapper qui transforme automatiquement Dialog → Drawer sur mobile
 */
export function UniversalDialog({
  module,
  children,
  className,
  forceMobileOff = false,
}: UniversalDialogProps) {
  const isMobile = useIsMobile();
  const theme = getDialogTheme(module);

  // Desktop OU force desktop → Retourne le Dialog classique avec thème appliqué
  if (!isMobile || forceMobileOff) {
    return (
      <div
        className={cn('universal-dialog-desktop', theme.transition, className)}
        style={
          {
            // @ts-ignore - CSS variables pour le thème
            '--dialog-theme-primary': theme.primary,
            '--dialog-theme-bg': theme.bodyBg,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    );
  }

  // 📱 MOBILE → Wrapper intelligent pour transformer en Drawer
  return (
    <MobileDialogWrapper module={module} className={className}>
      {children}
    </MobileDialogWrapper>
  );
}

/**
 * 📱 Wrapper Mobile - Extrait props du Dialog et crée un Drawer
 */
function MobileDialogWrapper({
  module,
  children,
  className,
}: {
  module: DialogModule;
  children: React.ReactNode;
  className?: string;
}) {
  const theme = getDialogTheme(module);
  const [isOpen, setIsOpen] = React.useState(false);

  // Extrait les props du Dialog enfant
  const dialogChild = React.Children.only(children) as React.ReactElement;
  const { open, onOpenChange, children: dialogContent } = dialogChild.props;

  // Synchronise l'état
  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerContent
        className={cn('max-h-[90vh]', theme.bodyBg, theme.border, theme.transition, className)}
      >
        {/* Barre de glisse (drag indicator) */}
        <div className="mx-auto mt-2 h-1.5 w-16 rounded-full bg-muted" />

        {/* Contenu avec thème */}
        <div className={cn('flex flex-1 flex-col overflow-hidden', theme.bodyBg)}>
          <MobileDialogContent theme={theme}>{dialogContent}</MobileDialogContent>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/**
 * Transforme DialogContent → Contenu Drawer stylisé
 */
function MobileDialogContent({
  theme,
  children,
}: {
  theme: ReturnType<typeof getDialogTheme>;
  children: React.ReactNode;
}) {
  // Extrait DialogContent
  const contentChild = React.Children.toArray(children).find(
    child =>
      React.isValidElement(child) && (child.type as any)?.displayName?.includes('DialogContent')
  ) as React.ReactElement | undefined;

  if (!contentChild) {
    return <div className="p-4">{children}</div>;
  }

  const contentChildren = contentChild.props.children;
  const childrenArray = React.Children.toArray(contentChildren);

  // Extrait Header, Body, Footer
  const header = childrenArray.find(
    child =>
      React.isValidElement(child) && (child.type as any)?.displayName?.includes('DialogHeader')
  ) as React.ReactElement | undefined;

  const footer = childrenArray.find(
    child =>
      React.isValidElement(child) && (child.type as any)?.displayName?.includes('DialogFooter')
  ) as React.ReactElement | undefined;

  const body = childrenArray.filter(child => child !== header && child !== footer);

  // Extrait Title et Description du Header
  let title: React.ReactNode;
  let description: React.ReactNode;

  if (header) {
    const headerChildren = React.Children.toArray((header as React.ReactElement).props.children);

    title = headerChildren.find(
      child =>
        React.isValidElement(child) && (child.type as any)?.displayName?.includes('DialogTitle')
    );

    description = headerChildren.find(
      child =>
        React.isValidElement(child) &&
        (child.type as any)?.displayName?.includes('DialogDescription')
    );
  }

  return (
    <>
      {/* Header Mobile */}
      {header && (
        <div className={cn('border-b px-4 py-4', theme.border, theme.headerBg)}>
          {title && (
            <div className={cn('text-xl font-bold', theme.iconColor, theme.transition)}>
              {(title as React.ReactElement).props.children}
            </div>
          )}
          {description && (
            <div className="mt-1 text-sm text-muted-foreground">
              {(description as React.ReactElement).props.children}
            </div>
          )}
        </div>
      )}

      {/* Body Mobile - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-4">{body}</div>

      {/* Footer Mobile */}
      {footer && (
        <div className="border-t px-4 py-4">{(footer as React.ReactElement).props.children}</div>
      )}
    </>
  );
}

/**
 * 🎨 Hook pour appliquer le thème d'un module
 *
 * Usage dans les composants existants:
 * const theme = useDialogTheme('tasks');
 * <Button className={theme.buttonClass}>...</Button>
 */
export function useDialogTheme(module: DialogModule) {
  const theme = getDialogTheme(module);

  return React.useMemo(
    () => ({
      ...theme,
      // Classes utilitaires
      buttonClass: `${theme.gradient} ${theme.gradientHover} text-white ${theme.transition}`,
      headerClass: `${theme.headerBg} ${theme.border} border-b`,
      badgeClass: `${theme.badgeBg} ${theme.iconColor}`,
      iconClass: theme.iconColor,
    }),
    [theme]
  );
}

/**
 * 🎨 HOC pour ajouter le support UniversalDialog à un Dialog existant
 *
 * Usage:
 * export const MyDialog = withUniversalDialog('tasks', MyDialogComponent);
 */
export function withUniversalDialog<P extends object>(
  module: DialogModule,
  Component: React.ComponentType<P>
) {
  return function UniversalDialogWrapper(props: P) {
    return (
      <UniversalDialog module={module}>
        <Component {...props} />
      </UniversalDialog>
    );
  };
}
