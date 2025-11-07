import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, Calendar, Clock, TrendingUp } from 'lucide-react';
import { CollaboratorInvitation } from '@/components/hr/CollaboratorInvitation';
import HRPage from './HRPage';

/**
 * 🎯 Page: HRPageWithCollaboratorInvitation
 * Extension de la page RH avec invitation de collaborateurs
 * Pattern: Notion, Linear - Interface modulaire avec tabs
 *
 * Cette page étend HRPage en ajoutant un onglet pour les invitations
 */

const HRPageWithCollaboratorInvitation: React.FC = () => {
  const [activeTab, setActiveTab] = useState('invitations');

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ressources Humaines</h1>
          <p className="text-muted-foreground">
            Gestion des employés, congés, présences et invitations
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
            <span className="sm:hidden">Vue</span>
          </TabsTrigger>

          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Employés</span>
            <span className="sm:hidden">Staff</span>
          </TabsTrigger>

          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Invitations</span>
            <span className="sm:hidden">Inviter</span>
          </TabsTrigger>

          <TabsTrigger value="leaves" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Congés</span>
            <span className="sm:hidden">Congés</span>
          </TabsTrigger>

          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Présences</span>
            <span className="sm:hidden">Présence</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tableau de bord RH</CardTitle>
              <CardDescription>Vue d'ensemble des statistiques et indicateurs clés</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Intégrez ici vos KPIs, graphiques et widgets de tableau de bord
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Employés (existant) */}
        <TabsContent value="employees" className="space-y-4">
          <HRPage />
        </TabsContent>

        {/* Tab: Invitations (nouveau) */}
        <TabsContent value="invitations" className="space-y-4">
          <CollaboratorInvitation />
        </TabsContent>

        {/* Tab: Congés */}
        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des congés</CardTitle>
              <CardDescription>Demandes de congés et validation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Intégrez ici votre système de gestion des congés
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Présences */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suivi des présences</CardTitle>
              <CardDescription>Pointage et suivi du temps de travail</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Intégrez ici votre système de suivi des présences
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HRPageWithCollaboratorInvitation;
