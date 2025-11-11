/**
 * Composant élégant pour demander la rotation de l'appareil
 * Design moderne avec animation fluide
 * Pattern: Google Sheets/Notion Mobile
 */

import React from 'react';
import { Smartphone, X } from '@/lib/icons';
import { Button } from '@/components/ui/button';

interface RotateDeviceMessageProps {
  message?: string;
  className?: string;
  onDismiss?: () => void;
  showDismissButton?: boolean;
}

export const RotateDeviceMessage: React.FC<RotateDeviceMessageProps> = ({
  message = 'Pour une meilleure expérience, veuillez tourner votre appareil en mode paysage',
  className = '',
  onDismiss,
  showDismissButton = false,
}) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg ${className}`}
    >
      {/* Bouton "Ne plus afficher" en haut à droite */}
      {showDismissButton && onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          onClick={onDismiss}
        >
          <X className="mr-1 h-4 w-4" />
          <span className="text-xs">Ne plus afficher</span>
        </Button>
      )}

      <div className="flex flex-col items-center justify-center space-y-8 p-8 text-center">
        {/* Animation de rotation du téléphone */}
        <div className="relative">
          <div className="animate-bounce-slow">
            <Smartphone
              className="animate-rotate-device h-24 w-24 text-primary"
              strokeWidth={1.5}
            />
          </div>

          {/* Cercle décoratif pulsant */}
          <div className="animate-ping-slow absolute -inset-4 rounded-full border-2 border-primary/30"></div>
          <div className="absolute -inset-8 animate-pulse rounded-full border border-primary/20"></div>
        </div>

        {/* Message principal */}
        <div className="max-w-md space-y-3">
          <h2 className="animate-fade-in text-2xl font-bold text-foreground">
            Mode Paysage Requis
          </h2>
          <p className="animate-fade-in animation-delay-200 text-base text-muted-foreground">
            {message}
          </p>
        </div>

        {/* Indicateur visuel de rotation */}
        <div className="animate-fade-in animation-delay-400 flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex h-12 w-8 items-center justify-center rounded-sm border-2 border-primary/50">
              <div className="h-1 w-4 rounded bg-primary/50"></div>
            </div>
            <span className="text-xl">→</span>
            <div className="flex h-8 w-12 items-center justify-center rounded-sm border-2 border-primary">
              <div className="h-4 w-1 rounded bg-primary"></div>
            </div>
          </div>
        </div>

        {/* Petit texte d'aide */}
        <p className="animate-fade-in animation-delay-600 text-xs text-muted-foreground/70">
          Cette vue nécessite plus d'espace horizontal
        </p>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes rotate-device {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes ping-slow {
          75%, 100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .animate-rotate-device {
          animation: rotate-device 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }
      `,
        }}
      />
    </div>
  );
};
