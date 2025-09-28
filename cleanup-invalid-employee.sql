-- Nettoyer l'employé invalide avec EMPNaN
DELETE FROM public.employees WHERE employee_id = 'EMPNaN';

SELECT 'Employé invalide EMPNaN supprimé avec succès.' as status;
