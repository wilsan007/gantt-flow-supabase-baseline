import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { useToast } from '@/hooks/use-toast';
import { Crown, Timer, Shield, Eye, EyeOff } from 'lucide-react';

/**
 * Composant de test pour valider les fonctionnalités Super Admin et minuteur d'inactivité
 * À utiliser uniquement en développement
 */
export const SuperAdminTestPanel: React.FC = () => {
  const [timerEnabled, setTimerEnabled] = useState(true);
  const {
    isSuperAdmin: checkIsSuperAdmin,
    isLoading: superAdminLoading,
    refreshRoles,
  } = useUserRoles();
  const isSuperAdmin = checkIsSuperAdmin();
  const {
    showWarning,
    timeLeftFormatted,
    isActive: timerActive,
    timeLeft,
    startTimer,
    stopTimer,
    resetTimer,
  } = useInactivityTimer({
    totalTimeoutMinutes: 15,
    warningMinutes: 5,
    enabled: timerEnabled,
  });

  const { toast } = useToast();

  const handleTestInactivityWarning = () => {
    // Simuler les 5 dernières minutes pour tester l'affichage
    toast({
      title: '🧪 Test Minuteur',
      description: 'Simulation des 5 dernières minutes avant déconnexion',
      variant: 'default',
    });
  };

  const handleRefreshSuperAdmin = () => {
    refreshRoles();
    toast({
      title: '🔄 Statut rafraîchi',
      description: 'Vérification du statut Super Admin mise à jour',
      variant: 'default',
    });
  };

  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Panel de Test - Super Admin & Minuteur
            <Badge variant="outline">DEV ONLY</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Super Admin */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card className="border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  Statut Super Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Statut actuel :</span>
                  {superAdminLoading ? (
                    <Badge variant="secondary">Vérification...</Badge>
                  ) : isSuperAdmin ? (
                    <Badge variant="default" className="bg-yellow-500">
                      <Crown className="mr-1 h-3 w-3" />
                      Super Admin
                    </Badge>
                  ) : (
                    <Badge variant="outline">Utilisateur Standard</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-sm">
                    <strong>Boutons visibles :</strong>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={isSuperAdmin ? 'default' : 'secondary'}>
                      <Eye className="mr-1 h-3 w-3" />
                      👑 Super Admin {isSuperAdmin ? '✅' : '❌'}
                    </Badge>
                    <Badge variant={isSuperAdmin ? 'default' : 'secondary'}>
                      <Shield className="mr-1 h-3 w-3" />
                      Rôles & Permissions {isSuperAdmin ? '✅' : '❌'}
                    </Badge>
                  </div>
                </div>

                <Button
                  onClick={handleRefreshSuperAdmin}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  🔄 Rafraîchir Statut
                </Button>
              </CardContent>
            </Card>

            {/* Status Minuteur */}
            <Card className="border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Timer className="h-5 w-5 text-orange-600" />
                  Minuteur d'Inactivité
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="timer-enabled">Minuteur activé</Label>
                  <Switch
                    id="timer-enabled"
                    checked={timerEnabled}
                    onCheckedChange={setTimerEnabled}
                  />
                </div>

                {timerEnabled && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Temps restant :</span>
                        <span className="font-mono">{formatTimeLeft(timeLeft)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Avertissement :</span>
                        <Badge variant={showWarning ? 'destructive' : 'outline'}>
                          {showWarning ? '🚨 Actif' : '😴 Inactif'}
                        </Badge>
                      </div>

                      {showWarning && (
                        <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-orange-800">
                            ⏰ Déconnexion automatique dans {timeLeftFormatted}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={resetTimer} variant="outline" size="sm">
                        🔄 Reset
                      </Button>
                      <Button onClick={handleTestInactivityWarning} variant="outline" size="sm">
                        🧪 Test Alerte
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Configuration et Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration & Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">15</div>
                  <div className="text-sm text-blue-800">Minutes totales</div>
                </div>
                <div className="rounded-lg bg-orange-50 p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">5</div>
                  <div className="text-sm text-orange-800">Minutes d'alerte</div>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {timerActive ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-green-800">Minuteur actif</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Tests de Validation</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={isSuperAdmin ? 'default' : 'destructive'}>
                      {isSuperAdmin ? '✅' : '❌'}
                    </Badge>
                    <span>Bouton "Super Admin" visible seulement pour les super admins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isSuperAdmin ? 'default' : 'destructive'}>
                      {isSuperAdmin ? '✅' : '❌'}
                    </Badge>
                    <span>
                      Bouton "Rôles et Permissions" visible seulement pour les super admins
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={showWarning ? 'default' : 'secondary'}>
                      {showWarning ? '✅' : '⏳'}
                    </Badge>
                    <span>Minuteur visible seulement les 5 dernières minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={timerActive ? 'default' : 'secondary'}>
                      {timerActive ? '✅' : '❌'}
                    </Badge>
                    <span>Déconnexion automatique après 15 minutes d'inactivité</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Instructions de Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Test Super Admin :</strong>
                  <ol className="mt-1 ml-4 list-inside list-decimal space-y-1">
                    <li>Connectez-vous avec un compte super admin</li>
                    <li>
                      Vérifiez que les boutons "Super Admin" et "Rôles & Permissions" sont visibles
                    </li>
                    <li>Connectez-vous avec un compte standard</li>
                    <li>Vérifiez que ces boutons sont masqués</li>
                  </ol>
                </div>

                <div>
                  <strong>Test Minuteur d'Inactivité :</strong>
                  <ol className="mt-1 ml-4 list-inside list-decimal space-y-1">
                    <li>Activez le minuteur avec le switch</li>
                    <li>Attendez ou simulez l'inactivité</li>
                    <li>Vérifiez que l'alerte n'apparaît qu'aux 5 dernières minutes</li>
                    <li>Testez la déconnexion automatique après 15 minutes</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};
