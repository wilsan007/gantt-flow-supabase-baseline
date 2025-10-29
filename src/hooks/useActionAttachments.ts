/**
 * Hook: useActionAttachments
 * Gestion des fichiers attachés aux actions opérationnelles
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface ActionAttachment {
  id: string;
  tenant_id: string;
  action_template_id: string;
  task_id: string | null;
  file_name: string;
  file_type: 'image' | 'pdf' | 'doc' | 'other';
  file_size: number;
  file_extension: string | null;
  mime_type: string | null;
  storage_path: string;
  storage_bucket: string;
  uploaded_by: string;
  uploaded_at: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface UseActionAttachmentsOptions {
  actionTemplateId?: string;
  taskId?: string;
  autoFetch?: boolean;
}

export const useActionAttachments = (options: UseActionAttachmentsOptions = {}) => {
  const { actionTemplateId, taskId, autoFetch = true } = options;
  const { currentTenant } = useTenant();
  
  const [attachments, setAttachments] = useState<ActionAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  // Charger les attachments
  const fetchAttachments = useCallback(async () => {
    if (!actionTemplateId || !currentTenant) return;

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('operational_action_attachments')
        .select('*')
        .eq('tenant_id', currentTenant.id)
        .eq('action_template_id', actionTemplateId)
        .order('created_at', { ascending: false });

      // Filtrer par tâche si spécifié
      if (taskId) {
        query = query.eq('task_id', taskId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setAttachments(data || []);
      setCount(data?.length || 0);
    } catch (err: any) {
      console.error('Erreur fetchAttachments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [actionTemplateId, taskId, currentTenant]);

  // Auto-fetch
  useEffect(() => {
    if (autoFetch && actionTemplateId) {
      fetchAttachments();
    }
  }, [autoFetch, actionTemplateId, fetchAttachments]);

  // Obtenir l'URL publique d'un fichier
  const getPublicUrl = useCallback(
    (storagePath: string, bucket: string = 'action-attachments'): string => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
      return data.publicUrl;
    },
    []
  );

  // Télécharger un fichier
  const downloadFile = useCallback(
    async (storagePath: string, fileName: string, bucket: string = 'action-attachments') => {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .download(storagePath);

        if (error) throw error;

        // Créer un lien de téléchargement
        const url = URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err: any) {
        console.error('Erreur downloadFile:', err);
        throw err;
      }
    },
    []
  );

  // Supprimer un attachment
  const deleteAttachment = useCallback(
    async (attachmentId: string) => {
      try {
        // 1. Obtenir le fichier
        const attachment = attachments.find(a => a.id === attachmentId);
        if (!attachment) throw new Error('Fichier non trouvé');

        // 2. Supprimer du storage
        const { error: storageError } = await supabase.storage
          .from(attachment.storage_bucket)
          .remove([attachment.storage_path]);

        if (storageError) {
          console.warn('Erreur suppression storage:', storageError);
          // Continue quand même la suppression DB
        }

        // 3. Supprimer de la DB
        const { error: dbError } = await supabase
          .from('operational_action_attachments')
          .delete()
          .eq('id', attachmentId);

        if (dbError) throw dbError;

        // Mettre à jour l'état local
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
        setCount(prev => prev - 1);
      } catch (err: any) {
        console.error('Erreur deleteAttachment:', err);
        throw err;
      }
    },
    [attachments]
  );

  // Vérifier si l'action peut être validée
  const canValidate = count > 0;

  return {
    attachments,
    loading,
    error,
    count,
    canValidate,
    fetchAttachments,
    getPublicUrl,
    downloadFile,
    deleteAttachment,
  };
};
