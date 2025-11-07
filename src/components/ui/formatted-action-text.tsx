import React from 'react';
import { formatTextToDocumentationsStandard } from '@/utils/table-alignment';

interface FormattedActionTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const FormattedActionText: React.FC<FormattedActionTextProps> = ({
  text,
  className = '',
  style = {},
}) => {
  const formattedText = formatTextToDocumentationsStandard(text);

  return (
    <div
      className={`formatted-action-text ${className}`}
      style={{
        whiteSpace: 'pre-wrap', // Préserver les retours à la ligne
        textAlign: 'center',
        fontSize: '11px',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: '700',
        lineHeight: '1.2',
        letterSpacing: '0.5px',
        maxWidth: '120px', // Largeur basée sur "Documentations"
        wordBreak: 'break-word',
        overflow: 'hidden',
        ...style,
      }}
      title={text} // Tooltip avec le texte complet
    >
      {formattedText}
    </div>
  );
};

export default FormattedActionText;
