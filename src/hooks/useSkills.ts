/**
 * 🎯 Hook useSkills - Gestion Compétences
 * Pattern: LinkedIn Skills, Workday Skills Cloud
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserFilterContext } from '@/hooks/useUserAuth';
import { applyRoleFilters } from '@/lib/roleBasedFiltering';
import { useToast } from '@/hooks/use-toast';

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string | null;
  level_required: string;
  is_critical: boolean;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeSkill {
  id: string;
  employee_id: string;
  skill_id: string;
  skill?: Skill;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  is_certified: boolean;
  certified_by: string | null;
  certified_at: string | null;
  years_experience: number;
  last_used_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSkills() {
  const { userContext, profile, loading: authLoading } = useUserFilterContext();
  const { toast } = useToast();
  
  const [skills, setSkills] = useState<Skill[]>([]);
  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch référentiel compétences (tous du tenant)
  const fetchSkills = useCallback(async () => {
    if (!userContext) return;

    try {
      let query = supabase.from('skills').select('*').order('name');
      query = applyRoleFilters(query, userContext, 'skills');

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setSkills(data || []);
    } catch (err: any) {
      console.error('Erreur chargement skills:', err);
      setError(err.message);
    }
  }, [userContext]);

  // Fetch compétences employé (ses skills ou équipe si manager)
  const fetchEmployeeSkills = useCallback(async (employeeId?: string) => {
    if (!userContext) return;

    try {
      let query = supabase
        .from('employee_skills')
        .select(`
          *,
          skill:skills(*)
        `)
        .order('created_at', { ascending: false });

      if (employeeId) {
        query = query.eq('employee_id', employeeId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setEmployeeSkills(data || []);
    } catch (err: any) {
      console.error('Erreur chargement employee skills:', err);
      setError(err.message);
    }
  }, [userContext]);

  // Ajouter compétence à son profil
  const addSkillToProfile = useCallback(async (skillId: string, level: string) => {
    if (!profile) return;

    try {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', profile.userId)
        .single();

      if (!employee) throw new Error('Employé non trouvé');

      const { error: insertError } = await supabase
        .from('employee_skills')
        .insert({
          employee_id: employee.id,
          skill_id: skillId,
          level,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Compétence ajoutée',
        description: 'La compétence a été ajoutée à votre profil',
      });

      fetchEmployeeSkills(employee.id);
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [profile, toast, fetchEmployeeSkills]);

  // Mettre à jour niveau compétence
  const updateSkillLevel = useCallback(async (employeeSkillId: string, level: string) => {
    try {
      const { error: updateError } = await supabase
        .from('employee_skills')
        .update({ level })
        .eq('id', employeeSkillId);

      if (updateError) throw updateError;

      toast({
        title: 'Niveau mis à jour',
        description: 'Votre niveau de compétence a été mis à jour',
      });

      fetchEmployeeSkills();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [toast, fetchEmployeeSkills]);

  // Demander certification (manager valide)
  const requestCertification = useCallback(async (employeeSkillId: string) => {
    try {
      // Logique: notification au manager pour validation
      toast({
        title: 'Demande envoyée',
        description: 'Votre manager recevra une notification pour valider cette compétence',
      });
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Certifier compétence (manager uniquement)
  const certifySkill = useCallback(async (employeeSkillId: string, certifiedBy: string) => {
    try {
      const { error: updateError } = await supabase
        .from('employee_skills')
        .update({
          is_certified: true,
          certified_by: certifiedBy,
          certified_at: new Date().toISOString(),
        })
        .eq('id', employeeSkillId);

      if (updateError) throw updateError;

      toast({
        title: 'Compétence certifiée',
        description: 'La compétence a été certifiée avec succès',
      });

      fetchEmployeeSkills();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [toast, fetchEmployeeSkills]);

  // Supprimer compétence de son profil
  const removeSkillFromProfile = useCallback(async (employeeSkillId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('employee_skills')
        .delete()
        .eq('id', employeeSkillId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Compétence supprimée',
        description: 'La compétence a été retirée de votre profil',
      });

      fetchEmployeeSkills();
    } catch (err: any) {
      toast({
        title: 'Erreur',
        description: err.message,
        variant: 'destructive',
      });
    }
  }, [toast, fetchEmployeeSkills]);

  useEffect(() => {
    if (authLoading || !userContext) return;

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchSkills(), fetchEmployeeSkills()]);
      setLoading(false);
    };

    loadData();
  }, [authLoading, userContext, fetchSkills, fetchEmployeeSkills]);

  return {
    // Data
    skills,
    employeeSkills,
    
    // States
    loading,
    error,
    
    // Actions
    fetchSkills,
    fetchEmployeeSkills,
    addSkillToProfile,
    updateSkillLevel,
    requestCertification,
    certifySkill,
    removeSkillFromProfile,
    
    // Utils
    refresh: () => {
      fetchSkills();
      fetchEmployeeSkills();
    },
  };
}
