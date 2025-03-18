import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { DashboardData } from '@/models/InternalHCDData';
import { useLanguage } from '@/lib/LanguageContext';
import { uiTranslations, translateText } from '@/lib/translations';
import LanguageToggle from './LanguageToggle';

const AssistantContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 450px; /* Increased width for better text display */
  max-height: 550px; /* Increased height to show more content */
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &.minimized {
    height: 50px;
    width: 50px;
    border-radius: 25px;
  }
`;

const AssistantHeader = styled.div`
  background-color: var(--primary-color);
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

const HeaderTitle = styled.div`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AssistantContent = styled.div`
  padding: 20px;
  overflow-y: auto;
  flex-grow: 1;
  font-size: 15px; /* Slightly larger for better readability */
  line-height: 1.6; /* Increased line height for readability */
  word-break: break-word; /* Prevent text overflow */
  text-align: left; /* Ensure text is left-aligned */
  pointer-events: auto; /* Allow scrolling events */
`;

const SummaryWrapper = styled.div`
  pointer-events: none; /* Prevent mouse events from affecting the summary text */
`;

const SummaryText = styled.div`
  white-space: pre-wrap;
  pointer-events: none; /* Critical fix to prevent mouse events from corrupting text */
  
  /* Ensure paragraphs have proper spacing */
  p {
    margin-bottom: 16px;
    pointer-events: none;
  }
  
  /* Style for lists */
  ul, ol {
    padding-left: 20px;
    margin-bottom: 16px;
    pointer-events: none;
  }
  
  /* Style for bold text */
  strong, b {
    font-weight: 700;
    pointer-events: none;
  }
  
  /* Style for section headers */
  h3, h4 {
    margin-top: 16px;
    margin-bottom: 8px;
    font-weight: 600;
    pointer-events: none;
  }
`;

const MinimizeButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
`;

const StatusIndicator = styled.div<{ isGenerating: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${props => props.isGenerating ? '#ffc107' : '#28a745'};
  transition: background-color 0.3s ease;
`;

const RefreshButton = styled.button`
  background: none;
  border: none;
  color: var(--secondary-color);
  font-size: 14px;
  padding: 4px 8px;
  cursor: pointer;
  text-decoration: underline;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  z-index: 10; /* Ensure it's above other content */
  position: relative; /* Position context */
  pointer-events: auto; /* Ensure clicks work */
`;

const SourceIndicator = styled.div<{ source?: 'openai' | 'fallback' }>`
  font-size: 11px;
  color: ${props => props.source === 'openai' ? 'var(--assistant-blue)' : 'var(--secondary-color)'};
  text-align: right;
  margin-top: 10px;
  font-style: italic;
`;

const LanguageControls = styled.div`
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

interface AIAssistantProps {
  dashboardData: DashboardData;
  currentView: string;
}

// Function to safely convert markdown-like formatting to React components
const formatMarkdown = (text: string) => {
  if (!text) return [];
  
  // Process the text line by line
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  
  // Regular expressions for formatting
  const boldRegex = /\*\*([^*]+)\*\*/g;
  const bulletRegex = /^[-•]\s+(.+)$/;
  const headerRegex = /^#+\s+(.+)$/;
  
  lines.forEach((line, index) => {
    // Skip empty lines
    if (!line.trim()) {
      result.push(<br key={`br-${index}`} />);
      return;
    }
    
    // Process bullet points
    const bulletMatch = line.match(bulletRegex);
    if (bulletMatch) {
      result.push(<li key={`li-${index}`}>{bulletMatch[1]}</li>);
      return;
    }
    
    // Process headers
    const headerMatch = line.match(headerRegex);
    if (headerMatch) {
      result.push(<h4 key={`h-${index}`}>{headerMatch[1]}</h4>);
      return;
    }
    
    // Process bold text
    let formattedLine = line;
    let match;
    const fragments: React.ReactNode[] = [];
    let lastIndex = 0;
    let matchIndex = 0;
    
    // Check if there are any bold patterns
    if ((match = boldRegex.exec(line)) !== null) {
      // Reset regex to start from beginning
      boldRegex.lastIndex = 0;
      
      // Process all matches
      while ((match = boldRegex.exec(line)) !== null) {
        // Add text before the bold part
        if (match.index > lastIndex) {
          fragments.push(line.substring(lastIndex, match.index));
        }
        
        // Add the bold part
        fragments.push(<strong key={`strong-${index}-${matchIndex}`}>{match[1]}</strong>);
        
        lastIndex = match.index + match[0].length;
        matchIndex++;
      }
      
      // Add any remaining text
      if (lastIndex < line.length) {
        fragments.push(line.substring(lastIndex));
      }
      
      result.push(<p key={`p-${index}`}>{fragments}</p>);
    } else {
      // Regular text
      result.push(<p key={`p-${index}`}>{formattedLine}</p>);
    }
  });
  
  return result;
};

// Add this function after the formatMarkdown function
const extractAndFormatNumericalData = (text: string): string => {
  if (!text) return '';
  
  // Check if the text already contains a Key Numerical Data section
  if (text.includes('**Key Numerical Data:**')) {
    return ''; // Don't add duplicate sections
  }
  
  // Extract numerical data using regex
  // Look for numbers with context (number followed by a word or with a % sign)
  const percentagePattern = /(\d{1,3}(?:\.\d+)?)%\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,5})/g;
  const numberPattern = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+){0,5})/g;
  
  // First match percentages
  const percentMatches = Array.from(text.matchAll(percentagePattern));
  // Then match other numbers
  const numberMatches = Array.from(text.matchAll(numberPattern));
  
  // Create a Set to store unique data points and avoid duplicates
  const uniqueDataPoints = new Set<string>();
  
  // Process percentage matches
  percentMatches.forEach(match => {
    const [, number, context] = match;
    // Format as "X% context"
    const dataPoint = `${number}% ${context}`;
    uniqueDataPoints.add(dataPoint);
  });
  
  // Process number matches (excluding those that are part of percentage expressions)
  numberMatches.forEach(match => {
    const [fullMatch, number, context] = match;
    // Skip if this match is already covered by a percentage match
    if (percentMatches.some(pMatch => pMatch[0] === fullMatch)) {
      return;
    }
    // Format as "X context"
    const dataPoint = `${number} ${context}`;
    uniqueDataPoints.add(dataPoint);
  });
  
  // If no matches, return empty string
  if (uniqueDataPoints.size === 0) return '';
  
  // Convert set to array and sort (optional)
  const dataPoints = Array.from(uniqueDataPoints);
  
  // Group data points by type for better organization
  const percentagePoints = dataPoints.filter(point => point.includes('%'));
  const unitPoints = dataPoints.filter(point => !point.includes('%') && 
    (point.toLowerCase().includes('unit') || 
     point.toLowerCase().includes('planned') || 
     point.toLowerCase().includes('completed')));
  const otherPoints = dataPoints.filter(point => 
    !point.includes('%') && 
    !point.toLowerCase().includes('unit') &&
    !point.toLowerCase().includes('planned') && 
    !point.toLowerCase().includes('completed'));
  
  // Format as bullet points with proper categorization
  let result = `

**Key Numerical Data:**`;

  if (percentagePoints.length > 0) {
    result += `\n${percentagePoints.map(point => `• ${point}`).join('\n')}`;
  }
  
  if (unitPoints.length > 0) {
    result += `\n${unitPoints.map(point => `• ${point}`).join('\n')}`;
  }
  
  if (otherPoints.length > 0) {
    result += `\n${otherPoints.map(point => `• ${point}`).join('\n')}`;
  }
  
  return result;
};

// Create a memoized summary component
const MemorizedSummaryContent = React.memo(
  ({ content, analyzingText }: { content: string; analyzingText: string }) => {
    // Format the markdown only when we have content
    if (!content) {
      return <p>{analyzingText}</p>;
    }
    
    return <>{formatMarkdown(content)}</>;
  },
  // Custom comparison function to prevent unnecessary rerenders
  (prevProps, nextProps) => {
    // Only rerender if content actually changed or we're showing loading
    if (!prevProps.content && !nextProps.content) return true;
    if (prevProps.content === nextProps.content) return true;
    return false;
  }
);

// Add a debounced update function at the top of the AIAssistant component
const AIAssistant: React.FC<AIAssistantProps> = ({ dashboardData, currentView }) => {
  const { language } = useLanguage();
  const [isMinimized, setIsMinimized] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [source, setSource] = useState<'openai' | 'fallback' | undefined>(undefined);
  const [translatedSummary, setTranslatedSummary] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [lastSuccessfulSummary, setLastSuccessfulSummary] = useState<string>('');
  const summaryRef = useRef(''); // Reference to hold current summary text
  const [isMouseOver, setIsMouseOver] = useState(false);
  
  // Add a freezeUpdates ref to completely halt content updates during interactions
  const freezeUpdates = useRef(false);
  
  // Add a debounced update function
  function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    
    useEffect(() => {
      // Don't update during mouse hover
      if (isMouseOver) return;
      
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
    
    return debouncedValue;
  }
  
  // Use the debounced values for sensitive state
  const debouncedSummary = useDebounce(summary, 100);
  const debouncedTranslatedSummary = useDebounce(translatedSummary, 100);

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Stream the summary text for a more dynamic feel
  const streamSummary = (text: string) => {
    setIsGenerating(true);
    setSummary('');
    summaryRef.current = ''; // Reset the ref as well
    
    let i = 0;
    const interval = setInterval(() => {
      // If updates are frozen, skip this update cycle
      if (freezeUpdates.current) return;
      
      if (i < text.length) {
        const newChar = text.charAt(i);
        setSummary(prev => {
          const updated = prev + newChar;
          summaryRef.current = updated; // Update ref to keep in sync
          return updated;
        });
        i++;
      } else {
        clearInterval(interval);
        setIsGenerating(false);
        
        // Save last successful summary for regeneration
        if (!hasError) {
          setLastSuccessfulSummary(text);
        }
      }
    }, 5); // Slightly slower for better readability
  };

  // Update the formatSummary function to add the numerical data bullet points
  // Format the summary text with proper styling 
  const formatSummary = (text: string): string => {
    // Check for gibberish or invalid text (simple heuristic)
    const words = text.split(/\s+/);
    const gibberishThreshold = 0.2; // Adjust based on testing
    
    // Count potential gibberish words (randomly generated text often has unusual character patterns)
    let gibberishCount = 0;
    for (const word of words) {
      // Check for unusual character sequences that might indicate gibberish
      if (
        (/[^\w\s.,;:!?'-]/.test(word) && word.length > 3) || // Unusual characters
        /(.)\1{3,}/.test(word) || // Repeated characters (more than 3 times)
        (word.length > 15) || // Extremely long words
        (/[A-Z]{4,}/.test(word) && !/^[A-Z]+$/.test(word)) // Random capitalization
      ) {
        gibberishCount++;
      }
    }
    
    const gibberishRatio = gibberishCount / words.length;
    
    // If it appears to be gibberish, use the fallback summary
    if (gibberishRatio > gibberishThreshold || text.length < 20) {
      setHasError(true);
      return generateFallbackSummary(dashboardData, currentView);
    }
    
    setHasError(false);
    
    // Extract and append numerical data points as bullet points
    const numberBulletPoints = extractAndFormatNumericalData(text);
    const enhancedText = text + numberBulletPoints;
    
    // Return the enhanced text without HTML modifications - we'll handle formatting in render
    return enhancedText;
  };

  // Generate a summary based on dashboard data and current view
  const generateSummary = async () => {
    setIsGenerating(true);
    setSource(undefined);
    setHasError(false);
    
    try {
      // Call the OpenAI-powered API endpoint
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dashboardData,
          currentView
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }
      
      const result = await response.json();
      
      // Set the source of the summary (OpenAI or fallback)
      setSource(result.source);
      
      // Check for valid text and format it
      const formattedSummary = formatSummary(result.summary);
      
      // Stream the summary for better UX
      streamSummary(formattedSummary);
    } catch (error) {
      console.error('Error generating summary:', error);
      // Fallback summary in case of API error
      const fallbackSummary = generateFallbackSummary(dashboardData, currentView);
      setSource('fallback');
      setHasError(true);
      streamSummary(fallbackSummary);
    }
  };

  // Fallback summary generation if the API call fails
  const generateFallbackSummary = (data: DashboardData, view: string): string => {
    const { summaryStats, incomeDistribution, progressChart } = data;
    
    const summaries = {
      'overview': `You're viewing the San Mateo County Housing Dashboard Overview. The county has planned ${summaryStats.totalPlannedUnits.toLocaleString()} housing units, with ${summaryStats.permitedUnits.toLocaleString()} permits issued to date. ${summaryStats.completedUnits.toLocaleString()} units have been completed, including ${summaryStats.affordableUnits.toLocaleString()} affordable units. The majority of housing (${Math.round(incomeDistribution[3].value)}%) is designated for above-moderate income households.`,
      
      'progress': `You're viewing the Housing Development Progress for San Mateo County. This chart shows the progress across different income categories. Very Low Income housing has completed ${progressChart[0].completed} units, Low Income has completed ${progressChart[1].completed} units, Moderate Income has completed ${progressChart[2].completed} units, and Above Moderate has completed ${progressChart[3].completed} units. There are ${progressChart[3].planned} Above Moderate units planned for development, which is the largest category.`,
      
      'map': `You're viewing the Housing Projects Map for San Mateo County.

This map provides a detailed overview of the local housing projects currently underway, completed, and planned. Here are the main insights from the data:

**Total Housing Units:**
- The total number of planned housing units across all projects is 2,648.
- Of these, 875 units have been permitted, and 325 units have been completed.
- Among the completed units, 142 are designated as affordable housing units.

**Income Distribution:**
- Very Low Income: 13% of the units are aimed at this group.
- Low Income: 9% of the units are targeted towards this demographic.
- Moderate Income: 7% of the units cater to this income group.
- Above Moderate: A significant majority, 72% of the units, are designated for above-moderate income households.`,
      
      'income': `You're viewing the Income Level Distribution for San Mateo County housing. The chart shows that ${Math.round(incomeDistribution[3].value)}% of housing is for Above Moderate income, ${Math.round(incomeDistribution[0].value)}% for Very Low income, ${Math.round(incomeDistribution[1].value)}% for Low income, and ${Math.round(incomeDistribution[2].value)}% for Moderate income levels.`
    };
    
    const baseSummary = summaries[view as keyof typeof summaries] || 
      `You're viewing the San Mateo County Housing Dashboard. This dashboard shows housing data including ${summaryStats.totalPlannedUnits.toLocaleString()} planned units and ${summaryStats.completedUnits.toLocaleString()} completed units across the county.`;
    
    // For the map view, we already have a formatted list, so don't add duplicates
    if (view === 'map') {
      return baseSummary;
    }
    
    // For other views, extract and append numerical data as bullet points
    const numberBulletPoints = extractAndFormatNumericalData(baseSummary);
    return baseSummary + numberBulletPoints;
  };
  
  // Translate summary when language changes or summary updates
  useEffect(() => {
    const translateSummary = async () => {
      // If mouse is over the component, don't update translations to prevent flicker
      if (isMouseOver) return;
      
      // Use the ref value to ensure we're always working with the most current summary
      const currentSummary = summaryRef.current;
      
      if (!currentSummary || currentSummary.trim() === '') return;
      
      // Only translate when not English
      if (language !== 'en') {
        try {
          const translated = await translateText(currentSummary, language as 'es' | 'zh');
          setTranslatedSummary(translated);
        } catch (error) {
          console.error('Translation error:', error);
          setTranslatedSummary('');
        }
      } else {
        setTranslatedSummary('');
      }
    };
    
    translateSummary();
  }, [summary, language, isMouseOver]);

  // Generate summary when the dashboard data or view changes
  useEffect(() => {
    if (!isMinimized) {
      generateSummary();
    }
  }, [dashboardData, currentView, isMinimized]);

  // Auto-scroll to bottom when summary updates
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [summary, translatedSummary]);

  // Keep summaryRef in sync with state
  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  // Update the memoized display text to use debounced values
  const displayTextValue = useMemo(() => {
    // Make sure to stabilize the text while mouse is over
    if (isMouseOver) {
      // Return the last stable value
      return language !== 'en' && debouncedTranslatedSummary
        ? debouncedTranslatedSummary
        : debouncedSummary;
    }
    
    // Normal operation when not hovering
    return language !== 'en' && translatedSummary 
      ? translatedSummary 
      : summary;
  }, [language, translatedSummary, summary, debouncedTranslatedSummary, debouncedSummary, isMouseOver]);
    
  const t = uiTranslations[language];

  // Update the renderFormattedSummary function to use the memoized component
  const renderFormattedSummary = () => {
    return (
      <SummaryWrapper>
        <MemorizedSummaryContent 
          content={displayTextValue} 
          analyzingText={t.analyzingData} 
        />
      </SummaryWrapper>
    );
  };

  // Update the mouse event handlers to use the freeze mechanism
  const handleMouseEnter = () => {
    setIsMouseOver(true);
    freezeUpdates.current = true;
  };

  const handleMouseLeave = () => {
    setIsMouseOver(false);
    // Allow a delay before re-enabling updates to ensure stability
    setTimeout(() => {
      freezeUpdates.current = false;
    }, 300);
  };

  return (
    <AssistantContainer className={isMinimized ? 'minimized' : ''}>
      <AssistantHeader onClick={toggleMinimize}>
        <HeaderTitle>
          <StatusIndicator isGenerating={isGenerating} />
          {!isMinimized && t.aiAssistantTitle}
        </HeaderTitle>
        {!isMinimized && (
          <MinimizeButton onClick={(e) => {
            e.stopPropagation();
            toggleMinimize();
          }}>
            −
          </MinimizeButton>
        )}
      </AssistantHeader>
      
      {!isMinimized && (
        <AssistantContent 
          ref={contentRef} 
          className="ai-content"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={(e) => {
            // Prevent event propagation and ensure freeze is active
            e.stopPropagation();
            freezeUpdates.current = true;
          }}
        >
          <SummaryText>
            {renderFormattedSummary()}
          </SummaryText>
          
          {source && !isGenerating && (
            <SourceIndicator source={source}>
              {source === 'openai' ? t.poweredByOpenAI : t.localAI}
              {hasError && ' (Recovered from error)'}
            </SourceIndicator>
          )}
          
          <LanguageControls>
            <LanguageToggle compact={false} />
            
            {!isGenerating && (
              <RefreshButton 
                onClick={(e) => {
                  e.stopPropagation();
                  generateSummary();
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
                {t.refreshAnalysis}
              </RefreshButton>
            )}
          </LanguageControls>
        </AssistantContent>
      )}
    </AssistantContainer>
  );
};

export default AIAssistant; 