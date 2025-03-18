import type { NextApiRequest, NextApiResponse } from 'next';
import { WebScraperManager } from '@/lib/scrapers/scraperManager';
import { DataFreshness } from '@/lib/scrapers/types';

type ResponseData = {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * API handler for scraping data server-side
 * This avoids 'fs' and other Node-only modules from running in the browser
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    // Get the source name, freshness, and MCP selection from request
    const { source, freshness, usePuppeteerMCP = false } = req.body;
    
    if (!source) {
      return res.status(400).json({
        success: false,
        message: 'Source name is required'
      });
    }
    
    // Parse freshness option
    const freshnessOption = freshness ? 
      freshness as DataFreshness : 
      DataFreshness.USE_CACHE_IF_AVAILABLE;
    
    // Create scraper manager with the specified MCP
    const scraperManager = new WebScraperManager({ usePuppeteerMCP });
    
    // Run the appropriate scraper based on source name
    if (source === 'all') {
      // Run all scrapers
      await scraperManager.runAllScrapers();
      
      return res.status(200).json({
        success: true,
        message: 'All data sources scraped successfully'
      });
    } else {
      // Run specific scraper and get the data
      await scraperManager.runScraper(source);
      
      let data;
      
      // Get data based on source name
      switch (source) {
        case 'san_mateo_housing_portal':
          data = await scraperManager.getHousingProjectData(freshnessOption);
          break;
        case 'california_hcd_apr':
          data = await scraperManager.getHCDReportData(freshnessOption);
          break;
        case 'rhna_allocation':
          data = await scraperManager.getRHNAData(freshnessOption);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Unknown source: ${source}`
          });
      }
      
      return res.status(200).json({
        success: true,
        message: `Data from ${source} scraped successfully${usePuppeteerMCP ? ' using Puppeteer MCP' : ''}`,
        data
      });
    }
  } catch (error) {
    console.error('Error in scrape-data API:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to scrape data',
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 