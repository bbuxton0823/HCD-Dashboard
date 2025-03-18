import { ScraperManager, DataFreshness, ScrapingResult } from './types';
import { getScrapedData } from '../storage/storageManager';
import { SanMateoHousingPortalScraper, SanMateoHousingData } from './sanMateoHousingPortalScraper';
import { HCDReportScraper, HCDReportData } from './hcdReportScraper';
import { RHNADataScraper, RHNAData } from './rhnaDataScraper';

/**
 * Configuration for the web scraper manager
 */
export interface ScraperManagerConfig {
  /** Whether to use Puppeteer MCP instead of Browser Tools MCP for complex scrapers */
  usePuppeteerMCP?: boolean;
}

/**
 * Manager for all web scrapers
 */
export class WebScraperManager implements ScraperManager {
  private usePuppeteerMCP: boolean;

  constructor(config: ScraperManagerConfig = {}) {
    this.usePuppeteerMCP = config.usePuppeteerMCP ?? false;
    console.log(`WebScraperManager initialized with usePuppeteerMCP=${this.usePuppeteerMCP}`);
  }

  // Lazy-initialize scrapers to use correct MCP based on configuration
  private get scrapers() {
    return {
      san_mateo_housing_portal: new SanMateoHousingPortalScraper(),
      california_hcd_apr: new HCDReportScraper(this.usePuppeteerMCP), // Use Puppeteer MCP if configured
      rhna_allocation: new RHNADataScraper()
    };
  }
  
  /**
   * Run all scrapers
   */
  async runAllScrapers(): Promise<void> {
    console.log('Running all scrapers...');
    
    // Run scrapers in parallel
    const promises = Object.keys(this.scrapers).map(name => this.runScraper(name));
    
    await Promise.all(promises);
    
    console.log('All scrapers completed');
  }
  
  /**
   * Run a specific scraper by name
   */
  async runScraper(scraperName: string): Promise<void> {
    const scraper = this.scrapers[scraperName as keyof typeof this.scrapers];
    
    if (!scraper) {
      throw new Error(`Scraper "${scraperName}" not found`);
    }
    
    console.log(`Running scraper: ${scraperName}`);
    
    try {
      await scraper.scrape();
      console.log(`Scraper ${scraperName} completed successfully`);
    } catch (error) {
      console.error(`Scraper ${scraperName} failed:`, error);
    }
  }
  
  /**
   * Get housing project data
   */
  async getHousingProjectData(freshness: DataFreshness = DataFreshness.USE_CACHE_IF_AVAILABLE): Promise<SanMateoHousingData | null> {
    return await this.getData<SanMateoHousingData>('san_mateo_housing_portal', freshness);
  }
  
  /**
   * Get HCD report data
   */
  async getHCDReportData(freshness: DataFreshness = DataFreshness.USE_CACHE_IF_AVAILABLE): Promise<HCDReportData | null> {
    return await this.getData<HCDReportData>('california_hcd_apr', freshness);
  }
  
  /**
   * Get RHNA allocation data
   */
  async getRHNAData(freshness: DataFreshness = DataFreshness.USE_CACHE_IF_AVAILABLE): Promise<RHNAData | null> {
    return await this.getData<RHNAData>('rhna_allocation', freshness);
  }
  
  /**
   * Get data for a specific source
   */
  async getData<T>(sourceName: string, freshness: DataFreshness = DataFreshness.USE_CACHE_IF_AVAILABLE): Promise<T | null> {
    // Check if we need fresh data
    if (freshness === DataFreshness.ALWAYS_FRESH) {
      // Run the scraper to get fresh data
      await this.runScraper(sourceName);
    }
    
    // Get data from storage
    const result = await getScrapedData<T>(sourceName, freshness);
    
    // If no data and not PREFER_CACHE, run the scraper
    if (!result && freshness !== DataFreshness.PREFER_CACHE) {
      await this.runScraper(sourceName);
      return (await getScrapedData<T>(sourceName, DataFreshness.PREFER_CACHE))?.data || null;
    }
    
    return result?.data || null;
  }
} 