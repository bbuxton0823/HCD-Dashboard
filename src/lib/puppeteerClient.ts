/**
 * Client for the custom Puppeteer MCP
 */

const PUPPETEER_MCP_URL = process.env.PUPPETEER_MCP_URL || 'http://localhost:3600';

/**
 * Options for scraping a webpage
 */
export interface PuppeteerScrapingOptions {
  url: string;
  waitForSelector?: string;
  clickSelector?: string;
  extractSelectors?: Record<string, string>;
  timeout?: number;
  waitForNetworkIdle?: boolean;
  userAgent?: string;
  headers?: Record<string, string>;
  screenshotSelector?: string;
}

/**
 * Result of scraping a webpage
 */
export interface PuppeteerScrapingResult {
  success: boolean;
  html?: string;
  extractedData?: Record<string, any>;
  screenshot?: string;
  error?: string;
}

/**
 * Options for taking a screenshot
 */
export interface ScreenshotOptions {
  url: string;
  selector?: string;
  fullPage?: boolean;
  timeout?: number;
}

/**
 * Status of the Puppeteer MCP
 */
export interface PuppeteerMCPStatus {
  uptime: number;
  browserPool: number;
  maxBrowsers: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  timestamp: string;
}

/**
 * Scrape a webpage using the Puppeteer MCP
 */
export async function scrapePuppeteer(
  options: PuppeteerScrapingOptions
): Promise<PuppeteerScrapingResult> {
  try {
    // Check if we're on the server side
    const isServer = typeof window === 'undefined';
    
    // If we're on the client side, return a mock result
    if (!isServer) {
      console.warn('Puppeteer MCP client called from browser - using mock data');
      return {
        success: true,
        html: '<html><body><div>Mock scraped content from Puppeteer MCP</div></body></html>',
        extractedData: {},
      };
    }
    
    // Server-side implementation
    const response = await fetch(`${PUPPETEER_MCP_URL}/api/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error using Puppeteer MCP service:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Take a screenshot using the Puppeteer MCP
 */
export async function takeScreenshotPuppeteer(
  options: ScreenshotOptions
): Promise<string | null> {
  try {
    // Check if we're on the server side
    const isServer = typeof window === 'undefined';
    
    // If we're on the client side, return null
    if (!isServer) {
      console.warn('Puppeteer MCP screenshot function called from browser');
      return null;
    }
    
    const response = await fetch(`${PUPPETEER_MCP_URL}/api/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.success ? result.screenshot : null;
  } catch (error) {
    console.error('Error taking screenshot with Puppeteer MCP:', error);
    return null;
  }
}

/**
 * Extract data from a webpage using the Puppeteer MCP
 */
export async function extractDataPuppeteer(
  url: string,
  selectors: Record<string, string>,
  options: Partial<PuppeteerScrapingOptions> = {}
): Promise<Record<string, any> | null> {
  try {
    const result = await scrapePuppeteer({
      url,
      extractSelectors: selectors,
      waitForNetworkIdle: true,
      ...options
    });
    
    return result.success ? result.extractedData || null : null;
  } catch (error) {
    console.error('Error extracting data with Puppeteer MCP:', error);
    return null;
  }
}

/**
 * Get the status of the Puppeteer MCP
 */
export async function getPuppeteerMCPStatus(): Promise<PuppeteerMCPStatus | null> {
  try {
    // Check if we're on the server side
    const isServer = typeof window === 'undefined';
    
    // If we're on the client side, return null
    if (!isServer) {
      console.warn('Puppeteer MCP status function called from browser');
      return null;
    }
    
    const response = await fetch(`${PUPPETEER_MCP_URL}/api/status`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting Puppeteer MCP status:', error);
    return null;
  }
} 