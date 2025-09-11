-- Générer les recommandations pour toutes les instances d'alertes existantes
DO $$
DECLARE
    alert_instance_record RECORD;
BEGIN
    FOR alert_instance_record IN 
        SELECT id FROM public.alert_instances 
    LOOP
        PERFORM public.calculate_alert_recommendations(alert_instance_record.id);
    END LOOP;
END $$;