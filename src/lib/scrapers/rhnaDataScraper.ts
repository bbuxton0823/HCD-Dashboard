import { AbstractScraper } from './baseScraper';
import { FileType } from './types';
import * as cheerio from 'cheerio';
import * as XLSX from 'xlsx';

/**
 * Data structure for RHNA data by jurisdiction
 */
export interface RHNAData {
  jurisdictions: {
    name: string;
    rhnaAllocations: {
      veryLowIncome: number;
      lowIncome: number;
      moderateIncome: number;
      aboveModerateIncome: number;
      total: number;
    };
    progress: {
      veryLowIncome: number;
      lowIncome: number;
      moderateIncome: number;
      aboveModerateIncome: number;
      total: number;
    };
    progressPercentage: number;
  }[];
  countyTotal: {
    allocation: number;
    progress: number;
    percentage: number;
  };
  cycleYears: string; // e.g., "2023-2031"
  lastUpdated: string;
}

/**
 * Scraper for RHNA (Regional Housing Needs Assessment) data
 */
export class RHNADataScraper extends AbstractScraper<RHNAData> {
  constructor() {
    super(
      'rhna_allocation',
      'https://abag.ca.gov/our-work/housing/rhna-regional-housing-needs-allocation',
      FileType.HTML
    );
  }
  
  /**
   * Fetch data from ABAG website
   */
  async fetchData(): Promise<{ html: string; excelData?: ArrayBuffer }> {
    // First, fetch the main page
    const response = await fetch(this.sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch RHNA page: ${response.status} ${response.statusText}`);
    }
    const html = await response.text();
    
    // Next, try to find and download the Excel file with detailed data
    // This is a simplification - in reality, we'd parse the page to find the Excel link first
    try {
      const excelUrl = 'https://abag.ca.gov/sites/default/files/documents/2023-04/RHNA_Progress_YYYY-MM.xlsx';
      const excelResponse = await fetch(excelUrl);
      if (excelResponse.ok) {
        const excelData = await excelResponse.arrayBuffer();
        return { html, excelData };
      }
    } catch (error) {
      console.error('Failed to fetch Excel file:', error);
    }
    
    // Return just the HTML if Excel download fails
    return { html };
  }
  
  /**
   * Process RHNA data from website and/or Excel file
   */
  async process(data: { html: string; excelData?: ArrayBuffer }): Promise<RHNAData> {
    const { html, excelData } = data;
    
    // If we have Excel data, use that for detailed information
    if (excelData) {
      return this.processExcelData(excelData);
    }
    
    // Otherwise, try to extract what we can from the HTML
    return this.processHtmlData(html);
  }
  
  /**
   * Process RHNA data from Excel file
   */
  private processExcelData(excelData: ArrayBuffer): RHNAData {
    // Parse Excel file
    const workbook = XLSX.read(excelData, { type: 'array' });
    
    // Assume the first sheet contains the data we need
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    // This would be customized based on the actual Excel structure
    // For now, we'll return mock data
    return this.createMockData();
  }
  
  /**
   * Process RHNA data from HTML
   */
  private processHtmlData(html: string): RHNAData {
    // Parse HTML
    const $ = cheerio.load(html);
    
    // Extract data from the page
    // This would be customized based on the actual page structure
    
    // For now, we'll return mock data
    return this.createMockData();
  }
  
  /**
   * Create mock RHNA data for development
   */
  private createMockData(): RHNAData {
    const jurisdictions = [
      {
        name: 'San Mateo',
        rhnaAllocations: {
          veryLowIncome: 575,
          lowIncome: 330,
          moderateIncome: 388,
          aboveModerateIncome: 1033,
          total: 2326
        },
        progress: {
          veryLowIncome: 102,
          lowIncome: 157,
          moderateIncome: 120,
          aboveModerateIncome: 587,
          total: 966
        },
        progressPercentage: 41.5
      },
      {
        name: 'Redwood City',
        rhnaAllocations: {
          veryLowIncome: 1115,
          lowIncome: 643,
          moderateIncome: 789,
          aboveModerateIncome: 2041,
          total: 4588
        },
        progress: {
          veryLowIncome: 187,
          lowIncome: 215,
          moderateIncome: 142,
          aboveModerateIncome: 872,
          total: 1416
        },
        progressPercentage: 30.9
      },
      {
        name: 'South San Francisco',
        rhnaAllocations: {
          veryLowIncome: 871,
          lowIncome: 502,
          moderateIncome: 720,
          aboveModerateIncome: 1863,
          total: 3956
        },
        progress: {
          veryLowIncome: 142,
          lowIncome: 205,
          moderateIncome: 188,
          aboveModerateIncome: 702,
          total: 1237
        },
        progressPercentage: 31.3
      }
    ];
    
    // Calculate county totals
    const totalAllocation = jurisdictions.reduce((sum, j) => sum + j.rhnaAllocations.total, 0);
    const totalProgress = jurisdictions.reduce((sum, j) => sum + j.progress.total, 0);
    const overallPercentage = (totalProgress / totalAllocation) * 100;
    
    return {
      jurisdictions,
      countyTotal: {
        allocation: totalAllocation,
        progress: totalProgress,
        percentage: parseFloat(overallPercentage.toFixed(1))
      },
      cycleYears: "2023-2031",
      lastUpdated: new Date().toISOString()
    };
  }
} 