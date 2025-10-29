/**
 * Composant: OperationsEmptyState
 * État vide élégant pour la page Operations
 * Pattern: Linear/Notion empty states
 */

import React from 'react';
import { CalendarClock, CalendarDays, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface OperationsEmptyStateProps {
  onCreateRecurring: () => void;
  onCreateOneOff: () => void;
}

export const OperationsEmptyState: React.FC<OperationsEmptyStateProps> = ({
  onCreateRecurring,
  onCreateOneOff,
}) => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Activités Opérationnelles</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Automatisez vos tâches récurrentes et planifiez vos opérations ponctuelles hors projet
          </p>
        </div>

        {/* Types d'activités */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Activités Récurrentes */}
          <Card className="border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-950 group-hover:scale-110 transition-transform">
                  <CalendarClock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Activités Récurrentes</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Génération automatique de tâches selon une planification (quotidienne, hebdomadaire, mensuelle)
                  </p>
                </div>
                <ul className="text-sm text-left space-y-2 w-full">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Réunions d'équipe hebdomadaires</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Rapports mensuels automatiques</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Audits de sécurité trimestriels</span>
                  </li>
                </ul>
                <Button onClick={onCreateRecurring} className="w-full group-hover:bg-blue-700">
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Créer une activité récurrente
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activités Ponctuelles */}
          <Card className="border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow cursor-pointer group">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-950 group-hover:scale-110 transition-transform">
                  <CalendarDays className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Activités Ponctuelles</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Création manuelle d'une tâche unique à une date précise
                  </p>
                </div>
                <ul className="text-sm text-left space-y-2 w-full">
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Événement spécial ponctuel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Formation unique planifiée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Audit exceptionnel à date fixe</span>
                  </li>
                </ul>
                <Button onClick={onCreateOneOff} variant="outline" className="w-full group-hover:bg-purple-50 dark:group-hover:bg-purple-950">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Créer une activité ponctuelle
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fonctionnalités */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg p-8">
          <h3 className="text-xl font-semibold mb-6 text-center">Fonctionnalités Clés</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">🔄</div>
              <h4 className="font-semibold mb-2">Génération Automatique</h4>
              <p className="text-sm text-muted-foreground">
                Les tâches récurrentes sont générées automatiquement chaque jour par le système
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">✅</div>
              <h4 className="font-semibold mb-2">Actions Prédéfinies</h4>
              <p className="text-sm text-muted-foreground">
                Créez des checklists qui seront automatiquement clonées sur chaque tâche
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📊</div>
              <h4 className="font-semibold mb-2">Statistiques Détaillées</h4>
              <p className="text-sm text-muted-foreground">
                Suivez le taux de complétion et les performances de vos activités
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Besoin d'aide pour démarrer ?{' '}
            <a href="/docs/operations" className="text-primary hover:underline">
              Consultez la documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
