import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qliinxtanjdnwxlvnxji.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaWlueHRhbmpkbnd4bHZueGppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2ODYxMywiZXhwIjoyMDcyNzQ0NjEzfQ.THSC4CaaEh0IJPP-zPRXGFIbltg79wpOGoEG4diLZAI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProjectsTable() {
  console.log('🔍 VÉRIFICATION TABLE PROJECTS');
  console.log('==============================');
  
  try {
    // Tester si la table projects existe
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Table projects:', error.message);
      
      if (error.message.includes('does not exist')) {
        console.log('\n💡 SOLUTION: Créer la table projects');
        console.log('Exécutez ce SQL dans Supabase Dashboard:');
        console.log(`
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  status text DEFAULT 'active',
  priority text DEFAULT 'medium',
  start_date date,
  end_date date,
  manager_id uuid REFERENCES public.profiles(user_id),
  department_id uuid,
  tenant_id uuid NOT NULL,
  budget decimal,
  progress integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour les performances
CREATE INDEX idx_projects_tenant_id ON public.projects(tenant_id);
CREATE INDEX idx_projects_manager_id ON public.projects(manager_id);

-- RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_by_tenant ON public.projects
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = projects.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
);
        `);
      }
    } else {
      console.log('✅ Table projects existe');
      
      if (data && data.length > 0) {
        console.log('📄 Exemple de structure:', Object.keys(data[0]));
      } else {
        console.log('📄 Table vide, pas d\'exemple de structure');
      }
    }
    
    // Vérifier aussi departments
    const { data: deptData, error: deptError } = await supabase
      .from('departments')
      .select('*')
      .limit(1);
    
    if (deptError) {
      console.log('\n❌ Table departments:', deptError.message);
      
      if (deptError.message.includes('does not exist')) {
        console.log('\n💡 SOLUTION: Créer la table departments');
        console.log(`
CREATE TABLE public.departments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  manager_id uuid REFERENCES public.profiles(user_id),
  tenant_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index et RLS
CREATE INDEX idx_departments_tenant_id ON public.departments(tenant_id);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY departments_by_tenant ON public.departments
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.tenant_id = departments.tenant_id
      AND ur.user_id = auth.uid()
      AND ur.is_active = true
  )
);
        `);
      }
    } else {
      console.log('✅ Table departments existe');
    }
    
  } catch (err) {
    console.error('💥 Erreur:', err);
  }
}

checkProjectsTable();
