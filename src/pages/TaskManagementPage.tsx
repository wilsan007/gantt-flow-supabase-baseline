/**
 * TaskManagementPage - Hub de Gestion Opérationnelle des Tâches
 * 
 * Phase 1 + Phase 2 (5 onglets complets) :
 * - 👤 Mes Tâches : Vue personnalisée par utilisateur
 * - ➕ Création Rapide : Formulaire optimisé
 * - 📊 Analytics : Statistiques et KPIs
 * - 🔍 Recherche : Filtres avancés et recherches sauvegardées
 * - 📅 Calendrier : Vue temporelle et planning
 * 
 * Note : Gantt/Kanban restent dans le Dashboard uniquement
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MyTasksView } from '@/components/tasks/MyTasksView';
import { QuickTaskForm } from '@/components/tasks/QuickTaskForm';
import { TaskAnalytics } from '@/components/tasks/TaskAnalytics';
import { AdvancedTaskSearch } from '@/components/tasks/AdvancedTaskSearch';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, PlusCircle, BarChart3, Search, Calendar } from 'lucide-react';

export default function TaskManagementPage() {
  const [activeTab, setActiveTab] = useState<'my-tasks' | 'create' | 'analytics' | 'search' | 'calendar'>('my-tasks');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gestion des Tâches</h1>
              <p className="text-muted-foreground">
                Hub de gestion opérationnelle
              </p>
            </div>
          </div>
        </div>

        {/* Tabs pour les vues */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="my-tasks" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              👤 Mes Tâches
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              ➕ Création
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              📊 Analytics
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              🔍 Recherche
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              📅 Calendrier
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="mt-6">
            <MyTasksView />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <QuickTaskForm />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <TaskAnalytics />
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <AdvancedTaskSearch />
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <TaskCalendar />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
