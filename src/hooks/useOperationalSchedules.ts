/**
 * Hook: useOperationalSchedules
 * Gestion des planifications (RRULE) pour activités récurrentes
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/contexts/TenantContext';

export interface OperationalSchedule {
  id: string;
  tenant_id: string;
  activity_id: string;
  timezone: string;
  rrule: string | null;
  start_date: string;
  until: string | null;
  generate_window_days: number;
  created_at: string;
  updated_at: string;
}

export function useOperationalSchedules() {
  const { currentTenant } = useTenant();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupérer la planification d'une activité
  const getSchedule = useCallback(async (activityId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('operational_schedules')
        .select('*')
        .eq('activity_id', activityId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      return data;
    } catch (err: any) {
      console.error('❌ Erreur getSchedule:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer ou mettre à jour une planification
  const upsertSchedule = useCallback(async (schedule: Partial<OperationalSchedule>) => {
    setLoading(true);
    setError(null);

    try {
      if (!currentTenant?.id) {
        throw new Error('Aucun tenant actif');
      }

      // Injecter tenant_id automatiquement
      const scheduleWithTenant = {
        ...schedule,
        tenant_id: currentTenant.id,
      };

      const { data, error: upsertError } = await supabase
        .from('operational_schedules')
        .upsert(scheduleWithTenant as any)
        .select()
        .single();

      if (upsertError) throw upsertError;

      return data;
    } catch (err: any) {
      console.error('❌ Erreur upsertSchedule:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentTenant]);

  // Supprimer une planification
  const deleteSchedule = useCallback(async (activityId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('operational_schedules')
        .delete()
        .eq('activity_id', activityId);

      if (deleteError) throw deleteError;

    } catch (err: any) {
      console.error('❌ Erreur deleteSchedule:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getSchedule,
    upsertSchedule,
    deleteSchedule,
  };
}
