import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, Bell, Key } from 'lucide-react';

export const Settings = () => {
  return (
    <div className="container mx-auto px-4 py-4 sm:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">Paramètres</h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Gérez vos paramètres de compte et de sécurité
          </p>
        </div>

        <Tabs defaultValue="security" className="space-y-4 sm:space-y-6">
          {/* Tabs responsive: 2 colonnes sur mobile, 4 sur desktop */}
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 p-1 sm:grid-cols-4">
            <TabsTrigger
              value="security"
              className="flex items-center gap-1 py-2 text-xs sm:gap-2 sm:text-sm"
            >
              <Shield className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="flex items-center gap-1 py-2 text-xs sm:gap-2 sm:text-sm"
            >
              <User className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">Profil</span>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-1 py-2 text-xs sm:gap-2 sm:text-sm"
            >
              <Bell className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">Notifs</span>
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="flex items-center gap-1 py-2 text-xs sm:gap-2 sm:text-sm"
            >
              <Key className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
              <span className="truncate">Mot de passe</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-6">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du profil</CardTitle>
                <CardDescription>Gérez vos informations personnelles</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Cette section sera bientôt disponible</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Préférences de notifications</CardTitle>
                <CardDescription>Gérez vos préférences de notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Cette section sera bientôt disponible</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>Mettez à jour votre mot de passe</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Cette section sera bientôt disponible</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
