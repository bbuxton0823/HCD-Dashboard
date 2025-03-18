import { AbstractScraper } from './baseScraper';
import { FileType } from './types';
import * as cheerio from 'cheerio';
import { HousingProject } from '@/models/InternalHCDData';

/**
 * Data structure for scraped housing data from San Mateo Housing Portal
 */
export interface SanMateoHousingData {
  housingProjects: HousingProject[];
  lastUpdated: string;
  totalUnits: number;
  affordableUnits: number;
}

/**
 * Scraper for San Mateo County Housing Portal website
 */
export class SanMateoHousingPortalScraper extends AbstractScraper<SanMateoHousingData> {
  constructor() {
    super(
      'san_mateo_housing_portal',
      'https://housing.smcgov.org/san-mateo-county-housing-projects', // Example URL
      FileType.HTML
    );
  }
  
  /**
   * Fetch HTML data from the housing portal
   */
  async fetchData(): Promise<string> {
    const response = await fetch(this.sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }
  
  /**
   * Process HTML data from the housing portal
   */
  async process(html: string): Promise<SanMateoHousingData> {
    // Load HTML into cheerio
    const $ = cheerio.load(html);
    
    // Extract housing projects
    const housingProjects: HousingProject[] = [];
    
    // Extract table rows - modify selectors based on actual page structure
    // This is a hypothetical example that would need to be adjusted based on the actual webpage
    $('.housing-project-table tr').each((index, element) => {
      if (index === 0) return; // Skip header row
      
      const cells = $(element).find('td');
      
      // Extract data from cells
      const projectName = $(cells[0]).text().trim();
      const address = $(cells[1]).text().trim();
      const city = $(cells[2]).text().trim();
      const units = parseInt($(cells[3]).text().trim(), 10);
      const affordabilityLevel = $(cells[4]).text().trim();
      const status = $(cells[5]).text().trim();
      
      // Only add if we have valid data
      if (projectName && address && !isNaN(units)) {
        housingProjects.push({
          name: projectName,
          address: `${address}, ${city}`,
          city,
          units,
          affordabilityLevel,
          status: this.mapStatus(status),
          // We'll need to geocode these in a separate step
        });
      }
    });
    
    // Extract summary data
    const lastUpdated = $('.last-updated').text().trim() || new Date().toISOString();
    const totalUnits = housingProjects.reduce((sum, project) => sum + project.units, 0);
    const affordableUnits = housingProjects
      .filter(project => 
        project.affordabilityLevel.toLowerCase().includes('low') || 
        project.affordabilityLevel.toLowerCase().includes('affordable')
      )
      .reduce((sum, project) => sum + project.units, 0);
    
    return {
      housingProjects,
      lastUpdated,
      totalUnits,
      affordableUnits
    };
  }
  
  /**
   * Map status text from the website to our standard statuses
   */
  private mapStatus(statusText: string): HousingProject['status'] {
    const status = statusText.toLowerCase();
    
    if (status.includes('complete') || status.includes('built')) {
      return 'Completed';
    } else if (status.includes('construction') || status.includes('building')) {
      return 'Under Construction';
    } else if (status.includes('permit') || status.includes('approved')) {
      return 'Permitted';
    } else {
      return 'Planned';
    }
  }
} 