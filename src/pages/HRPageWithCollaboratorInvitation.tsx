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
    <div className="container mx-auto space-y-4 p-4 sm:space-y-6 sm:p-6">
      {/* Header - Responsive */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
            Ressources Humaines
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            <span className="hidden sm:inline">
              Gestion des employés, congés, présences et invitations
            </span>
            <span className="sm:hidden">Gestion RH complète</span>
          </p>
        </div>
      </div>

      {/* Tabs Navigation - Scroll horizontal mobile */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="-mx-4 sm:mx-0">
          <TabsList className="flex w-full gap-1 overflow-x-auto p-2 sm:grid sm:grid-cols-2 sm:gap-2 lg:grid-cols-5">
            <TabsTrigger
              value="overview"
              className="flex shrink-0 items-center gap-2 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Vue d'ensemble</span>
              <span className="sm:hidden">Vue</span>
            </TabsTrigger>

            <TabsTrigger
              value="employees"
              className="flex shrink-0 items-center gap-2 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Employés</span>
              <span className="sm:hidden">Staff</span>
            </TabsTrigger>

            <TabsTrigger
              value="invitations"
              className="flex shrink-0 items-center gap-2 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Invitations</span>
              <span className="sm:hidden">Inviter</span>
            </TabsTrigger>

            <TabsTrigger
              value="leaves"
              className="flex shrink-0 items-center gap-2 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
            >
              <Calendar className="h-4 w-4" />
              Congés
            </TabsTrigger>

            <TabsTrigger
              value="attendance"
              className="flex shrink-0 items-center gap-2 px-3 text-xs whitespace-nowrap sm:px-4 sm:text-sm"
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Présences</span>
              <span className="sm:hidden">Prés.</span>
            </TabsTrigger>
          </TabsList>
        </div>

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
