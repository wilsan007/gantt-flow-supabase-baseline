import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, Bell, Key } from 'lucide-react';

export const Settings = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos paramètres de compte et de sécurité
          </p>
        </div>

        <Tabs defaultValue="security" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Mot de passe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-6">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du profil</CardTitle>
                <CardDescription>
                  Gérez vos informations personnelles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Cette section sera bientôt disponible
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Préférences de notifications</CardTitle>
                <CardDescription>
                  Gérez vos préférences de notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Cette section sera bientôt disponible
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>
                  Mettez à jour votre mot de passe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Cette section sera bientôt disponible
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
