import { useState, useCallback, useEffect } from 'react';

/**
 * Hook personnalisé pour gérer le comportement des placeholders
 * Vide automatiquement le placeholder quand l'utilisateur clique sur le champ
 */
export const usePlaceholderHandler = (initialPlaceholder: string) => {
  const [hasBeenFocused, setHasBeenFocused] = useState(false);

  const handleFocus = useCallback(() => {
    if (!hasBeenFocused) {
      setHasBeenFocused(true);
    }
  }, [hasBeenFocused]);

  const resetFocus = useCallback(() => {
    setHasBeenFocused(false);
  }, []);

  const getPlaceholder = useCallback(
    (currentValue: string) => {
      // Si le champ a été focalisé ou contient une valeur, ne pas afficher le placeholder
      return hasBeenFocused || currentValue !== '' ? '' : initialPlaceholder;
    },
    [hasBeenFocused, initialPlaceholder]
  );

  return {
    handleFocus,
    resetFocus,
    getPlaceholder,
    hasBeenFocused,
  };
};

/**
 * Hook pour gérer plusieurs champs avec placeholders
 * Amélioration : Détecte automatiquement les valeurs pré-remplies par le navigateur
 */
export const useMultiplePlaceholderHandler = (placeholders: Record<string, string>) => {
  const [focusedFields, setFocusedFields] = useState<Record<string, boolean>>({});
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});

  const handleFocus = useCallback((fieldName: string) => {
    setFocusedFields(prev => ({
      ...prev,
      [fieldName]: true,
    }));
  }, []);

  const resetFocus = useCallback((fieldName?: string) => {
    if (fieldName) {
      setFocusedFields(prev => ({
        ...prev,
        [fieldName]: false,
      }));
    } else {
      setFocusedFields({});
    }
  }, []);

  // Fonction pour forcer le masquage du placeholder (sécurité)
  const forceHidePlaceholder = useCallback((fieldName: string) => {
    setFocusedFields(prev => ({
      ...prev,
      [fieldName]: true,
    }));
  }, []);

  // Fonction pour permettre à l'utilisateur de réinitialiser le champ
  const handleFieldClear = useCallback((fieldName: string) => {
    // Si l'utilisateur efface complètement le champ, on peut remettre le placeholder
    // mais seulement s'il clique à nouveau
    setFocusedFields(prev => ({
      ...prev,
      [fieldName]: false,
    }));
  }, []);

  const getPlaceholder = useCallback(
    (fieldName: string, currentValue: string) => {
      const hasBeenFocused = focusedFields[fieldName] || false;
      const placeholder = placeholders[fieldName] || '';

      // SÉCURITÉ : Si le champ a été focalisé ou contient une valeur, ne jamais afficher le placeholder
      // Cela empêche l'auto-complétion de masquer notre logique
      return hasBeenFocused || currentValue !== '' ? '' : placeholder;
    },
    [focusedFields, placeholders]
  );

  return {
    handleFocus,
    resetFocus,
    getPlaceholder,
    focusedFields,
    forceHidePlaceholder,
    handleFieldClear,
  };
};
