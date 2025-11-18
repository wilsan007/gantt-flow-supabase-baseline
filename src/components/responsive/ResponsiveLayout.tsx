import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveLayout({ children, className = '' }: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={` ${isMobile ? 'px-2 py-2' : 'px-4 py-4'} relative min-h-screen w-full overflow-x-hidden ${className} `}
    >
      {/* Animated background elements - smaller on mobile */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={`from-primary/20 to-accent/20 absolute -top-40 -right-40 animate-pulse rounded-full bg-gradient-to-br blur-3xl ${isMobile ? 'h-40 w-40' : 'h-80 w-80'} `}
        ></div>
        <div
          className={`from-accent/20 to-tech-cyan/20 absolute -bottom-40 -left-40 animate-pulse rounded-full bg-gradient-to-tr blur-3xl ${isMobile ? 'h-40 w-40' : 'h-80 w-80'} `}
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className={`from-tech-purple/10 to-tech-blue/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform animate-pulse rounded-full bg-gradient-to-br blur-3xl ${isMobile ? 'h-48 w-48' : 'h-96 w-96'} `}
          style={{ animationDelay: '4s' }}
        ></div>
      </div>

      {/* Contenu pleine largeur pour optimiser l'espace tableau */}
      <div className="relative z-10 w-full max-w-full">{children}</div>
    </div>
  );
}
