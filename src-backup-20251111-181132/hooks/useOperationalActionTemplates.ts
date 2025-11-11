/**
 * Hook: useOperationalActionTemplates
 * Gestion des templates d'actions (checklist) pour activités opérationnelles
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface OperationalActionTemplate {
  id: string;
  tenant_id: string;
  activity_id: string;
  title: string;
  description: string | null;
  position: number;
  assignee_id: string | null;
  assigned_name: string | null;
  inherit_assignee: boolean;
  estimated_hours: number;
  offset_days: number;
  created_at: string;
}

export function useOperationalActionTemplates() {
  const { currentTenant } = useTenant();
  const [templates, setTemplates] = useState<OperationalActionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async (activityId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('operational_action_templates')
        .select('*')
        .eq('activity_id', activityId)
        .order('position', { ascending: true });

      if (fetchError) throw fetchError;

      setTemplates(data || []);
      return data || [];
    } catch (err: any) {
      console.error(' Erreur fetchTemplates:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un template
  const createTemplate = useCallback(
    async (template: Partial<OperationalActionTemplate>) => {
      setLoading(true);
      setError(null);

      try {
        if (!currentTenant?.id) {
          throw new Error('Aucun tenant actif');
        }

        const insertData = {
          ...template,
          tenant_id: currentTenant.id,
          created_at: new Date().toISOString(),
        };

        const { data: newTemplate, error: insertError } = await supabase
          .from('operational_action_templates')
          .insert(insertData as any)
          .select()
          .single();

        if (insertError) throw insertError;

        // Rafraîchir la liste
        if (newTemplate.activity_id) {
          await fetchTemplates(newTemplate.activity_id);
        }

        return newTemplate;
      } catch (err: any) {
        console.error('❌ Erreur createTemplate:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchTemplates, currentTenant]
  );

  // Mettre à jour un template
  const updateTemplate = useCallback(
    async (id: string, updates: Partial<OperationalActionTemplate>) => {
      setLoading(true);
      setError(null);

      try {
        const { error: updateError } = await supabase
          .from('operational_action_templates')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Rafraîchir la liste
        if (updates.activity_id) {
          await fetchTemplates(updates.activity_id);
        }

        return updates;
      } catch (err: any) {
        console.error(' Erreur updateTemplate:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchTemplates]
  );

  // Supprimer un template
  const deleteTemplate = useCallback(
    async (id: string, activityId: string) => {
      setLoading(true);
      setError(null);

      try {
        const { error: deleteError } = await supabase
          .from('operational_action_templates')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

        // Rafraîchir la liste
        await fetchTemplates(activityId);
      } catch (err: any) {
        console.error('❌ Erreur deleteTemplate:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchTemplates]
  );

  // Réorganiser les templates (drag & drop)
  const reorderTemplates = useCallback(
    async (activityId: string, reorderTemplates: OperationalActionTemplate[]) => {
      setLoading(true);
      setError(null);

      try {
        const { error: updateError } = await supabase.from('operational_action_templates').upsert(
          reorderTemplates.map((template, index) => ({
            id: template.id,
            position: index,
          })) as any
        );

        if (updateError) throw updateError;

        // Rafraîchir la liste
        await fetchTemplates(activityId);
      } catch (err: any) {
        console.error('❌ Erreur reorderTemplates:', err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchTemplates]
  );

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    reorderTemplates,
  };
}
