# API Documentation

This document outlines the internal APIs available in the San Mateo County Housing Element Dashboard.

## Table of Contents

- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Microservice APIs](#microservice-apis)

## API Endpoints

The dashboard provides several API endpoints for data retrieval and analysis.

### Dashboard Data API

#### `GET /api/dashboard-data`

Retrieves all dashboard data in a combined format.

**Query Parameters:**
- `refresh` (optional): Boolean, if `true`, forces fresh data retrieval

**Response:**
```json
{
  "success": true,
  "data": {
    "summaryStats": {
      "totalPlannedUnits": 2648,
      "permitedUnits": 875,
      "completedUnits": 325,
      "affordableUnits": 142
    },
    "incomeDistribution": [
      { "category": "Very Low", "value": 13 },
      { "category": "Low", "value": 9 },
      { "category": "Moderate", "value": 7 },
      { "category": "Above Moderate", "value": 72 }
    ],
    "progressChart": [...],
    "housingProjects": [...]
  },
  "timestamp": "2024-05-22T12:34:56Z"
}
```

#### `POST /api/scrape-data`

Triggers a web scrape for fresh data.

**Request Body:**
```json
{
  "source": "all", // or specific source: "san_mateo_housing_portal", "california_hcd_apr", "rhna_allocation"
  "freshness": "ALWAYS_FRESH", // or "USE_CACHE_IF_AVAILABLE"
  "usePuppeteerMCP": true // boolean to select MCP
}
```

**Response:**
```json
{
  "success": true,
  "message": "All data sources scraped successfully",
  "data": {...} // Optional, if specific source requested
}
```

#### `POST /api/upload-hcd-data`

Uploads custom HCD report data.

**Request Body:**
JSON structure matching the `HCDReportData` data model.

**Response:**
```json
{
  "success": true,
  "message": "Data successfully uploaded and processed",
  "timestamp": "2024-05-22T12:34:56Z"
}
```

### AI Integration API

#### `POST /api/generate-summary`

Generates an AI-powered summary of dashboard data.

**Request Body:**
```json
{
  "dashboardData": {
    "summaryStats": {...},
    "incomeDistribution": [...],
    "progressChart": [...],
    "housingProjects": [...]
  },
  "currentView": "overview" // or "progress", "map", "income"
}
```

**Response:**
```json
{
  "success": true,
  "summary": "You're viewing the San Mateo County Housing Dashboard Overview...",
  "source": "openai" // or "fallback"
}
```

#### `POST /api/recommend-mcp`

Get AI recommendation for which MCP to use.

**Request Body:**
```json
{
  "currentView": "overview",
  "operation": "all", // or specific source
  "previousSuccesses": {
    "browserTools": 5,
    "puppeteer": 3
  }
}
```

**Response:**
```json
{
  "success": true,
  "recommendedMCP": "browser-tools", // or "puppeteer"
  "confidence": 0.7,
  "reasoning": "Browser Tools MCP has higher success rate (65% vs 35%)."
}
```

## Data Models

### `DashboardData`

```typescript
interface DashboardData {
  summaryStats: {
    totalPlannedUnits: number;
    permitedUnits: number;
    completedUnits: number;
    affordableUnits: number;
  };
  incomeDistribution: Array<{
    category: string;
    value: number;
  }>;
  progressChart: Array<{
    category: string;
    completed: number;
    underConstruction: number;
    permitted: number;
    planned: number;
  }>;
  housingProjects: Array<{
    id: string;
    name: string;
    address: string;
    jurisdiction: string;
    latitude: number;
    longitude: number;
    totalUnits: number;
    affordableUnits: number;
    status: 'Planned' | 'Permitted' | 'Under Construction' | 'Completed';
    incomeLevel: string;
  }>;
}
```

### `HCDReportData`

```typescript
interface HCDReportData {
  reportingPeriod: {
    startDate: string; // ISO date
    endDate: string; // ISO date
  };
  jurisdictions: Array<{
    name: string;
    totalPermits: number;
    veryLowIncome: number;
    lowIncome: number;
    moderateIncome: number;
    aboveModerateIncome: number;
    totalCompleted: number;
  }>;
}
```

## Authentication

The API endpoints currently use basic authentication for admin functions. To authenticate:

1. Include the appropriate headers with your request:
   ```
   Authorization: Basic <base64-encoded-credentials>
   ```

2. Or use API key authentication for automated access:
   ```
   X-API-Key: <api-key>
   ```

## Error Handling

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error message explaining what went wrong",
  "error": "Optional technical error details"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized
- `404`: Resource not found
- `500`: Server error

## Microservice APIs

### Browser Tools MCP API

The Browser Tools MCP exposes the following endpoints at `http://localhost:3500`:

#### `POST /render`

Renders a web page and extracts data.

**Request Body:**
```json
{
  "url": "https://example.com",
  "selectors": {
    "title": "h1",
    "items": ".item"
  },
  "wait": 1000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Example Domain",
    "items": ["Item 1", "Item 2"]
  }
}
```

### Puppeteer MCP API

The Puppeteer MCP exposes the following endpoints at `http://localhost:3600`:

#### `POST /api/scrape`

Performs advanced web scraping.

**Request Body:**
```json
{
  "url": "https://example.com",
  "waitForSelector": ".content",
  "clickSelector": ".button",
  "extractSelectors": {
    "title": "h1",
    "items": ".item"
  },
  "waitForNetworkIdle": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Example Domain",
    "items": ["Item 1", "Item 2"]
  }
}
```

#### `POST /api/screenshot`

Takes a screenshot of a webpage.

**Request Body:**
```json
{
  "url": "https://example.com",
  "selector": ".content",
  "fullPage": false
}
```

**Response:**
```json
{
  "success": true,
  "screenshot": "data:image/png;base64,..." // Base64 encoded image
}
```

#### `GET /api/status`

Gets the status of the Puppeteer MCP.

**Response:**
```json
{
  "uptime": 3600,
  "browserPool": 2,
  "maxBrowsers": 3,
  "memoryUsage": {
    "rss": 123456789,
    "heapTotal": 87654321,
    "heapUsed": 54321678,
    "external": 12345678
  },
  "timestamp": "2024-05-22T12:34:56Z"
}
``` 