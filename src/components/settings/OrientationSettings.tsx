/**
 * Composant de configuration des préférences d'orientation
 * Permet à l'utilisateur de choisir comment gérer les rotations
 * Pattern: Notion Settings / Linear Preferences
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, RotateCw, Info } from 'lucide-react';
import {
  useOrientationPreference,
  type OrientationPreference,
} from '@/hooks/useOrientationPreference';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const OrientationSettings: React.FC = () => {
  const { preference, setPreference, dismissedViews, resetDismissed } = useOrientationPreference();

  const options: Array<{
    value: OrientationPreference;
    label: string;
    description: string;
    recommended?: boolean;
  }> = [
    {
      value: 'auto',
      label: 'Automatique (Recommandé)',
      description: 'Demande la rotation paysage pour Table, Gantt et Kanban sur mobile/tablette',
      recommended: true,
    },
    {
      value: 'always-landscape',
      label: 'Toujours Paysage',
      description: 'Force le mode paysage pour toutes les vues complexes',
    },
    {
      value: 'never-ask',
      label: 'Ne Jamais Demander',
      description: 'Désactive tous les messages de rotation (non recommandé sur mobile)',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <RotateCw className="text-primary h-5 w-5" />
          <CardTitle>Orientation de l'Écran</CardTitle>
        </div>
        <CardDescription>
          Gérez comment l'application gère l'orientation sur mobile et tablette
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info sur l'appareil actuel */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Appareil détecté:</strong>{' '}
            {window.innerWidth < 640 ? 'Mobile' : window.innerWidth < 1024 ? 'Tablette' : 'Desktop'}
            <br />
            <strong>Orientation actuelle:</strong>{' '}
            {window.innerWidth > window.innerHeight ? 'Paysage' : 'Portrait'}
          </AlertDescription>
        </Alert>

        {/* Options de préférence */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Préférence d'orientation</Label>
          <RadioGroup
            value={preference}
            onValueChange={value => setPreference(value as OrientationPreference)}
          >
            {options.map(option => (
              <div
                key={option.value}
                className="hover:bg-accent/50 flex items-start space-y-0 space-x-3 rounded-lg border p-4 transition-colors"
              >
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label
                    htmlFor={option.value}
                    className="flex cursor-pointer items-center gap-2 text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option.label}
                    {option.recommended && (
                      <Badge variant="secondary" className="text-xs">
                        Recommandé
                      </Badge>
                    )}
                  </Label>
                  <p className="text-muted-foreground text-xs">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Vues ignorées */}
        {dismissedViews.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Vues avec notification désactivée</Label>
                <p className="text-muted-foreground mt-1 text-xs">
                  Vous avez choisi de ne plus afficher la notification pour ces vues
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={resetDismissed}>
                Réinitialiser
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {dismissedViews.map(view => (
                <Badge key={view} variant="secondary">
                  {view}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Info additionnelle */}
        <div className="bg-muted/50 space-y-2 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Smartphone className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="text-muted-foreground space-y-1 text-xs">
              <p>
                <strong>Pourquoi le mode paysage ?</strong>
              </p>
              <p>
                Les vues Table, Gantt et Kanban nécessitent beaucoup d'espace horizontal pour une
                visualisation optimale. Le mode paysage offre une largeur d'écran maximale sur
                mobile et tablette.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
