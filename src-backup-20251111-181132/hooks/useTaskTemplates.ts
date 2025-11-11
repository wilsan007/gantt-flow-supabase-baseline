/**
 * 🎯 useTaskTemplates - Hook pour gérer les templates de tâches
 * Pattern: Notion, Linear, ClickUp
 *
 * Fonctionnalités:
 * - CRUD templates (Create, Read, Update, Delete)
 * - Templates personnels + publics du tenant
 * - Catégorisation des templates
 * - Compteur d'utilisation
 * - Cache intelligent
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/contexts/TenantContext';

export interface TaskTemplateData {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'doing' | 'blocked' | 'done';
  effort_estimate_h?: number;
  actions?: Array<{
    title: string;
    weight_percentage: number;
    notes?: string;
  }>;
}

export interface TaskTemplate {
  id: string;
  tenant_id: string;
  created_by: string;
  name: string;
  description?: string;
  category?: string;
  template_data: TaskTemplateData;
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

interface UseTaskTemplatesReturn {
  templates: TaskTemplate[];
  loading: boolean;
  error: Error | null;
  createTemplate: (
    template: Omit<
      TaskTemplate,
      'id' | 'tenant_id' | 'created_by' | 'usage_count' | 'created_at' | 'updated_at'
    >
  ) => Promise<TaskTemplate | null>;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  incrementUsage: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useTaskTemplates = (): UseTaskTemplatesReturn => {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { currentTenant } = useTenant();

  /**
   * Charger les templates
   */
  const fetchTemplates = useCallback(async () => {
    if (!currentTenant?.id) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user) {
        throw new Error('Non authentifié');
      }

      // Récupérer templates personnels + publics du tenant
      const { data, error: fetchError } = await supabase
        .from('task_templates')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .or(`created_by.eq.${session.session.user.id},is_public.eq.true`)
        .order('usage_count', { ascending: false })
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setTemplates(data || []);
    } catch (err) {
      console.error('Erreur chargement templates:', err);
      setError(err as Error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de charger les templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [currentTenant?.id, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  /**
   * Créer un template
   */
  const createTemplate = useCallback(
    async (
      template: Omit<
        TaskTemplate,
        'id' | 'tenant_id' | 'created_by' | 'usage_count' | 'created_at' | 'updated_at'
      >
    ): Promise<TaskTemplate | null> => {
      if (!currentTenant?.id) {
        toast({
          title: '❌ Erreur',
          description: 'Tenant non disponible',
          variant: 'destructive',
        });
        return null;
      }

      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.user) {
          throw new Error('Non authentifié');
        }

        const { data, error: createError } = await supabase
          .from('task_templates')
          .insert({
            tenant_id: currentTenant.id,
            created_by: session.session.user.id,
            name: template.name,
            description: template.description,
            category: template.category,
            template_data: template.template_data,
            is_public: template.is_public,
          })
          .select()
          .single();

        if (createError) throw createError;

        toast({
          title: '✅ Template créé',
          description: `"${template.name}" a été enregistré`,
        });

        await fetchTemplates();
        return data;
      } catch (err) {
        console.error('Erreur création template:', err);
        toast({
          title: '❌ Erreur',
          description: 'Impossible de créer le template',
          variant: 'destructive',
        });
        return null;
      }
    },
    [currentTenant?.id, toast, fetchTemplates]
  );

  /**
   * Mettre à jour un template
   */
  const updateTemplate = useCallback(
    async (id: string, updates: Partial<TaskTemplate>): Promise<boolean> => {
      try {
        const { error: updateError } = await supabase
          .from('task_templates')
          .update(updates)
          .eq('id', id);

        if (updateError) throw updateError;

        toast({
          title: '✅ Template mis à jour',
          description: 'Les modifications ont été enregistrées',
        });

        await fetchTemplates();
        return true;
      } catch (err) {
        console.error('Erreur mise à jour template:', err);
        toast({
          title: '❌ Erreur',
          description: 'Impossible de mettre à jour le template',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, fetchTemplates]
  );

  /**
   * Supprimer un template
   */
  const deleteTemplate = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase.from('task_templates').delete().eq('id', id);

        if (deleteError) throw deleteError;

        toast({
          title: '✅ Template supprimé',
          description: 'Le template a été supprimé',
        });

        await fetchTemplates();
        return true;
      } catch (err) {
        console.error('Erreur suppression template:', err);
        toast({
          title: '❌ Erreur',
          description: 'Impossible de supprimer le template',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast, fetchTemplates]
  );

  /**
   * Incrémenter le compteur d'utilisation
   */
  const incrementUsage = useCallback(async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.rpc('increment_template_usage', {
        template_id: id,
      });

      if (error) throw error;

      // Mettre à jour localement sans refetch
      setTemplates(prev =>
        prev.map(t => (t.id === id ? { ...t, usage_count: t.usage_count + 1 } : t))
      );
    } catch (err) {
      console.error('Erreur incrémentation usage:', err);
      // Silencieux, pas critique
    }
  }, []);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    incrementUsage,
    refresh: fetchTemplates,
  };
};
