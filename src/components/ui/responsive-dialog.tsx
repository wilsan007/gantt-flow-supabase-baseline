/**
 * 🎨 RESPONSIVE DIALOG UNIVERSEL
 *
 * Dialog moderne et élégant qui s'adapte automatiquement :
 * - Desktop : Dialog classique (centré, overlay)
 * - Mobile : Drawer bottom sheet (glisse depuis le bas)
 *
 * Pattern: Linear, Notion, Slack
 *
 * Usage:
 * <ResponsiveDialog module="tasks" open={open} onOpenChange={setOpen} title="Créer une tâche">
 *   <TaskForm />
 * </ResponsiveDialog>
 */

import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { X } from '@/lib/icons';
import { getDialogTheme, type DialogModule } from '@/lib/dialog-themes';
import { cn } from '@/lib/utils';

export interface ResponsiveDialogProps {
  // État
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Contenu
  title: string;
  description?: string;
  children: React.ReactNode;

  // Module (pour le thème)
  module: DialogModule;

  // Footer personnalisé (optionnel)
  footer?: React.ReactNode;

  // Taille
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  // Options
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;

  // Classes custom
  className?: string;
  headerClassName?: string;
  contentClassName?: string;

  // Callbacks
  onClose?: () => void;
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  module,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
  headerClassName,
  contentClassName,
  onClose,
}: ResponsiveDialogProps) {
  const isMobile = useIsMobile();
  const theme = getDialogTheme(module);

  const handleClose = () => {
    onOpenChange(false);
    onClose?.();
  };

  // Tailles responsives
  const sizeClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md md:max-w-lg',
    lg: 'sm:max-w-lg md:max-w-xl lg:max-w-2xl',
    xl: 'sm:max-w-xl md:max-w-2xl lg:max-w-4xl',
    full: 'sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw]',
  };

  // Header avec thème
  const headerClasses = cn('border-b', theme.transition, headerClassName);

  // 📱 MOBILE : Drawer (Bottom Sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn('max-h-[90vh]', theme.bodyBg, theme.border, className)}>
          {/* Header Mobile */}
          <DrawerHeader className={cn(headerClasses, 'pb-4')}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <DrawerTitle
                  className={cn('text-left text-xl font-bold', theme.iconColor, theme.transition)}
                >
                  {title}
                </DrawerTitle>
                {description && (
                  <DrawerDescription className="text-muted-foreground mt-1 text-left text-sm">
                    {description}
                  </DrawerDescription>
                )}
              </div>
              {showCloseButton && (
                <DrawerClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-8 w-8 rounded-full',
                      theme.iconColor,
                      theme.transition,
                      'hover:bg-muted'
                    )}
                    onClick={handleClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              )}
            </div>
            {/* Barre de glisse (drag indicator) */}
            <div className="bg-muted mx-auto mt-4 h-1.5 w-16 rounded-full" />
          </DrawerHeader>

          {/* Contenu Mobile - Scrollable */}
          <div className={cn('flex-1 overflow-y-auto px-4 py-4', contentClassName)}>{children}</div>

          {/* Footer Mobile */}
          {footer && <DrawerFooter className="border-t pt-4">{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  // 💻 DESKTOP : Dialog classique
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          sizeClasses[size],
          'flex max-h-[90vh] flex-col',
          theme.bodyBg,
          theme.shadow,
          theme.transition,
          'animate-in fade-in-0 zoom-in-95 duration-300',
          className
        )}
        onPointerDownOutside={e => {
          if (!closeOnOverlayClick) {
            e.preventDefault();
          }
        }}
      >
        {/* Header Desktop */}
        <DialogHeader className={headerClasses}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className={cn('text-2xl font-bold', theme.iconColor, theme.transition)}>
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-muted-foreground mt-2 text-sm">
                  {description}
                </DialogDescription>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 shrink-0 rounded-full',
                  theme.iconColor,
                  theme.transition,
                  'hover:bg-muted'
                )}
                onClick={handleClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Contenu Desktop - Scrollable */}
        <div className={cn('flex-1 overflow-y-auto px-6 py-4', contentClassName)}>{children}</div>

        {/* Footer Desktop */}
        {footer && <DialogFooter className="border-t px-6 pt-4 pb-6">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

/**
 * 🎨 Bouton avec thème du module
 */
export interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  module: DialogModule;
  variant?: 'primary' | 'secondary' | 'ghost';
  loading?: boolean;
  children: React.ReactNode;
}

export function ThemedButton({
  module,
  variant = 'primary',
  loading,
  children,
  className,
  disabled,
  ...props
}: ThemedButtonProps) {
  const theme = getDialogTheme(module);

  const variantClasses = {
    primary: `${theme.gradient} ${theme.gradientHover} text-white shadow-lg ${theme.shadow}`,
    secondary: `bg-muted hover:bg-muted/80 ${theme.iconColor}`,
    ghost: `hover:bg-muted ${theme.iconColor}`,
  };

  return (
    <Button
      className={cn(variantClasses[variant], theme.transition, 'font-medium', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </Button>
  );
}

/**
 * 🏷️ Badge avec thème du module
 */
export interface ThemedBadgeProps {
  module: DialogModule;
  children: React.ReactNode;
  className?: string;
}

export function ThemedBadge({ module, children, className }: ThemedBadgeProps) {
  const theme = getDialogTheme(module);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        theme.badgeBg,
        theme.iconColor,
        theme.transition,
        className
      )}
    >
      {children}
    </span>
  );
}
