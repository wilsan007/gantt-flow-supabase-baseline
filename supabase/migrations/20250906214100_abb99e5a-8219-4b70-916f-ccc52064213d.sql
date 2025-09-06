-- Modifier le type de la colonne effort_estimate_h pour accepter les nombres décimaux
ALTER TABLE public.tasks 
ALTER COLUMN effort_estimate_h TYPE NUMERIC(10,2);