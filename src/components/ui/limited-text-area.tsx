import React, { useState, useEffect, useRef } from 'react';
import { getActionColumnConfig } from '@/utils/table-alignment';

interface LimitedTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const LimitedTextArea: React.FC<LimitedTextAreaProps> = ({
  value,
  onChange,
  placeholder = "Tapez votre texte...",
  className = "",
  disabled = false
}) => {
  const [dimensions, setDimensions] = useState({ 
    width: 120, 
    maxCharsPerLine: 14, 
    maxTotalChars: 28 
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Utiliser les dimensions fixes (plus de calcul dynamique)
  useEffect(() => {
    const { width, maxCharsPerLine, maxTotalChars } = getActionColumnConfig();
    setDimensions({ width, maxCharsPerLine, maxTotalChars });
  }, []);

  // Fonction pour formater le texte avec retour automatique à la ligne
  const formatTextWithLineBreaks = (text: string): string => {
    if (text.length <= dimensions.maxCharsPerLine) {
      return text;
    }
    
    // Première ligne : 14 caractères max
    const firstLine = text.substring(0, dimensions.maxCharsPerLine);
    // Deuxième ligne : 14 caractères max
    const secondLine = text.substring(dimensions.maxCharsPerLine, dimensions.maxTotalChars);
    
    return firstLine + (secondLine ? '\n' + secondLine : '');
  };

  // Gérer le changement de texte avec limitation et retour automatique
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value.replace(/\n/g, ''); // Supprimer les retours manuels
    
    // Limiter le nombre total de caractères
    if (newValue.length <= dimensions.maxTotalChars) {
      const formattedValue = formatTextWithLineBreaks(newValue);
      onChange(formattedValue);
    } else {
      // Tronquer le texte si il dépasse la limite totale
      const truncatedValue = newValue.substring(0, dimensions.maxTotalChars);
      const formattedValue = formatTextWithLineBreaks(truncatedValue);
      onChange(formattedValue);
      
      console.warn(`📝 Texte tronqué à ${dimensions.maxTotalChars} caractères maximum (2 lignes de ${dimensions.maxCharsPerLine})`);
    }
  };

  // Gérer les touches spéciales
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const currentLength = value.replace(/\n/g, '').length; // Compter sans les retours à la ligne
    
    // Empêcher l'ajout de caractères si la limite totale est atteinte
    if (currentLength >= dimensions.maxTotalChars && 
        e.key !== 'Backspace' && 
        e.key !== 'Delete' && 
        e.key !== 'ArrowLeft' && 
        e.key !== 'ArrowRight' && 
        e.key !== 'ArrowUp' && 
        e.key !== 'ArrowDown' &&
        e.key !== 'Tab') {
      e.preventDefault();
    }
    
    // Empêcher les retours à la ligne manuels (géré automatiquement)
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  return (
    <div 
      className="limited-text-area-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%'
      }}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`limited-text-area ${className}`}
        style={{
          width: `${dimensions.width}px`,
          minWidth: `${dimensions.width}px`,
          maxWidth: `${dimensions.width}px`,
          height: 'auto',
          minHeight: '40px',
          maxHeight: '80px', // Limite à 2 lignes environ
          resize: 'none',
          overflow: 'hidden',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap',
          fontSize: '14px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: '400',
          padding: '8px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: '6px',
          outline: 'none',
          transition: 'border-color 0.2s ease',
          backgroundColor: disabled ? '#f8fafc' : '#ffffff',
          textAlign: 'center' // Centrer le texte à l'intérieur
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#e2e8f0';
          e.target.style.boxShadow = 'none';
        }}
      />
      
      {/* Compteur de caractères centré */}
      <div 
        className="char-counter"
        style={{
          fontSize: '11px',
          color: value.replace(/\n/g, '').length >= dimensions.maxTotalChars ? '#ef4444' : '#64748b',
          textAlign: 'center',
          marginTop: '4px',
          fontFamily: 'Inter, system-ui, sans-serif',
          width: `${dimensions.width}px`
        }}
      >
        {value.replace(/\n/g, '').length}/{dimensions.maxTotalChars} ({dimensions.maxCharsPerLine}/ligne)
      </div>
    </div>
  );
};

export default LimitedTextArea;
