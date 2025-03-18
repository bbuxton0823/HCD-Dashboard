/**
 * Types and interfaces for web scraping system
 */

/**
 * Represents the result of a scraping operation
 */
export interface ScrapingResult<T> {
  data: T;
  timestamp: string;
  source: string;
  success: boolean;
  error?: string;
}

/**
 * Base interface for all scrapers
 */
export interface BaseScraper<T> {
  /**
   * Name of the data source
   */
  readonly sourceName: string;
  
  /**
   * URL to scrape data from
   */
  readonly sourceUrl: string;
  
  /**
   * Scrape the data from the source
   */
  scrape(): Promise<ScrapingResult<T>>;
  
  /**
   * Process the raw scraped data into structured format
   */
  process(rawData: any): Promise<T>;
  
  /**
   * Save the scraped data to storage
   */
  save(result: ScrapingResult<T>): Promise<void>;
}

/**
 * Data freshness options
 */
export enum DataFreshness {
  // Always fetch fresh data
  ALWAYS_FRESH = 'always_fresh',
  
  // Use cached data if available and not expired
  USE_CACHE_IF_AVAILABLE = 'use_cache_if_available',
  
  // Always use cached data if available, regardless of age
  PREFER_CACHE = 'prefer_cache'
}

/**
 * Data manager interface
 */
export interface ScraperManager {
  /**
   * Run all scrapers
   */
  runAllScrapers(): Promise<void>;
  
  /**
   * Run a specific scraper by name
   */
  runScraper(scraperName: string): Promise<void>;
  
  /**
   * Get data for a specific source
   */
  getData<T>(sourceName: string, freshness?: DataFreshness): Promise<T | null>;
}

/**
 * Supported file types for parsing
 */
export enum FileType {
  HTML = 'html',
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json'
} 