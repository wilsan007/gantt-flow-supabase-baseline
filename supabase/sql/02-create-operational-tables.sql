-- =====================================================
-- Création des Tables Opérationnelles
-- Module: Tâches Récurrentes & Opérations
-- =====================================================

-- =====================================================
-- 1. TABLE: operational_activities
-- Définit les activités (modèles) récurrentes ou ponctuelles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.operational_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Informations de base
    name TEXT NOT NULL,
    description TEXT,
    
    -- Type d'activité
    kind TEXT NOT NULL CHECK (kind IN ('recurring', 'one_off')) DEFAULT 'recurring',
    
    -- Portée de l'activité
    scope TEXT NOT NULL CHECK (scope IN ('org', 'department', 'team', 'person')) DEFAULT 'org',
    
    -- Liens avec d'autres entités
    department_id UUID,
    owner_id UUID,              -- Responsable par défaut (user_id)
    project_id UUID,            -- Optionnel: rattacher à un projet (NULL = opération hors projet)
    
    -- Template pour le titre des tâches générées
    task_title_template TEXT DEFAULT 'Activité {{date}}',
    
    -- État
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    
    -- Contraintes
    CONSTRAINT valid_scope CHECK (scope IN ('org', 'department', 'team', 'person')),
    CONSTRAINT valid_kind CHECK (kind IN ('recurring', 'one_off'))
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_op_activities_tenant 
    ON public.operational_activities(tenant_id);
    
CREATE INDEX IF NOT EXISTS idx_op_activities_active 
    ON public.operational_activities(tenant_id, is_active) 
    WHERE is_active = true;
    
CREATE INDEX IF NOT EXISTS idx_op_activities_owner 
    ON public.operational_activities(owner_id);
    
CREATE INDEX IF NOT EXISTS idx_op_activities_project 
    ON public.operational_activities(project_id) 
    WHERE project_id IS NOT NULL;

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_op_activities_updated_at
    BEFORE UPDATE ON public.operational_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. TABLE: operational_schedules
-- Définit la planification (récurrence) des activités
-- =====================================================
CREATE TABLE IF NOT EXISTS public.operational_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    activity_id UUID NOT NULL REFERENCES public.operational_activities(id) ON DELETE CASCADE,
    
    -- Configuration temporelle
    timezone TEXT NOT NULL DEFAULT 'Africa/Djibouti',
    
    -- RRULE (RFC 5545) - Exemples:
    -- FREQ=DAILY
    -- FREQ=WEEKLY;BYDAY=MO,WE,FR
    -- FREQ=MONTHLY;BYMONTHDAY=1,15
    rrule TEXT,
    
    -- Dates de début et fin
    start_date DATE NOT NULL,
    until DATE,
    
    -- Fenêtre de génération (horizon en jours)
    generate_window_days INT NOT NULL DEFAULT 30,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT valid_window CHECK (generate_window_days > 0 AND generate_window_days <= 365),
    CONSTRAINT valid_dates CHECK (until IS NULL OR until >= start_date)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_op_schedules_tenant 
    ON public.operational_schedules(tenant_id);
    
CREATE INDEX IF NOT EXISTS idx_op_schedules_activity 
    ON public.operational_schedules(activity_id);
    
CREATE INDEX IF NOT EXISTS idx_op_schedules_dates 
    ON public.operational_schedules(start_date, until);

-- Trigger pour updated_at
CREATE TRIGGER update_op_schedules_updated_at
    BEFORE UPDATE ON public.operational_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Contrainte: une seule planification par activité
CREATE UNIQUE INDEX IF NOT EXISTS uq_op_schedules_activity 
    ON public.operational_schedules(activity_id);

-- =====================================================
-- 3. TABLE: operational_action_templates
-- Templates d'actions (checklist) à cloner sur chaque occurrence
-- =====================================================
CREATE TABLE IF NOT EXISTS public.operational_action_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    activity_id UUID NOT NULL REFERENCES public.operational_activities(id) ON DELETE CASCADE,
    
    -- Contenu de l'action
    title TEXT NOT NULL,
    description TEXT,
    
    -- Position dans la liste
    position INT NOT NULL DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT valid_position CHECK (position >= 0)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_op_act_templates_activity 
    ON public.operational_action_templates(activity_id, position);
    
CREATE INDEX IF NOT EXISTS idx_op_act_templates_tenant 
    ON public.operational_action_templates(tenant_id);

-- =====================================================
-- 4. MODIFICATION TABLE: tasks
-- Ajouter les colonnes pour lier aux activités opérationnelles
-- =====================================================

-- Vérifier et ajouter activity_id si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'tasks' 
          AND column_name = 'activity_id'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN activity_id UUID REFERENCES public.operational_activities(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Vérifier et ajouter is_operational si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'tasks' 
          AND column_name = 'is_operational'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN is_operational BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Index pour filtrer les tâches opérationnelles
CREATE INDEX IF NOT EXISTS idx_tasks_operational 
    ON public.tasks(tenant_id, is_operational) 
    WHERE is_operational = true;

-- Index pour lier aux activités
CREATE INDEX IF NOT EXISTS idx_tasks_activity 
    ON public.tasks(activity_id) 
    WHERE activity_id IS NOT NULL;

-- =====================================================
-- 5. INDEX UNIQUE: Idempotence des occurrences
-- Une seule tâche par (activity_id, due_date) pour éviter les doublons
-- =====================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_tasks_activity_occurrence
    ON public.tasks (tenant_id, activity_id, due_date)
    WHERE activity_id IS NOT NULL;

-- =====================================================
-- 6. COMMENTAIRES (Documentation)
-- =====================================================

COMMENT ON TABLE public.operational_activities IS 
'Définit les activités (modèles) récurrentes ou ponctuelles hors projet';

COMMENT ON COLUMN public.operational_activities.kind IS 
'Type: recurring (génération automatique) ou one_off (manuelle)';

COMMENT ON COLUMN public.operational_activities.task_title_template IS 
'Template du titre avec variables: {{date}}, {{isoWeek}}, {{year}}, {{month}}, {{day}}';

COMMENT ON TABLE public.operational_schedules IS 
'Planification RRULE pour les activités récurrentes';

COMMENT ON COLUMN public.operational_schedules.rrule IS 
'RFC 5545 RRULE: FREQ=DAILY/WEEKLY/MONTHLY;BYDAY=MO,TU;BYMONTHDAY=1,15';

COMMENT ON COLUMN public.operational_schedules.generate_window_days IS 
'Horizon de génération en jours (ex: 30 = génère J→J+30)';

COMMENT ON TABLE public.operational_action_templates IS 
'Templates d''actions (checklist) à cloner sur chaque occurrence de tâche';

COMMENT ON COLUMN public.tasks.activity_id IS 
'Lien vers l''activité opérationnelle qui a généré cette tâche';

COMMENT ON COLUMN public.tasks.is_operational IS 
'Indique si la tâche est une opération (récurrente ou ponctuelle) hors projet';

-- =====================================================
-- Résultat attendu:
-- ✅ 3 nouvelles tables créées (operational_activities, operational_schedules, operational_action_templates)
-- ✅ 2 colonnes ajoutées à tasks (activity_id, is_operational)
-- ✅ Index pour performance et idempotence
-- ✅ Triggers pour updated_at
-- ✅ Documentation complète
-- =====================================================
