/**
 * Client for the Browser Tools MCP
 */

const BROWSER_TOOLS_URL = process.env.BROWSER_TOOLS_URL || 'http://localhost:3500';

export interface ScrapingOptions {
  url: string;
  waitForSelector?: string;
  clickSelector?: string;
  extractSelectors?: Record<string, string>;
  timeout?: number;
  waitForNetworkIdle?: boolean;
}

export interface ScrapingResult {
  success: boolean;
  html?: string;
  extractedData?: Record<string, any>;
  screenshot?: string;
  error?: string;
}

/**
 * Scrape a webpage using the Browser Tools MCP
 */
export async function scrapeWebpage(options: ScrapingOptions): Promise<ScrapingResult> {
  try {
    // Check if we're on the server side
    const isServer = typeof window === 'undefined';
    
    // If we're on the client side, return a mock result
    if (!isServer) {
      console.warn('Browser Tools client called from browser - using mock data');
      return {
        success: true,
        html: '<html><body><div>Mock scraped content</div></body></html>',
        extractedData: {},
      };
    }
    
    // Server-side implementation
    const response = await fetch(`${BROWSER_TOOLS_URL}/api/scrape`, {
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
    console.error('Error using Browser Tools service:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Take a screenshot of a webpage using the Browser Tools MCP
 */
export async function takeScreenshot(url: string, selector?: string): Promise<string | null> {
  try {
    // Check if we're on the server side
    const isServer = typeof window === 'undefined';
    
    // If we're on the client side, return null
    if (!isServer) {
      console.warn('Screenshot function called from browser');
      return null;
    }
    
    const response = await fetch(`${BROWSER_TOOLS_URL}/api/screenshot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        selector,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result.screenshot || null;
  } catch (error) {
    console.error('Error taking screenshot:', error);
    return null;
  }
}

/**
 * Extract data from a webpage using the Browser Tools MCP
 */
export async function extractData(
  url: string, 
  selectors: Record<string, string>
): Promise<Record<string, any> | null> {
  try {
    const result = await scrapeWebpage({
      url,
      extractSelectors: selectors,
      waitForNetworkIdle: true,
    });
    
    return result.success ? result.extractedData || null : null;
  } catch (error) {
    console.error('Error extracting data:', error);
    return null;
  }
} 