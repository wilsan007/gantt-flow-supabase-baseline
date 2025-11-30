-- Create a sequence for employee IDs if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS public.employee_id_seq START WITH 1000 INCREMENT BY 1;

-- Function to generate employee ID
CREATE OR REPLACE FUNCTION public.generate_employee_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate if not provided
  IF NEW.employee_id IS NULL THEN
    NEW.employee_id := 'EMP-' || nextval('public.employee_id_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for employees table
DROP TRIGGER IF EXISTS set_employee_id ON public.employees;
CREATE TRIGGER set_employee_id
  BEFORE INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_employee_id();

-- Also add it to profiles if it exists there and is null, to keep them in sync if needed
-- But primarily we rely on the employees table. 
-- If profiles has the column, we can try to sync it or just leave it. 
-- Based on user dump, profiles has employee_id. Let's add a trigger there too just in case 
-- or ensure the edge function handles the sync. 
-- For now, let's focus on the employees table as requested.
