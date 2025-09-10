-- Add foreign key constraint from training_enrollments.employee_id to employees.user_id
-- First, let's make sure the column exists and is properly typed
ALTER TABLE public.training_enrollments 
ALTER COLUMN employee_id SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE public.training_enrollments 
ADD CONSTRAINT fk_training_enrollments_employee_id 
FOREIGN KEY (employee_id) REFERENCES public.employees(user_id) ON DELETE CASCADE;