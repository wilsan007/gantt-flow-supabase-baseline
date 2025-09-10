import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
  tenant_id?: string;
  created_at: string;
}

export interface SkillAssessment {
  id: string;
  skill_id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  department: string;
  current_level: number;
  target_level: number;
  last_assessed: string;
  assessor: string;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export const useSkillsTraining = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [skillsRes, assessmentsRes] = await Promise.all([
        supabase.from('skills').select('*').order('created_at', { ascending: false }),
        supabase.from('skill_assessments').select('*').order('last_assessed', { ascending: false })
      ]);

      if (skillsRes.error) throw skillsRes.error;
      if (assessmentsRes.error) throw assessmentsRes.error;

      setSkills(skillsRes.data || []);
      setSkillAssessments(assessmentsRes.data || []);
    } catch (err: any) {
      console.error('Error fetching skills data:', err);
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de compétences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createSkill = async (skillData: Omit<Skill, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('skills')
        .insert(skillData);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Compétence créée avec succès"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error creating skill:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer la compétence",
        variant: "destructive"
      });
    }
  };

  const createSkillAssessment = async (assessmentData: Omit<SkillAssessment, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('skill_assessments')
        .insert(assessmentData);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Évaluation de compétence créée avec succès"
      });

      fetchData();
    } catch (err: any) {
      console.error('Error creating skill assessment:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'évaluation",
        variant: "destructive"
      });
    }
  };

  const getSkillAssessmentsByEmployee = (employeeName: string) => {
    return skillAssessments.filter(assessment => assessment.employee_name === employeeName);
  };

  const getSkillsMatrix = () => {
    const employeeGroups = skillAssessments.reduce((groups, assessment) => {
      if (!groups[assessment.employee_name]) {
        groups[assessment.employee_name] = {
          employeeName: assessment.employee_name,
          position: assessment.position,
          department: assessment.department,
          skills: [],
          overallScore: 0
        };
      }

      const skill = skills.find(s => s.id === assessment.skill_id);
      groups[assessment.employee_name].skills.push({
        id: assessment.skill_id,
        name: skill?.name || 'Compétence inconnue',
        category: skill?.category || 'Non définie',
        currentLevel: assessment.current_level,
        targetLevel: assessment.target_level,
        lastAssessed: assessment.last_assessed,
        assessor: assessment.assessor
      });

      return groups;
    }, {} as any);

    // Calculate overall scores
    Object.values(employeeGroups).forEach((group: any) => {
      if (group.skills.length > 0) {
        group.overallScore = group.skills.reduce((sum: number, skill: any) => sum + skill.currentLevel, 0) / group.skills.length;
      }
    });

    return Object.values(employeeGroups);
  };

  const getSkillsStats = () => {
    const totalSkills = skills.length;
    const totalAssessments = skillAssessments.length;
    const averageLevel = skillAssessments.length > 0 
      ? skillAssessments.reduce((sum, assessment) => sum + assessment.current_level, 0) / skillAssessments.length 
      : 0;
    
    return {
      totalSkills,
      totalAssessments,
      averageLevel: Math.round(averageLevel * 10) / 10
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    skills,
    skillAssessments,
    loading,
    error,
    refetch: fetchData,
    createSkill,
    createSkillAssessment,
    getSkillAssessmentsByEmployee,
    getSkillsMatrix,
    getSkillsStats
  };
};