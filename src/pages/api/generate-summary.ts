import type { NextApiRequest, NextApiResponse } from 'next';
import { DashboardData, HousingProject } from '@/models/InternalHCDData';
import { generateDashboardSummary } from '@/lib/openai';
import { rateLimitMiddleware } from '@/lib/security/rateLimit';

type RequestData = {
  dashboardData: DashboardData;
  currentView: string;
};

type ResponseData = {
  success: boolean;
  summary: string;
  source?: 'openai' | 'fallback';
  error?: string;
};

// Cache for previously generated summaries to ensure stability
const summaryCache = new Map<string, { summary: string, source: 'openai' | 'fallback', timestamp: number }>();

/**
 * Check if text appears to be gibberish using simple heuristics
 */
function isGibberish(text: string): boolean {
  try {
    // Empty or very short text
    if (!text || text.length < 20) return true;
    
    const words = text.split(/\s+/);
    
    // Text with very few words
    if (words.length < 5) return true;
    
    // Count suspicious patterns
    let gibberishCount = 0;
    for (const word of words) {
      if (
        (/[^\w\s.,;:!?'"-]/.test(word) && word.length > 3) || // Unusual characters
        /(.)\1{3,}/.test(word) || // Repeated characters (more than 3 times)
        (word.length > 15) || // Extremely long words
        (/[A-Z]{4,}/.test(word) && !/^[A-Z]+$/.test(word)) // Random capitalization
      ) {
        gibberishCount++;
      }
    }
    
    // Calculate percentage of suspicious words
    const gibberishRatio = gibberishCount / words.length;
    
    // More than 15% suspicious words is likely gibberish
    return gibberishRatio > 0.15;
  } catch (error) {
    console.error('Error in gibberish detection:', error);
    return true; // If we can't check properly, assume it's gibberish to be safe
  }
}

/**
 * Create a cache key for the dashboard data and view
 */
function createCacheKey(dashboardData: DashboardData, view: string): string {
  // Extract key data points that would affect the summary
  const { summaryStats } = dashboardData;
  const cacheKey = `${view}_${summaryStats.totalPlannedUnits}_${summaryStats.completedUnits}_${summaryStats.permitedUnits}_${summaryStats.affordableUnits}`;
  return cacheKey;
}

/**
 * Sanitize API response to avoid any problematic content
 */
function sanitizeResponse(text: string): string {
  // Remove any HTML tags that might have been included
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Anonymize housing project data to remove potential PII
 * @param projects The housing projects to anonymize
 * @returns Anonymized housing project data
 */
function anonymizeHousingProjects(projects: HousingProject[]): HousingProject[] {
  return projects.map(project => {
    // Create a copy of the project
    const anonymized = { ...project };
    
    // Replace exact address with general area
    if (anonymized.address) {
      const addressParts = anonymized.address.split(' ');
      if (addressParts.length > 2) {
        // Replace street number with a range
        addressParts[0] = 'Block';
        // Keep street name and city
        anonymized.address = addressParts.join(' ');
      }
    }
    
    // Replace specific project names with generic identifiers
    if (anonymized.name) {
      anonymized.name = `Housing Project ${anonymized.id || Math.floor(Math.random() * 1000)}`;
    }
    
    // Slightly fuzz the exact coordinates for privacy (if they exist)
    if (anonymized.latitude && anonymized.longitude) {
      // Add a small random offset (up to ~100 meters)
      const fuzzFactor = 0.001; // roughly 100 meters
      anonymized.latitude += (Math.random() - 0.5) * fuzzFactor;
      anonymized.longitude += (Math.random() - 0.5) * fuzzFactor;
    }
    
    return anonymized;
  });
}

/**
 * Remove sensitive data from the dashboard data before sending to OpenAI
 * @param dashboardData The original dashboard data
 * @returns Sanitized dashboard data safe for external processing
 */
function sanitizeDashboardData(dashboardData: DashboardData): DashboardData {
  const sanitized = { ...dashboardData };
  
  // Anonymize housing projects data
  if (sanitized.housingProjects && sanitized.housingProjects.length > 0) {
    sanitized.housingProjects = anonymizeHousingProjects(sanitized.housingProjects);
  }
  
  // Only include aggregated data for geographic distribution
  if (sanitized.geographicData) {
    // Keep the aggregate data but remove any fields that could be identifying
    Object.keys(sanitized.geographicData).forEach(city => {
      sanitized.geographicData![city] = {
        total: sanitized.geographicData![city].total,
        affordable: sanitized.geographicData![city].affordable
      };
    });
  }
  
  return sanitized;
}

/**
 * API handler for generating AI summaries of dashboard data
 * This integrates with OpenAI to provide intelligent, contextual summaries
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Apply rate limiting to prevent abuse
  const canProceed = rateLimitMiddleware(req, res, {
    limit: 20,  // Allow more requests for summary generation
    windowMs: 2 * 60 * 1000 // 2 minutes window
  });
  
  if (!canProceed) {
    // Rate limit middleware has already sent the 429 response
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      summary: 'Method not allowed'
    });
  }

  try {
    const { dashboardData, currentView } = req.body as RequestData;
    
    if (!dashboardData) {
      return res.status(400).json({
        success: false,
        summary: 'Dashboard data is required'
      });
    }
    
    // Create a cache key for this specific request
    const cacheKey = createCacheKey(dashboardData, currentView);
    
    // Check if we have a cached response that's less than 5 minutes old
    const cachedResponse = summaryCache.get(cacheKey);
    const cacheExpiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    if (cachedResponse && (Date.now() - cachedResponse.timestamp) < cacheExpiryTime) {
      console.log('Returning cached summary for', currentView);
      return res.status(200).json({
        success: true,
        summary: cachedResponse.summary,
        source: cachedResponse.source
      });
    }
    
    try {
      // Sanitize the dashboard data to remove PII before sending to OpenAI
      const sanitizedData = sanitizeDashboardData(dashboardData);
      
      // Use OpenAI API to generate summary with sanitized data
      const aiSummary = await generateDashboardSummary(sanitizedData, currentView);
      
      // Sanitize the response
      const sanitizedSummary = sanitizeResponse(aiSummary);
      
      // Verify the response isn't gibberish
      if (isGibberish(sanitizedSummary)) {
        console.warn('OpenAI returned gibberish, using fallback summary');
        
        // Use fallback summary
        const fallbackSummary = await generateFallbackSummary(dashboardData, currentView);
        
        // Cache the fallback response
        summaryCache.set(cacheKey, {
          summary: fallbackSummary,
          source: 'fallback',
          timestamp: Date.now()
        });
        
        return res.status(200).json({
          success: true,
          summary: fallbackSummary,
          source: 'fallback'
        });
      }
      
      // Cache the successful OpenAI response
      summaryCache.set(cacheKey, {
        summary: sanitizedSummary,
        source: 'openai',
        timestamp: Date.now()
      });
      
      return res.status(200).json({
        success: true,
        summary: sanitizedSummary,
        source: 'openai'
      });
    } catch (error) {
      console.error('OpenAI API error, falling back to generated summaries:', error);
      
      // Fallback to pre-generated summaries if OpenAI API fails
      const fallbackSummary = await generateFallbackSummary(dashboardData, currentView);
      
      // Cache the fallback response
      summaryCache.set(cacheKey, {
        summary: fallbackSummary,
        source: 'fallback',
        timestamp: Date.now()
      });
      
      return res.status(200).json({
        success: true,
        summary: fallbackSummary,
        source: 'fallback'
      });
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    
    return res.status(500).json({
      success: false,
      summary: 'Failed to generate summary',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Generate a fallback summary if OpenAI API fails
 * This provides the same functionality as before as a backup
 */
async function generateFallbackSummary(
  data: DashboardData, 
  view: string
): Promise<string> {
  const { summaryStats, incomeDistribution, progressChart, housingProjects } = data;
  
  // A shorter delay - users want fast responses even for fallbacks
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Generate detailed summaries based on the view
  switch (view) {
    case 'overview':
      return `You're viewing the San Mateo County Housing Dashboard Overview. 
              
This dashboard provides a comprehensive view of housing development in San Mateo County.

Key metrics:
• Total Planned Units: ${summaryStats.totalPlannedUnits.toLocaleString()}
• Permits Issued: ${summaryStats.permitedUnits.toLocaleString()}
• Units Completed: ${summaryStats.completedUnits.toLocaleString()}
• Affordable Units: ${summaryStats.affordableUnits.toLocaleString()}

The county has allocated most housing (${Math.round(incomeDistribution[3].value)}%) for above-moderate income households, with ${Math.round(incomeDistribution[0].value)}% for very low income, ${Math.round(incomeDistribution[1].value)}% for low income, and ${Math.round(incomeDistribution[2].value)}% for moderate income households.

The housing development progress chart shows construction status across all income categories, and the map displays the geographical distribution of housing projects throughout the county.`;
      
    case 'progress':
      const totalCompleted = progressChart.reduce((sum, cat) => sum + cat.completed, 0);
      const totalPlanned = progressChart.reduce((sum, cat) => sum + cat.planned, 0);
      const completionRate = totalPlanned > 0 ? ((totalCompleted / totalPlanned) * 100).toFixed(1) : '0';
      
      return `You're viewing the Housing Development Progress Chart for San Mateo County.
              
This stacked column chart visualizes the housing progress across different income categories.

Progress by income category:
• Very Low Income: ${progressChart[0].completed} completed, ${progressChart[0].underConstruction} under construction, ${progressChart[0].permitted} permitted, ${progressChart[0].planned} planned
• Low Income: ${progressChart[1].completed} completed, ${progressChart[1].underConstruction} under construction, ${progressChart[1].permitted} permitted, ${progressChart[1].planned} planned
• Moderate Income: ${progressChart[2].completed} completed, ${progressChart[2].underConstruction} under construction, ${progressChart[2].permitted} permitted, ${progressChart[2].planned} planned
• Above Moderate: ${progressChart[3].completed} completed, ${progressChart[3].underConstruction} under construction, ${progressChart[3].permitted} permitted, ${progressChart[3].planned} planned

Overall, the county has completed ${totalCompleted} units out of ${totalPlanned} planned units, representing ${completionRate}% of its housing goal. Above Moderate income housing shows the most progress, while Very Low Income housing shows the least progress proportionally.`;
      
    case 'map':
      return `You're viewing the Housing Projects Map for San Mateo County.

This map provides a detailed overview of the local housing projects currently underway, completed, and planned. Here are the main insights from the data:

**Total Housing Units:**
- The total number of planned housing units across all projects is 2,648.
- Of these, 875 units have been permitted, and 325 units have been completed.
- Among the completed units, 142 are designated as affordable housing units.

**Income Distribution:**
- Very Low Income: 13% of the units are aimed at this group.
- Low Income: 9% of the units are targeted towards this demographic.
- Moderate Income: 7% of the units cater to this income group.
- Above Moderate: A significant majority, 72% of the units, are designated for above-moderate income households.`;
      
    case 'income':
      return `You're viewing the Income Level Distribution Chart for San Mateo County.
              
This pie chart illustrates how housing units are distributed across different income categories in San Mateo County.

Distribution by income level:
• Above Moderate Income: ${Math.round(incomeDistribution[3].value)}%
• Moderate Income: ${Math.round(incomeDistribution[2].value)}%
• Low Income: ${Math.round(incomeDistribution[1].value)}%
• Very Low Income: ${Math.round(incomeDistribution[0].value)}%

The chart clearly shows that the majority of housing in San Mateo County is allocated for Above Moderate income households. This reflects broader housing affordability challenges in the Bay Area, where the supply of affordable housing for lower-income residents is limited.

San Mateo County's housing plan aims to address this imbalance through the development of more affordable units, but the current distribution highlights the need for continued focus on increasing housing options for Very Low, Low, and Moderate income households.`;
      
    default:
      return `You're viewing the San Mateo County Housing Element Dashboard.
              
This dashboard presents comprehensive data on housing development in San Mateo County. It provides insights into housing production, affordability, and geographic distribution throughout the county.

Key metrics:
• ${summaryStats.totalPlannedUnits.toLocaleString()} planned housing units
• ${summaryStats.permitedUnits.toLocaleString()} permits issued
• ${summaryStats.completedUnits.toLocaleString()} units completed
• ${summaryStats.affordableUnits.toLocaleString()} affordable units

The dashboard includes visualizations showing housing progress by income category, geographic distribution of projects, and the breakdown of housing by affordability level.

You can explore the different sections to get detailed information about specific aspects of housing development in San Mateo County.`;
  }
} 