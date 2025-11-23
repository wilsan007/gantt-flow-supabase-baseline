import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MyTasksView } from '@/components/tasks/MyTasksView';
import { QuickTaskForm } from '@/components/tasks/QuickTaskForm';
import { TaskAnalytics } from '@/components/tasks/TaskAnalytics';
import { AdvancedTaskSearch } from '@/components/tasks/AdvancedTaskSearch';
import { TaskCalendar } from '@/components/tasks/TaskCalendar';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  PlusCircle,
  BarChart3,
  Search,
  Calendar,
  CheckSquare,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export default function TaskManagementPage() {
  const [activeTab, setActiveTab] = useState<
    'my-assigned-tasks' | 'all-tasks' | 'create' | 'analytics' | 'search' | 'calendar'
  >('my-assigned-tasks');
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="bg-background/50 h-full">
      <div className="container mx-auto space-y-6 p-4 sm:p-6">
        {/* Header Moderne & Coloré */}
        <div className="via-primary relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 p-6 text-white shadow-lg sm:p-10">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/')}
                  className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
                  Gestion des Tâches
                </h1>
              </div>
              <p className="max-w-2xl text-sm text-blue-100 sm:text-base">
                Pilotez vos projets, suivez vos performances et collaborez efficacement avec votre
                équipe.
              </p>
            </div>

            {/* Actions rapides header */}
            <div className="flex gap-2">
              <Button
                onClick={() => setActiveTab('create')}
                className="text-primary bg-white shadow-md transition-all hover:scale-105 hover:bg-white/90"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvelle Tâche
              </Button>
            </div>
          </div>

          {/* Cercles décoratifs */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
        </div>

        {/* Tabs Modernes - Scrollable & Coloré */}
        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as any)}
          className="w-full space-y-6"
        >
          <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-20 -mx-4 px-4 py-2 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:p-0">
            <TabsList className="sm:bg-muted/50 flex h-auto w-full justify-start gap-2 overflow-x-auto rounded-none bg-transparent p-1 sm:justify-center sm:rounded-xl sm:p-1">
              <TabsTrigger
                value="my-assigned-tasks"
                className="group flex min-w-fit items-center gap-2 rounded-full border border-transparent px-4 py-2.5 data-[state=active]:border-violet-200 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700 dark:data-[state=active]:bg-violet-900/30 dark:data-[state=active]:text-violet-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-600 transition-colors group-data-[state=active]:bg-violet-600 group-data-[state=active]:text-white">
                  <User className="h-4 w-4" />
                </div>
                <span className="font-medium">Mes Tâches</span>
              </TabsTrigger>

              <TabsTrigger
                value="all-tasks"
                className="group flex min-w-fit items-center gap-2 rounded-full border border-transparent px-4 py-2.5 data-[state=active]:border-blue-200 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900/30 dark:data-[state=active]:text-blue-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 transition-colors group-data-[state=active]:bg-blue-600 group-data-[state=active]:text-white">
                  <CheckSquare className="h-4 w-4" />
                </div>
                <span className="font-medium">Toutes</span>
              </TabsTrigger>

              <TabsTrigger
                value="create"
                className="group flex min-w-fit items-center gap-2 rounded-full border border-transparent px-4 py-2.5 data-[state=active]:border-emerald-200 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900/30 dark:data-[state=active]:text-emerald-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-colors group-data-[state=active]:bg-emerald-600 group-data-[state=active]:text-white">
                  <PlusCircle className="h-4 w-4" />
                </div>
                <span className="font-medium">Création</span>
              </TabsTrigger>

              <TabsTrigger
                value="analytics"
                className="group flex min-w-fit items-center gap-2 rounded-full border border-transparent px-4 py-2.5 data-[state=active]:border-amber-200 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 dark:data-[state=active]:bg-amber-900/30 dark:data-[state=active]:text-amber-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 transition-colors group-data-[state=active]:bg-amber-600 group-data-[state=active]:text-white">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <span className="font-medium">Analytics</span>
              </TabsTrigger>

              <TabsTrigger
                value="search"
                className="group flex min-w-fit items-center gap-2 rounded-full border border-transparent px-4 py-2.5 data-[state=active]:border-pink-200 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-700 dark:data-[state=active]:bg-pink-900/30 dark:data-[state=active]:text-pink-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 text-pink-600 transition-colors group-data-[state=active]:bg-pink-600 group-data-[state=active]:text-white">
                  <Search className="h-4 w-4" />
                </div>
                <span className="font-medium">Recherche</span>
              </TabsTrigger>

              <TabsTrigger
                value="calendar"
                className="group flex min-w-fit items-center gap-2 rounded-full border border-transparent px-4 py-2.5 data-[state=active]:border-indigo-200 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 dark:data-[state=active]:bg-indigo-900/30 dark:data-[state=active]:text-indigo-300"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-colors group-data-[state=active]:bg-indigo-600 group-data-[state=active]:text-white">
                  <Calendar className="h-4 w-4" />
                </div>
                <span className="font-medium">Calendrier</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-card min-h-[500px] rounded-xl border p-1 shadow-sm sm:p-6">
            <TabsContent
              value="my-assigned-tasks"
              className="animate-in fade-in-50 slide-in-from-bottom-2 m-0 duration-300"
            >
              <MyTasksView />
            </TabsContent>

            <TabsContent
              value="all-tasks"
              className="animate-in fade-in-50 slide-in-from-bottom-2 m-0 duration-300"
            >
              <MyTasksView showAllTasks />
            </TabsContent>

            <TabsContent
              value="create"
              className="animate-in fade-in-50 slide-in-from-bottom-2 m-0 duration-300"
            >
              <QuickTaskForm />
            </TabsContent>

            <TabsContent
              value="analytics"
              className="animate-in fade-in-50 slide-in-from-bottom-2 m-0 duration-300"
            >
              <TaskAnalytics />
            </TabsContent>

            <TabsContent
              value="search"
              className="animate-in fade-in-50 slide-in-from-bottom-2 m-0 duration-300"
            >
              <AdvancedTaskSearch />
            </TabsContent>

            <TabsContent
              value="calendar"
              className="animate-in fade-in-50 slide-in-from-bottom-2 m-0 duration-300"
            >
              <TaskCalendar />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
