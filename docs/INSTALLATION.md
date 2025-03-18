# Detailed Installation Guide

This guide provides comprehensive instructions for installing and configuring the San Mateo County Housing Element Dashboard with all its components.

## System Requirements

- **Node.js**: Version 16.x or higher
- **npm**: Version 7.x or higher (or yarn)
- **Memory**: At least 4GB of RAM recommended
- **Storage**: Minimum 1GB free space
- **Browser**: Chrome, Firefox, Safari, or Edge (latest version)
- **OpenAI API**: Valid API key with access to GPT-4

## Installation Steps

### 1. Basic Setup

First, clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/hcd-dashboard.git
cd hcd-dashboard
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the project root:

```
# Development Settings
NODE_ENV=development

# Feature Flags
NEXT_PUBLIC_USE_MOCK_DATA=true
NEXT_PUBLIC_USE_REAL_HCD_DATA=false

# External API URLs
NEXT_PUBLIC_SMC_OPEN_DATA_URL=https://data.smcgov.org/resource/housing-inventory.json
NEXT_PUBLIC_ABAG_DATA_URL=https://opendata.abag.ca.gov/datasets/housing-permits.json
NEXT_PUBLIC_HCD_RHNA_URL=https://www.hcd.ca.gov/api/open-data/housing-elements/san-mateo

# MCP Configuration
BROWSER_TOOLS_URL=http://localhost:3500
PUPPETEER_MCP_URL=http://localhost:3600

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Microservice Deployment

The dashboard uses two microservices for web scraping:

#### Browser Tools MCP

1. Install the Browser Tools MCP:

```bash
npm install -g @agentdeskai/browser-tools-server@1.2.0
```

2. Start the service:

```bash
npm run browser-tools
# Or manually:
npx @agentdeskai/browser-tools-server@1.2.0
```

The service will run on port 3500 by default.

#### Puppeteer MCP

The Puppeteer MCP is included in the repository:

```bash
# Start the Puppeteer MCP
npm run puppeteer-mcp
# Or manually:
node puppeteer-mcp-server.js
```

The service will run on port 3600 by default.

### 4. Starting the Application

Start the Next.js development server:

```bash
npm run dev
```

The dashboard will be available at [http://localhost:3000](http://localhost:3000).

## Advanced Configuration

### Custom API Endpoints

To use custom API endpoints, modify the URLs in the `.env.local` file.

### Memory Management for Puppeteer

For systems with limited memory, you can adjust the Puppeteer MCP settings:

1. Open `puppeteer-mcp-server.js`
2. Find the `MAX_BROWSERS` constant (default: 3)
3. Reduce it to a lower value (e.g., 1 or 2)

### Production Deployment

For production environments:

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. For proper production deployment, consider using:
   - A reverse proxy (Nginx/Apache)
   - A process manager (PM2)
   - HTTPS certificates

## Troubleshooting

### Common Issues

#### Browser Tools MCP Installation Failures

If you encounter errors installing the Browser Tools MCP:

```bash
# Try with specific permissions
sudo npm install -g @agentdeskai/browser-tools-server@1.2.0 --unsafe-perm=true

# Or install locally
npm install @agentdeskai/browser-tools-server@1.2.0 --save-dev
```

#### Puppeteer Installation Issues

Puppeteer may have dependencies on your system:

**Ubuntu/Debian:**
```bash
sudo apt-get install -y libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libasound2 libatk1.0-0 \
  libatk-bridge2.0-0 libpangocairo-1.0-0 libgtk-3-0
```

**macOS:**
No additional dependencies needed.

**Windows:**
Run as administrator to ensure proper installation.

#### OpenAI API Issues

If you encounter "Authentication Error" with OpenAI:
1. Verify your API key is correct
2. Check your OpenAI account has sufficient credits
3. Ensure the API key has access to GPT-4

#### Port Conflicts

If ports 3000, 3500, or 3600 are in use:

```bash
# Change Next.js port
npm run dev -- -p 3001

# Edit package.json for Browser Tools on a different port
# "browser-tools": "npx @agentdeskai/browser-tools-server@1.2.0 -p 3501"

# Edit puppeteer-mcp-server.js for a different port
# const PORT = process.env.PORT || 3601;
```

## Updating the Dashboard

To update to the latest version:

```bash
git pull
npm install
npm run build
npm start
```

## Logs and Debugging

To enable detailed logging:

```bash
# Development with debug logs
DEBUG=hcd-dashboard:* npm run dev

# For Puppeteer MCP debugging
DEBUG=puppeteer:* node puppeteer-mcp-server.js
```

## Support and Resources

- **GitHub Issues**: [Project Issues Page](https://github.com/yourusername/hcd-dashboard/issues)
- **Documentation**: See the `docs` directory for more guides
- **API Reference**: Check `docs/API.md` for API documentation 