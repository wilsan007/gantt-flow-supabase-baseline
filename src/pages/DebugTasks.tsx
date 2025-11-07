/**
 * Debug Tasks - Page de débogage pour comprendre pourquoi les tâches ne s'affichent pas
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';
import { useRolesCompat as useUserRoles } from '@/contexts/RolesContext';
import { useTasks } from '@/hooks/optimized';
import { useTasksEnterprise } from '@/hooks/useTasksEnterprise';

export default function DebugTasks() {
  const { tenantId } = useTenant();
  const { isSuperAdmin, userRoles } = useUserRoles();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // 1. Info utilisateur
      const {
        data: { user },
      } = await supabase.auth.getUser();
      results.user = {
        id: user?.id,
        email: user?.email,
      };

      // 2. Info tenant
      results.tenant = {
        tenantId,
        isSuperAdmin: isSuperAdmin(),
        userRoles: userRoles.map(r => ({
          role: r.roles.name,
          tenant_id: r.tenant_id,
        })),
      };

      // 3. Count des projets
      const { count: projectCount, error: projectError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId || '');

      results.projects = {
        count: projectCount,
        error: projectError?.message,
      };

      // 4. Count des tâches SANS filtre
      const { count: allTasksCount, error: allTasksError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true });

      results.allTasks = {
        count: allTasksCount,
        error: allTasksError?.message,
      };

      // 5. Count des tâches PAR tenant
      const { count: tenantTasksCount, error: tenantTasksError } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId || '');

      results.tenantTasks = {
        count: tenantTasksCount,
        error: tenantTasksError?.message,
      };

      // 6. Récupérer 5 tâches avec jointures (comme dans useTasksEnterprise)
      const { data: tasksWithJoins, error: joinsError } = await supabase
        .from('tasks')
        .select(
          `
          *,
          projects:project_id(name),
          assignee:assignee_id(full_name),
          parent_task:parent_id(title),
          task_actions!task_id(*)
        `
        )
        .eq('tenant_id', tenantId || '')
        .limit(5);

      results.tasksWithJoins = {
        count: tasksWithJoins?.length || 0,
        error: joinsError?.message,
        sample: tasksWithJoins,
      };

      // 7. Récupérer 5 tâches SANS jointures
      const { data: tasksWithoutJoins, error: noJoinsError } = await supabase
        .from('tasks')
        .select('*')
        .eq('tenant_id', tenantId || '')
        .limit(5);

      results.tasksWithoutJoins = {
        count: tasksWithoutJoins?.length || 0,
        error: noJoinsError?.message,
        sample: tasksWithoutJoins,
      };

      // 8. Vérifier la table employees
      const { count: employeesCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId || '');

      results.employees = {
        count: employeesCount,
      };

      // 9. Vérifier les tâches d'un projet spécifique
      if (results.projects.count > 0) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('tenant_id', tenantId || '')
          .limit(1);

        if (projects && projects.length > 0) {
          const projectId = projects[0].id;

          const { count: projectTasksCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId);

          results.projectTasks = {
            projectId,
            count: projectTasksCount,
          };
        }
      }
    } catch (error: any) {
      results.error = error.message;
    }

    setDebugInfo(results);
    setLoading(false);
  };

  useEffect(() => {
    runDebug();
  }, [tenantId]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🔍 Debug Tasks</h1>
        <Button onClick={runDebug} disabled={loading}>
          {loading ? 'Chargement...' : 'Rafraîchir'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations Utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations Tenant & Rôles</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            {JSON.stringify(debugInfo.tenant, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projets (Fonctionnent ✓)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            {JSON.stringify(debugInfo.projects, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-orange-600">Tâches - Toutes (Sans filtre tenant)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            {JSON.stringify(debugInfo.allTasks, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Tâches - Par Tenant (Filtrées)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            {JSON.stringify(debugInfo.tenantTasks, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tâches AVEC Jointures (useTasksEnterprise)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            {JSON.stringify(debugInfo.tasksWithJoins, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tâches SANS Jointures</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            {JSON.stringify(debugInfo.tasksWithoutJoins, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employés</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            {JSON.stringify(debugInfo.employees, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {debugInfo.projectTasks && (
        <Card>
          <CardHeader>
            <CardTitle>Tâches d'un Projet Spécifique</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
              {JSON.stringify(debugInfo.projectTasks, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle>Analyse Complète</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Projets visibles:</strong>{' '}
              <span className="text-green-600">{debugInfo.projects?.count || 0}</span>
            </p>
            <p>
              <strong>Tâches (toutes DB):</strong>{' '}
              <span className="text-orange-600">{debugInfo.allTasks?.count || 0}</span>
            </p>
            <p>
              <strong>Tâches (ce tenant):</strong>{' '}
              <span className="text-red-600">{debugInfo.tenantTasks?.count || 0}</span>
            </p>
            <p>
              <strong>Tâches avec jointures:</strong>{' '}
              <span className="text-purple-600">{debugInfo.tasksWithJoins?.count || 0}</span>
            </p>
            <p>
              <strong>Tâches sans jointures:</strong>{' '}
              <span className="text-blue-600">{debugInfo.tasksWithoutJoins?.count || 0}</span>
            </p>

            {debugInfo.tenantTasks?.count === 0 && debugInfo.allTasks?.count > 0 && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:bg-red-950">
                <p className="font-bold text-red-800 dark:text-red-200">🚨 Problème Identifié :</p>
                <p className="text-red-700 dark:text-red-300">
                  Les tâches existent dans la base mais n'ont pas le bon `tenant_id`. Elles ne sont
                  pas associées à votre entreprise.
                </p>
              </div>
            )}

            {debugInfo.tenantTasks?.count > 0 && debugInfo.tasksWithJoins?.count === 0 && (
              <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:bg-orange-950">
                <p className="font-bold text-orange-800 dark:text-orange-200">
                  ⚠️ Problème Identifié :
                </p>
                <p className="text-orange-700 dark:text-orange-300">
                  Les tâches existent mais les jointures (assignee, project, etc.) échouent.
                  Vérifiez les foreign keys.
                </p>
              </div>
            )}

            {debugInfo.tenantTasks?.count === 0 && debugInfo.allTasks?.count === 0 && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:bg-blue-950">
                <p className="font-bold text-blue-800 dark:text-blue-200">ℹ️ Information :</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Aucune tâche n'existe dans la base de données. Créez-en une pour tester.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
