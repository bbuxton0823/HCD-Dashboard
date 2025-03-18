import { HCDReportData, DashboardData } from '@/models/InternalHCDData';

/**
 * Generates mock HCD report data for testing and development
 */
export function getMockHCDData(): HCDReportData {
  return {
    reportingPeriod: {
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-31')
    },
    jurisdictions: [
      {
        name: 'San Mateo',
        permitData: {
          veryLowIncome: 45,
          lowIncome: 82,
          moderateIncome: 75,
          aboveModerateIncome: 310
        },
        completionData: {
          veryLowIncome: 22,
          lowIncome: 48,
          moderateIncome: 36,
          aboveModerateIncome: 189
        },
        projects: [
          {
            name: 'Bay Meadows Phase II',
            address: '3150 S Delaware St',
            city: 'San Mateo',
            units: 68,
            affordabilityLevel: 'Mixed Income',
            status: 'Under Construction',
            targetCompletionDate: new Date('2024-06-30'),
            latitude: 37.5398,
            longitude: -122.3002
          },
          {
            name: 'Peninsula Station',
            address: '112 S Railroad Ave',
            city: 'San Mateo',
            units: 42,
            affordabilityLevel: 'Low Income',
            status: 'Completed',
            latitude: 37.5664,
            longitude: -122.3239
          }
        ]
      },
      {
        name: 'Redwood City',
        permitData: {
          veryLowIncome: 52,
          lowIncome: 78,
          moderateIncome: 63,
          aboveModerateIncome: 280
        },
        completionData: {
          veryLowIncome: 28,
          lowIncome: 41,
          moderateIncome: 29,
          aboveModerateIncome: 162
        },
        projects: [
          {
            name: 'Broadway Plaza',
            address: '2201 Broadway',
            city: 'Redwood City',
            units: 120,
            affordabilityLevel: 'Mixed Income',
            status: 'Under Construction',
            targetCompletionDate: new Date('2024-08-15'),
            latitude: 37.4868,
            longitude: -122.2281
          },
          {
            name: 'Arroyo Green',
            address: '707 Bradford St',
            city: 'Redwood City',
            units: 117,
            affordabilityLevel: 'Very Low Income',
            status: 'Completed',
            latitude: 37.4858,
            longitude: -122.2267
          }
        ]
      },
      {
        name: 'South San Francisco',
        permitData: {
          veryLowIncome: 38,
          lowIncome: 65,
          moderateIncome: 58,
          aboveModerateIncome: 243
        },
        completionData: {
          veryLowIncome: 19,
          lowIncome: 32,
          moderateIncome: 28,
          aboveModerateIncome: 142
        },
        projects: [
          {
            name: 'Rotary Miller Senior Housing',
            address: '601 Miller Ave',
            city: 'South San Francisco',
            units: 81,
            affordabilityLevel: 'Low Income Senior',
            status: 'Permitted',
            targetCompletionDate: new Date('2025-02-28'),
            latitude: 37.6536,
            longitude: -122.4140
          }
        ]
      }
    ],
    countyTotals: {
      permitsIssued: 2580,
      unitsCompleted: 1245,
      affordableUnits: 520,
      adus: 183
    }
  };
}

/**
 * Generates mock dashboard data for testing and development
 */
export function getMockDashboardData(): DashboardData {
  return {
    summaryStats: {
      totalPlannedUnits: 2648,
      permitedUnits: 875,
      completedUnits: 325,
      affordableUnits: 142
    },
    housingProjects: [
      {
        id: '1',
        name: 'Bay Meadows Phase II',
        address: '3150 S Delaware St, San Mateo',
        units: 68,
        affordabilityLevel: 'Mixed Income',
        status: 'Under Construction',
        latitude: 37.5398,
        longitude: -122.3002
      },
      {
        id: '2',
        name: 'Peninsula Station',
        address: '112 S Railroad Ave, San Mateo',
        units: 42,
        affordabilityLevel: 'Low Income',
        status: 'Completed',
        latitude: 37.5664,
        longitude: -122.3239
      },
      {
        id: '3',
        name: 'Broadway Plaza',
        address: '2201 Broadway, Redwood City',
        units: 120,
        affordabilityLevel: 'Mixed Income',
        status: 'Under Construction',
        latitude: 37.4868,
        longitude: -122.2281
      },
      {
        id: '4',
        name: 'Arroyo Green',
        address: '707 Bradford St, Redwood City',
        units: 117,
        affordabilityLevel: 'Very Low Income',
        status: 'Completed',
        latitude: 37.4858,
        longitude: -122.2267
      },
      {
        id: '5',
        name: 'Rotary Miller Senior Housing',
        address: '601 Miller Ave, South San Francisco',
        units: 81,
        affordabilityLevel: 'Low Income Senior',
        status: 'Permitted',
        latitude: 37.6536,
        longitude: -122.4140
      },
      {
        id: '6',
        name: 'Gateway at Millbrae Station',
        address: '200 Rollins Rd, Millbrae',
        units: 320,
        affordabilityLevel: 'Mixed Income',
        status: 'Under Construction',
        latitude: 37.5986,
        longitude: -122.3868
      },
      {
        id: '7',
        name: 'The Ashton',
        address: '690 Veterans Blvd, Redwood City',
        units: 92,
        affordabilityLevel: 'Market Rate',
        status: 'Completed',
        latitude: 37.4897,
        longitude: -122.2372
      },
      {
        id: '8',
        name: 'Colma Veterans Housing',
        address: '1670 Mission Rd, Colma',
        units: 66,
        affordabilityLevel: 'Very Low Income',
        status: 'Planned',
        latitude: 37.6784,
        longitude: -122.4447
      },
      {
        id: '9',
        name: 'Linda Mar Apartments',
        address: '1125 Oddstad Blvd, Pacifica',
        units: 104,
        affordabilityLevel: 'Low Income',
        status: 'Completed',
        latitude: 37.6024,
        longitude: -122.4869
      },
      {
        id: '10',
        name: 'Pescadero Apartments',
        address: '350 Stage Rd, Pescadero',
        units: 38,
        affordabilityLevel: 'Very Low Income',
        status: 'Permitted',
        latitude: 37.2554,
        longitude: -122.3867
      },
      {
        id: '11',
        name: 'Burlingame Senior Housing',
        address: '1418 Trousdale Dr, Burlingame',
        units: 82,
        affordabilityLevel: 'Low Income Senior',
        status: 'Under Construction',
        latitude: 37.5878,
        longitude: -122.3751
      },
      {
        id: '12',
        name: 'Half Moon Bay Workforce Housing',
        address: '555 Kelly Ave, Half Moon Bay',
        units: 45,
        affordabilityLevel: 'Moderate Income',
        status: 'Planned',
        latitude: 37.4633,
        longitude: -122.4408
      }
    ],
    incomeDistribution: [
      {
        category: 'Very Low Income',
        value: 12.5,
        color: '#dc3545'
      },
      {
        category: 'Low Income',
        value: 8.5,
        color: '#fd7e14'
      },
      {
        category: 'Moderate Income',
        value: 7.2,
        color: '#ffc107'
      },
      {
        category: 'Above Moderate',
        value: 71.8,
        color: '#28a745'
      }
    ],
    progressChart: [
      {
        category: 'Very Low Income',
        completed: 45,
        underConstruction: 30,
        permitted: 25,
        planned: 150
      },
      {
        category: 'Low Income',
        completed: 30,
        underConstruction: 25,
        permitted: 15,
        planned: 120
      },
      {
        category: 'Moderate Income',
        completed: 20,
        underConstruction: 15,
        permitted: 10,
        planned: 100
      },
      {
        category: 'Above Moderate',
        completed: 230,
        underConstruction: 150,
        permitted: 120,
        planned: 1100
      }
    ],
    geographicData: {
      'San Mateo': {
        total: 423,
        affordable: 110
      },
      'Redwood City': {
        total: 380,
        affordable: 145
      },
      'South San Francisco': {
        total: 221,
        affordable: 81
      },
      'Daly City': {
        total: 184,
        affordable: 62
      },
      'Menlo Park': {
        total: 156,
        affordable: 42
      }
    }
  };
} 