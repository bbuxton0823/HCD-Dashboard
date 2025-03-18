import { BaseScraper, ScrapingResult, FileType } from './types';
import { saveScrapedData } from '../storage/storageManager';

/**
 * Abstract base class for implementing scrapers
 */
export abstract class AbstractScraper<T> implements BaseScraper<T> {
  readonly sourceName: string;
  readonly sourceUrl: string;
  readonly fileType: FileType;
  
  /**
   * Cache duration in milliseconds (default: 24 hours)
   */
  readonly cacheDuration: number = 24 * 60 * 60 * 1000;
  
  constructor(sourceName: string, sourceUrl: string, fileType: FileType) {
    this.sourceName = sourceName;
    this.sourceUrl = sourceUrl;
    this.fileType = fileType;
  }
  
  /**
   * Main scraping method
   */
  async scrape(): Promise<ScrapingResult<T>> {
    try {
      console.log(`Scraping ${this.sourceName} from ${this.sourceUrl}`);
      
      // Fetch raw data
      const rawData = await this.fetchData();
      
      // Process raw data
      const processedData = await this.process(rawData);
      
      // Create result
      const result: ScrapingResult<T> = {
        data: processedData,
        timestamp: new Date().toISOString(),
        source: this.sourceUrl,
        success: true
      };
      
      // Save result
      await this.save(result);
      
      return result;
    } catch (error) {
      console.error(`Error scraping ${this.sourceName}:`, error);
      return {
        data: {} as T,
        timestamp: new Date().toISOString(),
        source: this.sourceUrl,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Fetch raw data from source
   */
  abstract fetchData(): Promise<any>;
  
  /**
   * Process raw data into structured format
   */
  abstract process(rawData: any): Promise<T>;
  
  /**
   * Save scraped data to storage
   */
  async save(result: ScrapingResult<T>): Promise<void> {
    return saveScrapedData(this.sourceName, result);
  }
} 