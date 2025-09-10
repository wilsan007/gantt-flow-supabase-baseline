-- Create advanced HR tables for capacity planning, recruitment (ATS), and multi-country policies

-- Capacity Planning
CREATE TABLE public.capacity_planning (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  allocated_hours INTEGER NOT NULL DEFAULT 0,
  available_hours INTEGER NOT NULL DEFAULT 0,
  project_hours INTEGER NOT NULL DEFAULT 0,
  absence_hours INTEGER NOT NULL DEFAULT 0,
  capacity_utilization NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Job Posts (Mini-ATS)
CREATE TABLE public.job_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department_id UUID,
  position_id UUID,
  description TEXT,
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  salary_min NUMERIC,
  salary_max NUMERIC,
  location TEXT,
  employment_type TEXT NOT NULL DEFAULT 'full_time',
  posted_date DATE,
  closing_date DATE,
  hiring_manager_id UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Candidates
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  linkedin_url TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'applied',
  source TEXT,
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Job Applications (link candidates to job posts)
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_post_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'applied',
  applied_date DATE NOT NULL DEFAULT CURRENT_DATE,
  stage TEXT NOT NULL DEFAULT 'screening',
  score INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID DEFAULT get_user_tenant_id(),
  UNIQUE(job_post_id, candidate_id)
);

-- Interviews
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL,
  interviewer_id UUID,
  interviewer_name TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER DEFAULT 60,
  type TEXT NOT NULL DEFAULT 'phone',
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  feedback TEXT,
  score INTEGER,
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Job Offers
CREATE TABLE public.job_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL,
  salary_offered NUMERIC NOT NULL,
  benefits TEXT,
  start_date DATE,
  offer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  terms_conditions TEXT,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Multi-country Policies
CREATE TABLE public.country_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  language TEXT NOT NULL DEFAULT 'fr',
  working_hours_per_week INTEGER DEFAULT 35,
  public_holidays JSONB,
  leave_policies JSONB,
  tax_rates JSONB,
  compliance_rules TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID DEFAULT get_user_tenant_id()
);

-- AI Insights and Risk Analysis
CREATE TABLE public.employee_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'low',
  score NUMERIC,
  description TEXT,
  recommendations TEXT,
  data_sources JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Analytics KPIs
CREATE TABLE public.hr_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  department_id UUID,
  metadata JSONB,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tenant_id UUID DEFAULT get_user_tenant_id()
);

-- Enable RLS on all new tables
ALTER TABLE public.capacity_planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for capacity_planning
CREATE POLICY "Authenticated users can manage tenant capacity planning" 
ON public.capacity_planning 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- RLS Policies for job_posts
CREATE POLICY "Authenticated users can manage tenant job posts" 
ON public.job_posts 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- RLS Policies for candidates
CREATE POLICY "Authenticated users can manage tenant candidates" 
ON public.candidates 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- RLS Policies for job_applications
CREATE POLICY "Authenticated users can manage tenant job applications" 
ON public.job_applications 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- RLS Policies for interviews
CREATE POLICY "Authenticated users can manage tenant interviews" 
ON public.interviews 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- RLS Policies for job_offers
CREATE POLICY "Authenticated users can manage tenant job offers" 
ON public.job_offers 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- RLS Policies for country_policies
CREATE POLICY "Authenticated users can manage tenant country policies" 
ON public.country_policies 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- RLS Policies for employee_insights
CREATE POLICY "Authenticated users can manage tenant employee insights" 
ON public.employee_insights 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- RLS Policies for hr_analytics
CREATE POLICY "Authenticated users can manage tenant hr analytics" 
ON public.hr_analytics 
FOR ALL 
USING (auth.uid() IS NOT NULL AND tenant_id = get_user_tenant_id());

-- Triggers for updated_at
CREATE TRIGGER update_capacity_planning_updated_at
  BEFORE UPDATE ON public.capacity_planning
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_posts_updated_at
  BEFORE UPDATE ON public.job_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON public.candidates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_interviews_updated_at
  BEFORE UPDATE ON public.interviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_offers_updated_at
  BEFORE UPDATE ON public.job_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_country_policies_updated_at
  BEFORE UPDATE ON public.country_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_insights_updated_at
  BEFORE UPDATE ON public.employee_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();