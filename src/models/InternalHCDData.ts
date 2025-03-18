/**
 * Data model interfaces for internal HCD reporting
 */

/**
 * Income level categories as defined by HCD
 */
export interface IncomeCategories {
  veryLowIncome: number;
  lowIncome: number;
  moderateIncome: number;
  aboveModerateIncome: number;
}

/**
 * Interface for housing project data
 */
export interface HousingProject {
  id?: string;
  name: string;
  address: string;
  city?: string;
  units: number;
  affordabilityLevel: string;
  status: 'Planned' | 'Permitted' | 'Under Construction' | 'Completed';
  targetCompletionDate?: Date;
  latitude?: number;
  longitude?: number;
}

/**
 * Interface for jurisdiction data (cities within San Mateo County)
 */
export interface Jurisdiction {
  name: string;
  permitData: IncomeCategories;
  completionData: IncomeCategories;
  projects: HousingProject[];
}

/**
 * Interface for HCD reporting data
 */
export interface HCDReportData {
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  jurisdictions: Jurisdiction[];
  countyTotals: {
    permitsIssued: number;
    unitsCompleted: number;
    affordableUnits: number;
    adus: number;
  };
}

/**
 * Interface for dashboard data displayed to users
 */
export interface DashboardData {
  summaryStats: {
    totalPlannedUnits: number;
    permitedUnits: number;
    completedUnits: number;
    affordableUnits: number;
  };
  housingProjects: HousingProject[];
  incomeDistribution: {
    category: string;
    value: number;
    color: string;
  }[];
  progressChart: {
    category: string;
    completed: number;
    underConstruction: number;
    permitted: number;
    planned: number;
  }[];
  geographicData?: {
    [city: string]: {
      total: number;
      affordable: number;
    };
  };
} 