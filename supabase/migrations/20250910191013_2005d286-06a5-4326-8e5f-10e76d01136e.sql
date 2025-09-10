-- First, clean up orphaned records in training_enrollments that don't have matching employees
DELETE FROM public.training_enrollments 
WHERE employee_id NOT IN (
    SELECT user_id FROM public.employees WHERE user_id IS NOT NULL
);

-- Now make the column NOT NULL and add the foreign key constraint
ALTER TABLE public.training_enrollments 
ALTER COLUMN employee_id SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE public.training_enrollments 
ADD CONSTRAINT fk_training_enrollments_employee_id 
FOREIGN KEY (employee_id) REFERENCES public.employees(user_id) ON DELETE CASCADE;