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
      ${isMobile ? 'px-4 py-4' : 'px-6 py-6'} 
      min-h-screen relative overflow-hidden
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

      <div className={`mx-auto relative z-10 ${isMobile ? 'max-w-full' : 'max-w-7xl'}`}>
        {children}
      </div>
    </div>
  );
}