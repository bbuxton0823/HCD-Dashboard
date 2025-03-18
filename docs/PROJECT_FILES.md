# Project Files Overview

This document lists all the important files that should be included in the GitHub repository for the San Mateo County Housing Element Dashboard.

## Root Directory Files

- **package.json**: Project dependencies and scripts
- **package-lock.json**: Dependency lock file
- **next.config.js**: Next.js configuration
- **tsconfig.json**: TypeScript configuration
- **puppeteer-mcp-server.js**: Puppeteer MCP server implementation
- **.env.example**: Example environment variables (template for `.env.local`)
- **.gitignore**: Files and directories to ignore in Git
- **LICENSE**: MIT license file
- **README.md**: Project overview and documentation

## GitHub Configuration

- **.github/workflows/ci.yml**: CI/CD pipeline for GitHub Actions

## Documentation Files

- **docs/API.md**: API documentation
- **docs/INSTALLATION.md**: Detailed installation guide
- **docs/GITHUB_SETUP.md**: Instructions for GitHub setup
- **docs/PROJECT_FILES.md**: This file listing important project files
- **docs/dashboard_screenshot.png**: Screenshot of the dashboard

## Source Code

### Pages and API Routes

- **src/pages/_app.tsx**: Main application component with providers
- **src/pages/index.tsx**: Main dashboard page
- **src/pages/api/dashboard-data.ts**: API for retrieving dashboard data
- **src/pages/api/generate-summary.ts**: API for AI-powered summaries
- **src/pages/api/recommend-mcp.ts**: API for MCP recommendations
- **src/pages/api/scrape-data.ts**: API for web scraping
- **src/pages/api/upload-hcd-data.ts**: API for uploading HCD data

### Components

- **src/components/AIAssistant.tsx**: AI assistant component
- **src/components/DataLoader.tsx**: Data loading component
- **src/components/Header.tsx**: Dashboard header
- **src/components/HCDDataUpload.tsx**: HCD data upload component
- **src/components/HousingMap.tsx**: Interactive map component
- **src/components/IncomeDistribution.tsx**: Income distribution chart
- **src/components/LanguageToggle.tsx**: Language selection component
- **src/components/ProgressChart.tsx**: Housing progress chart
- **src/components/RefreshDataButton.tsx**: Data refresh button with MCP selection
- **src/components/SummaryStats.tsx**: Summary statistics component

### Libraries and Utilities

- **src/lib/LanguageContext.tsx**: Language context provider
- **src/lib/openai.ts**: OpenAI integration
- **src/lib/puppeteerClient.ts**: Puppeteer MCP client
- **src/lib/translations.ts**: Multilingual support
- **src/lib/mockData.ts**: Mock data for development

#### Scrapers

- **src/lib/scrapers/baseScraper.ts**: Base scraper class
- **src/lib/scrapers/scraperManager.ts**: Scraper orchestration
- **src/lib/scrapers/HCDReportScraper.ts**: HCD report scraper
- **src/lib/scrapers/RHNADataScraper.ts**: RHNA data scraper
- **src/lib/scrapers/SanMateoHousingPortalScraper.ts**: San Mateo housing portal scraper
- **src/lib/scrapers/types.ts**: Scraper type definitions

#### Storage

- **src/lib/storage/storageManager.ts**: Data storage management

### Models

- **src/models/InternalHCDData.ts**: Data models for internal representation

### Services

- **src/services/dataIntegration.ts**: Data integration service

### Styles

- **src/styles/globals.css**: Global styles
- **src/styles/variables.css**: CSS variables

## Public Assets

- **public/favicon.ico**: Site favicon
- **public/logo.svg**: Dashboard logo

## Notes

1. This list represents the core files needed for the project. Your repository might include additional files for tests, documentation, or configuration.

2. Some files (like `.env.local` with your actual OpenAI API key) should **not** be committed to the repository. That's why we include `.env.example` instead.

3. Generated files (like those in `.next/` build directory) should not be committed to the repository either, as they are created during the build process.

4. Make sure to check the `.gitignore` file to ensure sensitive or temporary files are excluded from version control. 