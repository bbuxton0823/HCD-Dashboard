import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { refreshAllData } from '@/services/dataIntegration';
import { useLanguage } from '@/lib/LanguageContext';
import { uiTranslations } from '@/lib/translations';

const RefreshButtonContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const RefreshButton = styled.button`
  display: inline-flex;
  align-items: center;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #004a7c;
  }
  
  &:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
  
  svg {
    margin-right: 0.5rem;
  }
`;

const MCPSelector = styled.select`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: white;
  font-size: 0.9rem;
`;

const MCPToggleContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 10px;
  background-color: #f9f9f9;
`;

const RecommendationText = styled.div<{ confidence: number }>`
  font-size: 0.85rem;
  color: ${props => 
    props.confidence > 0.7 ? 'var(--assistant-green)' : 
    props.confidence > 0.5 ? 'var(--assistant-yellow)' : 
    'var(--secondary-color)'};
  padding: 6px;
  background-color: rgba(0,0,0,0.03);
  border-radius: 4px;
  margin-top: 5px;
`;

const SpinnerIcon = styled.svg`
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const SelectorLabel = styled.label`
  font-size: 0.8rem;
  color: var(--text-color);
  display: block;
`;

const ToggleSwitch = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const ToggleLabel = styled.label`
  cursor: pointer;
  display: flex;
  align-items: center;
  margin-bottom: 0;
  user-select: none;
`;

const InfoIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: var(--secondary-color);
  color: white;
  font-size: 11px;
  cursor: help;
  position: relative;
`;

const Tooltip = styled.div<{ visible: boolean }>`
  position: absolute;
  z-index: 10;
  width: 220px;
  padding: 8px;
  background-color: #333;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: none;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.2s;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -5px;
    border-width: 5px;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
`;

const Switch = styled.div`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  margin-right: 8px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 24px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: var(--primary-color);
  }

  input:focus + .slider {
    box-shadow: 0 0 1px var(--primary-color);
  }

  input:checked + .slider:before {
    transform: translateX(24px);
  }
`;

interface RefreshDataButtonProps {
  onRefreshComplete?: () => void;
  isAdmin?: boolean;
  currentView?: string;
}

interface MCPRecommendation {
  recommendedMCP: 'browser-tools' | 'puppeteer';
  confidence: number;
  reasoning: string;
}

// Track MCP success rates in session storage
const getSuccessRates = (): { browserTools: number; puppeteer: number } => {
  if (typeof window === 'undefined') return { browserTools: 0, puppeteer: 0 };
  
  const storedRates = sessionStorage.getItem('mcpSuccessRates');
  if (!storedRates) {
    return { browserTools: 0, puppeteer: 0 };
  }
  
  return JSON.parse(storedRates);
};

const updateSuccessRate = (mcp: 'browser-tools' | 'puppeteer', success: boolean): void => {
  if (typeof window === 'undefined') return;
  
  const rates = getSuccessRates();
  
  if (success) {
    if (mcp === 'browser-tools') {
      rates.browserTools++;
    } else {
      rates.puppeteer++;
    }
  }
  
  sessionStorage.setItem('mcpSuccessRates', JSON.stringify(rates));
};

const RefreshDataButton: React.FC<RefreshDataButtonProps> = ({ 
  onRefreshComplete, 
  isAdmin = false,
  currentView = 'overview' 
}) => {
  const { language } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMCP, setSelectedMCP] = useState<'browser-tools' | 'puppeteer'>('browser-tools');
  const [useAIRecommendation, setUseAIRecommendation] = useState(true);
  const [recommendation, setRecommendation] = useState<MCPRecommendation | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  // Get UI translations
  const t = uiTranslations[language];
  
  const getRecommendation = async (operation: string = 'all') => {
    try {
      const response = await fetch('/api/recommend-mcp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentView,
          operation,
          previousSuccesses: getSuccessRates(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get MCP recommendation');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setRecommendation({
          recommendedMCP: result.recommendedMCP,
          confidence: result.confidence,
          reasoning: result.reasoning
        });
        
        if (useAIRecommendation) {
          setSelectedMCP(result.recommendedMCP);
        }
      }
    } catch (error) {
      console.error('Error getting MCP recommendation:', error);
    }
  };
  
  // Get recommendation when component mounts or currentView changes
  useEffect(() => {
    if (isAdmin) {
      getRecommendation();
    }
  }, [currentView, isAdmin]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      // If AI recommendation is enabled and we don't have a recommendation yet, get one
      if (isAdmin && useAIRecommendation && !recommendation) {
        await getRecommendation();
      }
      
      const usePuppeteerMCP = selectedMCP === 'puppeteer';
      await refreshAllData(usePuppeteerMCP);
      
      // Record successful MCP usage
      updateSuccessRate(selectedMCP, true);
      
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  const handleToggleAIRecommendation = () => {
    setUseAIRecommendation(!useAIRecommendation);
    
    // If turning on AI recommendation and we have a recommendation, apply it
    if (!useAIRecommendation && recommendation) {
      setSelectedMCP(recommendation.recommendedMCP);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleToggleAIRecommendation();
      e.preventDefault();
    }
  };
  
  return (
    <RefreshButtonContainer>
      {isAdmin ? (
        <>
          <MCPToggleContainer>
            <ToggleSwitch>
              <ToggleLabel>
                <Switch>
                  <input 
                    type="checkbox" 
                    id="ai-recommendation-toggle"
                    checked={useAIRecommendation} 
                    onChange={handleToggleAIRecommendation}
                    aria-label={t.aiRecommendedMCP}
                  />
                  <span 
                    className="slider"
                    role="presentation" 
                  ></span>
                </Switch>
                <span onClick={handleToggleAIRecommendation} onKeyDown={handleKeyDown} tabIndex={0} role="button">
                  {t.aiRecommendedMCP}
                </span>
                <InfoIcon 
                  onMouseEnter={() => setTooltipVisible(true)}
                  onMouseLeave={() => setTooltipVisible(false)}
                  onFocus={() => setTooltipVisible(true)}
                  onBlur={() => setTooltipVisible(false)}
                  tabIndex={0}
                  role="button"
                  aria-label="MCP selection information"
                >
                  i
                  <Tooltip visible={tooltipVisible}>
                    {t.mcpTooltip || "AI will select the best data collection method based on past performance and current conditions."}
                  </Tooltip>
                </InfoIcon>
              </ToggleLabel>
            </ToggleSwitch>
            
            {(!useAIRecommendation || !recommendation) ? (
              <>
                <SelectorLabel htmlFor="mcp-selector">{t.manualMCPSelection}</SelectorLabel>
                <MCPSelector 
                  id="mcp-selector"
                  value={selectedMCP}
                  onChange={(e) => setSelectedMCP(e.target.value as 'browser-tools' | 'puppeteer')}
                  disabled={isRefreshing || useAIRecommendation}
                  aria-label={t.manualMCPSelection}
                >
                  <option value="browser-tools">{t.browserToolsMCP}</option>
                  <option value="puppeteer">{t.puppeteerMCP}</option>
                </MCPSelector>
              </>
            ) : (
              <RecommendationText confidence={recommendation.confidence}>
                <strong>{t.aiRecommendation}:</strong> {recommendation.reasoning}
              </RecommendationText>
            )}
          </MCPToggleContainer>
        </>
      ) : (
        <MCPSelector 
          value={selectedMCP}
          onChange={(e) => setSelectedMCP(e.target.value as 'browser-tools' | 'puppeteer')}
          disabled={isRefreshing}
          aria-label={t.selectMCP || "Select data collection method"}
        >
          <option value="browser-tools">{t.browserToolsMCP}</option>
          <option value="puppeteer">{t.puppeteerMCP}</option>
        </MCPSelector>
      )}
      
      <RefreshButton 
        onClick={handleRefresh} 
        disabled={isRefreshing}
        title={`${t.refreshData} (${selectedMCP === 'puppeteer' ? t.puppeteerMCP : t.browserToolsMCP})`}
      >
        {isRefreshing ? (
          <SpinnerIcon width="16" height="16" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" fill="none" strokeDasharray="30 60" />
          </SpinnerIcon>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        )}
        {isRefreshing ? t.refreshing : t.refreshData}
      </RefreshButton>
    </RefreshButtonContainer>
  );
};

export default RefreshDataButton; 