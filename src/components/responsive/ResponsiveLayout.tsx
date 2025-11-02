import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveLayout({ children, className = '' }: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className={`
      ${isMobile ? 'px-2 py-2' : 'px-4 py-4'} 
      min-h-screen relative overflow-x-hidden w-full
      ${className}
    `}>
      {/* Animated background elements - smaller on mobile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`
          absolute -top-40 -right-40 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl animate-pulse
          ${isMobile ? 'w-40 h-40' : 'w-80 h-80'}
        `}></div>
        <div className={`
          absolute -bottom-40 -left-40 bg-gradient-to-tr from-accent/20 to-tech-cyan/20 rounded-full blur-3xl animate-pulse
          ${isMobile ? 'w-40 h-40' : 'w-80 h-80'}
        `} style={{animationDelay: '2s'}}></div>
        <div className={`
          absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-tech-purple/10 to-tech-blue/10 rounded-full blur-3xl animate-pulse
          ${isMobile ? 'w-48 h-48' : 'w-96 h-96'}
        `} style={{animationDelay: '4s'}}></div>
      </div>

      {/* Contenu pleine largeur pour optimiser l'espace tableau */}
      <div className="w-full max-w-full relative z-10">
        {children}
      </div>
    </div>
  );
}