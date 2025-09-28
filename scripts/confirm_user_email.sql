-- Fonction pour confirmer l'email d'un utilisateur via admin
-- Cette fonction utilise les privilèges SECURITY DEFINER pour confirmer l'email

CREATE OR REPLACE FUNCTION confirm_user_email(user_id UUID)
RETURNS JSON AS $$
DECLARE
  row_count INTEGER;
BEGIN
  -- Mettre à jour le statut de confirmation de l'email dans auth.users
  UPDATE auth.users 
  SET 
    email_confirmed_at = now(),
    confirmed_at = now()
  WHERE id = user_id;
  
  -- Vérifier si la mise à jour a réussi
  GET DIAGNOSTICS row_count = ROW_COUNT;
  
  IF row_count > 0 THEN
    RETURN json_build_object(
      'success', true,
      'message', 'Email confirmé avec succès',
      'user_id', user_id
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur non trouvé'
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Erreur lors de la confirmation: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION confirm_user_email TO authenticated;
GRANT EXECUTE ON FUNCTION confirm_user_email TO anon;

-- Commentaire d'utilisation :
-- Cette fonction permet de confirmer manuellement l'email d'un utilisateur
-- Elle doit être appelée après la connexion de l'utilisateur temporaire
