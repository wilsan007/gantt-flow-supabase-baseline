import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserFilterContext } from '@/hooks/useUserAuth';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔒 Contexte utilisateur pour le filtrage
  const { userContext } = useUserFilterContext();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    if (!userContext) return;

    try {
      setLoading(true);

      let query = supabase.from('profiles').select('id, full_name, avatar_url').order('full_name');

      // 🔒 Appliquer le filtrage par rôle (profiles = employees)
      query = applyRoleFilters(query, userContext, 'employees');

      const { data, error } = await query;

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    profiles,
    loading,
    error,
    refetch: fetchProfiles,
  };
};
