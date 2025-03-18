import React from 'react';
import styled from 'styled-components';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '@/lib/LanguageContext';
import { uiTranslations } from '@/lib/translations';

const HeaderContainer = styled.header`
  background-color: var(--primary-color);
  color: white;
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
`;

const HeaderContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.h1`
  font-size: 1.8rem;
  margin: 0;
`;

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { language } = useLanguage();
  
  return (
    <HeaderContainer>
      <HeaderContent>
        <HeaderTitle>{title}</HeaderTitle>
        <LanguageToggle />
      </HeaderContent>
    </HeaderContainer>
  );
};

export default Header; 