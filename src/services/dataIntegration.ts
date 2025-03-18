import { DashboardData } from '@/models/InternalHCDData';
import { getMockDashboardData } from '@/lib/mockData';
import { DataFreshness } from '@/lib/scrapers/types';

/**
 * Configuration for the data integration service
 */
export interface DataIntegrationConfig {
  /** Whether to use Puppeteer MCP instead of Browser Tools MCP */
  usePuppeteerMCP?: boolean;
}

/**
 * Combines data from different sources to create summary statistics
 */
export function combineSummaryStats(
  hcdData: any, 
  rhnaData: any
): DashboardData['summaryStats'] {
  // Calculate totals from HCD data
  let totalPermitedUnits = 0;
  let totalCompletedUnits = 0;
  let totalAffordableUnits = 0;
  
  if (hcdData?.jurisdictions) {
    hcdData.jurisdictions.forEach((jurisdiction: any) => {
      // Sum permits across income categories
      const permitValues = Object.values(jurisdiction.permitData || {});
      totalPermitedUnits += permitValues.reduce(
        (a: number, b: unknown) => a + Number(b || 0), 
        0
      );
      
      // Sum completions across income categories
      const completionValues = Object.values(jurisdiction.completionData || {});
      totalCompletedUnits += completionValues.reduce(
        (a: number, b: unknown) => a + Number(b || 0),
        0
      );
      
      // Sum affordable units (very low, low, moderate income)
      totalAffordableUnits += 
        Number(jurisdiction.completionData?.veryLowIncome || 0) + 
        Number(jurisdiction.completionData?.lowIncome || 0) + 
        Number(jurisdiction.completionData?.moderateIncome || 0);
    });
  }
  
  // Use RHNA data for total planned, or fall back to our mock data
  const totalPlannedUnits = rhnaData?.countyTotal?.allocation || 47425; // San Mateo County's RHNA allocation
  
  return {
    totalPlannedUnits,
    permitedUnits: totalPermitedUnits,
    completedUnits: totalCompletedUnits,
    affordableUnits: totalAffordableUnits
  };
}

/**
 * Combines housing project data from various sources
 */
export function combineHousingProjects(
  housingProjects: any[]
): DashboardData['housingProjects'] {
  if (!housingProjects || !Array.isArray(housingProjects)) {
    return [];
  }
  
  // Map projects to our standard format
  return housingProjects.map(project => ({
    id: project.id || crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15),
    name: project.name,
    address: project.address,
    city: project.city,
    units: project.units,
    affordabilityLevel: project.affordabilityLevel,
    status: project.status,
    latitude: project.latitude,
    longitude: project.longitude
  }));
}

/**
 * Creates income distribution data for pie chart
 */
export function createIncomeDistribution(
  hcdData: any
): DashboardData['incomeDistribution'] {
  // Calculate total units across all jurisdictions and income levels
  let totalUnits = 0;
  let veryLowIncomeUnits = 0;
  let lowIncomeUnits = 0;
  let moderateIncomeUnits = 0;
  let aboveModerateUnits = 0;
  
  if (hcdData?.jurisdictions) {
    hcdData.jurisdictions.forEach((jurisdiction: any) => {
      veryLowIncomeUnits += Number(jurisdiction.completionData?.veryLowIncome || 0);
      lowIncomeUnits += Number(jurisdiction.completionData?.lowIncome || 0);
      moderateIncomeUnits += Number(jurisdiction.completionData?.moderateIncome || 0);
      aboveModerateUnits += Number(jurisdiction.completionData?.aboveModerateIncome || 0);
    });
  }
  
  totalUnits = veryLowIncomeUnits + lowIncomeUnits + moderateIncomeUnits + aboveModerateUnits;
  
  // Convert to percentages
  const veryLowPct = totalUnits > 0 ? (veryLowIncomeUnits / totalUnits) * 100 : 0;
  const lowPct = totalUnits > 0 ? (lowIncomeUnits / totalUnits) * 100 : 0;
  const moderatePct = totalUnits > 0 ? (moderateIncomeUnits / totalUnits) * 100 : 0;
  const aboveModPct = totalUnits > 0 ? (aboveModerateUnits / totalUnits) * 100 : 0;
  
  return [
    {
      category: 'Very Low Income',
      value: veryLowPct,
      color: '#dc3545'
    },
    {
      category: 'Low Income',
      value: lowPct,
      color: '#fd7e14'
    },
    {
      category: 'Moderate Income',
      value: moderatePct,
      color: '#ffc107'
    },
    {
      category: 'Above Moderate',
      value: aboveModPct,
      color: '#28a745'
    }
  ];
}

/**
 * Generates progress chart data for stacked column chart
 */
export function generateProgressChart(
  hcdData: any,
  rhnaData: any
): DashboardData['progressChart'] {
  // Define income categories
  const categories = ['Very Low Income', 'Low Income', 'Moderate Income', 'Above Moderate'];
  
  // Initialize result array
  const result = categories.map(category => ({
    category,
    completed: 0,
    underConstruction: 0,
    permitted: 0,
    planned: 0
  }));
  
  // Map our internal category names to array indices
  const categoryMap = {
    'veryLowIncome': 0,
    'lowIncome': 1,
    'moderateIncome': 2,
    'aboveModerateIncome': 3
  };
  
  // Aggregate completed units from all jurisdictions
  if (hcdData?.jurisdictions) {
    hcdData.jurisdictions.forEach((jurisdiction: any) => {
      // Add completed units
      result[categoryMap.veryLowIncome].completed += Number(jurisdiction.completionData?.veryLowIncome || 0);
      result[categoryMap.lowIncome].completed += Number(jurisdiction.completionData?.lowIncome || 0);
      result[categoryMap.moderateIncome].completed += Number(jurisdiction.completionData?.moderateIncome || 0);
      result[categoryMap.aboveModerateIncome].completed += Number(jurisdiction.completionData?.aboveModerateIncome || 0);
      
      // Add permitted units
      result[categoryMap.veryLowIncome].permitted += Number(jurisdiction.permitData?.veryLowIncome || 0);
      result[categoryMap.lowIncome].permitted += Number(jurisdiction.permitData?.lowIncome || 0);
      result[categoryMap.moderateIncome].permitted += Number(jurisdiction.permitData?.moderateIncome || 0);
      result[categoryMap.aboveModerateIncome].permitted += Number(jurisdiction.permitData?.aboveModerateIncome || 0);
    });
  }
  
  // Calculate under construction units (approximation)
  result[categoryMap.veryLowIncome].underConstruction = Math.floor(result[categoryMap.veryLowIncome].permitted * 0.6);
  result[categoryMap.lowIncome].underConstruction = Math.floor(result[categoryMap.lowIncome].permitted * 0.6);
  result[categoryMap.moderateIncome].underConstruction = Math.floor(result[categoryMap.moderateIncome].permitted * 0.6);
  result[categoryMap.aboveModerateIncome].underConstruction = Math.floor(result[categoryMap.aboveModerateIncome].permitted * 0.6);
  
  // Add planned units from RHNA data
  if (rhnaData?.jurisdictions) {
    let veryLowPlanned = 0;
    let lowPlanned = 0;
    let moderatePlanned = 0;
    let aboveModPlanned = 0;
    
    rhnaData.jurisdictions.forEach((jurisdiction: any) => {
      veryLowPlanned += Number(jurisdiction.rhnaAllocations?.veryLowIncome || 0);
      lowPlanned += Number(jurisdiction.rhnaAllocations?.lowIncome || 0);
      moderatePlanned += Number(jurisdiction.rhnaAllocations?.moderateIncome || 0);
      aboveModPlanned += Number(jurisdiction.rhnaAllocations?.aboveModerateIncome || 0);
    });
    
    result[categoryMap.veryLowIncome].planned = veryLowPlanned;
    result[categoryMap.lowIncome].planned = lowPlanned;
    result[categoryMap.moderateIncome].planned = moderatePlanned;
    result[categoryMap.aboveModerateIncome].planned = aboveModPlanned;
  } else {
    // Fall back to mock data if no RHNA data is available
    result[categoryMap.veryLowIncome].planned = 150;
    result[categoryMap.lowIncome].planned = 120;
    result[categoryMap.moderateIncome].planned = 100;
    result[categoryMap.aboveModerateIncome].planned = 1100;
  }
  
  return result;
}

/**
 * Fetch data from server-side API endpoint
 */
async function fetchFromApi(
  source: string, 
  freshness: DataFreshness,
  usePuppeteerMCP: boolean = false
): Promise<any> {
  try {
    const response = await fetch('/api/scrape-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source,
        freshness,
        usePuppeteerMCP
      }),
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'API returned error');
    }
    
    return result.data;
  } catch (error) {
    console.error(`Error fetching ${source} from API:`, error);
    return null;
  }
}

/**
 * Main function to collect all dashboard data from various sources
 */
export async function getDashboardData(
  freshness: DataFreshness = DataFreshness.USE_CACHE_IF_AVAILABLE,
  config: DataIntegrationConfig = {}
): Promise<DashboardData> {
  try {
    // For development/testing, check if we should use mock data
    if (process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      return getMockDashboardData();
    }
    
    const usePuppeteerMCP = config.usePuppeteerMCP || false;
    
    // Get data from API endpoints (which run scrapers server-side)
    console.log(`Fetching data for dashboard (using ${usePuppeteerMCP ? 'Puppeteer MCP' : 'Browser Tools MCP'})...`);
    
    // Get housing projects from San Mateo Housing Portal
    const housingPortalData = await fetchFromApi('san_mateo_housing_portal', freshness, usePuppeteerMCP);
    
    // Get HCD Annual Progress Report data
    const hcdReportData = await fetchFromApi('california_hcd_apr', freshness, usePuppeteerMCP);
    
    // Get RHNA data
    const rhnaData = await fetchFromApi('rhna_allocation', freshness, usePuppeteerMCP);
    
    console.log('Data fetched successfully');
    
    // Transform and combine data
    return {
      summaryStats: combineSummaryStats(hcdReportData, rhnaData),
      housingProjects: combineHousingProjects(housingPortalData?.housingProjects || []),
      incomeDistribution: createIncomeDistribution(hcdReportData),
      progressChart: generateProgressChart(hcdReportData, rhnaData)
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Fallback to mock data in case of errors
    return getMockDashboardData();
  }
}

/**
 * Trigger a refresh of all data
 */
export async function refreshAllData(usePuppeteerMCP: boolean = false): Promise<void> {
  console.log(`Refreshing all data (using ${usePuppeteerMCP ? 'Puppeteer MCP' : 'Browser Tools MCP'})...`);
  
  try {
    await fetchFromApi('all', DataFreshness.ALWAYS_FRESH, usePuppeteerMCP);
    console.log('All data refreshed');
  } catch (error) {
    console.error('Error refreshing data:', error);
    throw error;
  }
} 