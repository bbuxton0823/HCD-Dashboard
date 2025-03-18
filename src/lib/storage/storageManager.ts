import { ScrapingResult, DataFreshness } from '../scrapers/types';

/**
 * In-memory storage for scraped data (for development)
 * In production, this would be replaced with a database or file system storage
 */
const dataStore: Record<string, ScrapingResult<any>> = {};

/**
 * Save scraped data to storage
 */
export async function saveScrapedData<T>(
  sourceName: string, 
  result: ScrapingResult<T>
): Promise<void> {
  // In a real implementation, this would save to a database or file system
  console.log(`Saving scraped data for ${sourceName}`);
  dataStore[sourceName] = result;
  
  // Save to localStorage in browser environment
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`scraper_${sourceName}`, JSON.stringify(result));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }
}

/**
 * Get scraped data from storage
 */
export async function getScrapedData<T>(
  sourceName: string, 
  freshness: DataFreshness = DataFreshness.USE_CACHE_IF_AVAILABLE
): Promise<ScrapingResult<T> | null> {
  // Try to get from memory cache first
  const cachedData = dataStore[sourceName] as ScrapingResult<T> | undefined;
  
  // If no memory cache, try localStorage in browser environment
  if (!cachedData && typeof window !== 'undefined') {
    try {
      const storedData = localStorage.getItem(`scraper_${sourceName}`);
      if (storedData) {
        dataStore[sourceName] = JSON.parse(storedData);
        return dataStore[sourceName] as ScrapingResult<T>;
      }
    } catch (error) {
      console.error('Failed to retrieve from localStorage:', error);
    }
  }
  
  // If ALWAYS_FRESH or no data is available, return null
  if (freshness === DataFreshness.ALWAYS_FRESH || !cachedData) {
    return null;
  }
  
  // For USE_CACHE_IF_AVAILABLE, check if cache is expired
  if (freshness === DataFreshness.USE_CACHE_IF_AVAILABLE) {
    const timestamp = new Date(cachedData.timestamp).getTime();
    const now = Date.now();
    const cacheAge = now - timestamp;
    
    // Default cache duration: 24 hours
    const cacheDuration = 24 * 60 * 60 * 1000;
    
    if (cacheAge > cacheDuration) {
      return null; // Cache expired
    }
  }
  
  // Return cached data
  return cachedData;
}

/**
 * Clear all scraped data from storage
 */
export async function clearAllScrapedData(): Promise<void> {
  Object.keys(dataStore).forEach(key => {
    delete dataStore[key];
  });
  
  // Clear localStorage in browser environment
  if (typeof window !== 'undefined') {
    Object.keys(localStorage)
      .filter(key => key.startsWith('scraper_'))
      .forEach(key => {
        localStorage.removeItem(key);
      });
  }
} 