import { AbstractScraper } from './baseScraper';
import { FileType } from './types';
import { IncomeCategories } from '@/models/InternalHCDData';
import { scrapeWebpage } from '@/lib/browserTools';
import { scrapePuppeteer } from '@/lib/puppeteerClient';

/**
 * Data structure for HCD Annual Progress Report data
 */
export interface HCDReportData {
  jurisdictions: {
    name: string;
    permitData: IncomeCategories;
    completionData: IncomeCategories;
  }[];
  countyTotals: {
    permitsIssued: number;
    unitsCompleted: number;
    affordableUnits: number;
    adus: number;
  };
  reportYear: number;
  lastUpdated: string;
}

/**
 * Scraper for California HCD Annual Progress Reports website
 * Can use either Browser Tools MCP or Puppeteer MCP for headless browsing
 */
export class HCDReportScraper extends AbstractScraper<HCDReportData> {
  private usePuppeteerMCP: boolean;
  
  constructor(usePuppeteerMCP = false) {
    super(
      'california_hcd_apr',
      'https://www.hcd.ca.gov/planning-and-community-development/annual-progress-reports',
      FileType.HTML
    );
    
    this.usePuppeteerMCP = usePuppeteerMCP;
  }
  
  /**
   * Fetch data from HCD website using either Browser Tools MCP or Puppeteer MCP
   */
  async fetchData(): Promise<string> {
    // Check if we're running on the server
    if (typeof window !== 'undefined') {
      // We're in the browser, return mock data instead
      console.log('Running in browser, returning mock HTML');
      return '<html><body><div class="mock-data">Mock HCD data for browser environment</div></body></html>';
    }
    
    try {
      if (this.usePuppeteerMCP) {
        // Use the Puppeteer MCP
        console.log('Using Puppeteer MCP for scraping');
        const result = await scrapePuppeteer({
          url: this.sourceUrl,
          waitForSelector: '.main-content',
          waitForNetworkIdle: true,
          timeout: 60000,
          // Additional Puppeteer-specific options
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        });
        
        if (!result.success || !result.html) {
          throw new Error(result.error || 'Failed to scrape HCD website with Puppeteer MCP');
        }
        
        return result.html;
      } else {
        // Use the Browser Tools MCP
        console.log('Using Browser Tools MCP for scraping');
        const result = await scrapeWebpage({
          url: this.sourceUrl,
          waitForSelector: '.main-content',
          waitForNetworkIdle: true,
          timeout: 60000
        });
        
        if (!result.success || !result.html) {
          throw new Error(result.error || 'Failed to scrape HCD website with Browser Tools MCP');
        }
        
        return result.html;
      }
    } catch (error) {
      console.error('Error scraping HCD website:', error);
      // Return a simple HTML string as fallback
      return '<html><body><div class="error">Failed to fetch data</div></body></html>';
    }
  }
  
  /**
   * Process data from HCD website
   */
  async process(html: string): Promise<HCDReportData> {
    // Note: The implementation details would depend on the actual structure 
    // of the HCD website. This is a simplified mock implementation.
    
    // For now, we'll return mock data to demonstrate the pattern
    const reportYear = new Date().getFullYear() - 1; // Last year's report
    
    const jurisdictions = [
      {
        name: 'San Mateo',
        permitData: {
          veryLowIncome: 45,
          lowIncome: 82,
          moderateIncome: 75,
          aboveModerateIncome: 310
        },
        completionData: {
          veryLowIncome: 22,
          lowIncome: 48,
          moderateIncome: 36,
          aboveModerateIncome: 189
        }
      },
      {
        name: 'Redwood City',
        permitData: {
          veryLowIncome: 52,
          lowIncome: 78,
          moderateIncome: 63,
          aboveModerateIncome: 280
        },
        completionData: {
          veryLowIncome: 28,
          lowIncome: 41,
          moderateIncome: 29,
          aboveModerateIncome: 162
        }
      },
      {
        name: 'South San Francisco',
        permitData: {
          veryLowIncome: 38,
          lowIncome: 65,
          moderateIncome: 58,
          aboveModerateIncome: 243
        },
        completionData: {
          veryLowIncome: 19,
          lowIncome: 32,
          moderateIncome: 28,
          aboveModerateIncome: 142
        }
      }
    ];
    
    // Calculate totals
    const totalPermits = jurisdictions.reduce((sum, jurisdiction) => {
      return sum + Object.values(jurisdiction.permitData).reduce((a, b) => a + b, 0);
    }, 0);
    
    const totalCompleted = jurisdictions.reduce((sum, jurisdiction) => {
      return sum + Object.values(jurisdiction.completionData).reduce((a, b) => a + b, 0);
    }, 0);
    
    const totalAffordable = jurisdictions.reduce((sum, jurisdiction) => {
      return sum + 
        jurisdiction.completionData.veryLowIncome + 
        jurisdiction.completionData.lowIncome + 
        jurisdiction.completionData.moderateIncome;
    }, 0);
    
    // In a real implementation, we would extract this from the HTML data
    return {
      jurisdictions,
      countyTotals: {
        permitsIssued: totalPermits,
        unitsCompleted: totalCompleted,
        affordableUnits: totalAffordable,
        adus: 183 // This would be extracted from the page
      },
      reportYear,
      lastUpdated: new Date().toISOString()
    };
  }
} 