import * as React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface ResponsiveModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ResponsiveModal({ children, open, onOpenChange }: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

export function ResponsiveModalTrigger({
  className,
  children,
  asChild,
  ...props
}: React.ComponentProps<typeof DialogTrigger>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <DrawerTrigger className={className} asChild={asChild} {...props}>
        {children}
      </DrawerTrigger>
    );
  }

  return (
    <DialogTrigger className={className} asChild={asChild} {...props}>
      {children}
    </DialogTrigger>
  );
}

export function ResponsiveModalContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogContent>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <DrawerContent className={cn(className)} {...props}>
        {children}
      </DrawerContent>
    );
  }

  return (
    <DialogContent className={cn('max-h-[90vh]', className)} {...props}>
      {children}
    </DialogContent>
  );
}

export function ResponsiveModalHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerHeader className={className} {...props} />;
  }

  return <DialogHeader className={className} {...props} />;
}

export function ResponsiveModalFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerFooter className={className} {...props} />;
  }

  return <DialogFooter className={className} {...props} />;
}

export function ResponsiveModalTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogTitle>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerTitle className={className} {...props} />;
  }

  return <DialogTitle className={className} {...props} />;
}

export function ResponsiveModalDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription>) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <DrawerDescription className={className} {...props} />;
  }

  return <DialogDescription className={className} {...props} />;
}
