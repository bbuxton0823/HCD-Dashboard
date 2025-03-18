import React from 'react';
import styled from 'styled-components';
import { useLanguage } from '@/lib/LanguageContext';
import { uiTranslations } from '@/lib/translations';

const LanguageToggleContainer = styled.div`
  display: flex;
  align-items: center;
  margin-left: 10px;
`;

const LanguageSelector = styled.select`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: white;
  font-size: 0.9rem;
  cursor: pointer;
`;

const Label = styled.span`
  font-size: 0.9rem;
  margin-right: 5px;
  color: var(--text-color);
`;

interface LanguageToggleProps {
  compact?: boolean;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as 'en' | 'es' | 'zh');
  };
  
  return (
    <LanguageToggleContainer>
      {!compact && (
        <Label>
          {uiTranslations[language].language}:
        </Label>
      )}
      <LanguageSelector 
        value={language}
        onChange={handleChange}
        title={uiTranslations[language].language}
      >
        <option value="en">{uiTranslations[language].english}</option>
        <option value="es">{uiTranslations[language].spanish}</option>
        <option value="zh">{uiTranslations[language].chinese}</option>
      </LanguageSelector>
    </LanguageToggleContainer>
  );
};

export default LanguageToggle; 