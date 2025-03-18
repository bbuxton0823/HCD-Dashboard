const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

// Cache directory for screenshots and HTML content
const CACHE_DIR = path.join(__dirname, 'cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// Configure Express server
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Browser instance pool
let browserPool = [];
const MAX_BROWSERS = 3; // Maximum number of browser instances to keep in the pool

/**
 * Get a browser instance from the pool or create a new one
 */
async function getBrowser() {
  if (browserPool.length > 0) {
    return browserPool.pop();
  }
  
  console.log('Launching new browser instance');
  return await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH
  });
}

/**
 * Return a browser instance to the pool, or close it if the pool is full
 */
async function returnBrowser(browser) {
  if (browserPool.length < MAX_BROWSERS) {
    browserPool.push(browser);
  } else {
    await browser.close();
  }
}

/**
 * Clean up all browser instances on server shutdown
 */
async function cleanupBrowsers() {
  console.log('Cleaning up browser instances...');
  for (const browser of browserPool) {
    await browser.close();
  }
  browserPool = [];
}

// Setup process cleanup
process.on('SIGINT', async () => {
  await cleanupBrowsers();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanupBrowsers();
  process.exit(0);
});

/**
 * API endpoint to scrape a webpage
 */
app.post('/api/scrape', async (req, res) => {
  console.log('Received scrape request:', req.body.url);
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    const {
      url,
      waitForSelector,
      clickSelector,
      extractSelectors,
      timeout = 30000,
      waitForNetworkIdle = false,
      userAgent,
      headers,
      screenshotSelector
    } = req.body;
    
    // Set custom user agent if specified
    if (userAgent) {
      await page.setUserAgent(userAgent);
    }
    
    // Set custom headers if specified
    if (headers) {
      await page.setExtraHTTPHeaders(headers);
    }
    
    // Navigate to the page
    const waitUntilOption = waitForNetworkIdle ? 'networkidle2' : 'domcontentloaded';
    await page.goto(url, { 
      waitUntil: waitUntilOption,
      timeout 
    });
    
    // Wait for selector if specified
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout });
    }
    
    // Click on selector if specified
    if (clickSelector) {
      await page.click(clickSelector);
      // Wait a bit after clicking
      await page.waitForTimeout(1000);
    }
    
    // Extract specific data if selectors are provided
    let extractedData = {};
    if (extractSelectors) {
      for (const [key, selector] of Object.entries(extractSelectors)) {
        try {
          const elements = await page.$$(selector);
          if (elements.length === 1) {
            // Single element - extract text
            extractedData[key] = await page.$eval(selector, el => el.textContent.trim());
          } else if (elements.length > 1) {
            // Multiple elements - extract array of text
            extractedData[key] = await page.$$eval(selector, els => els.map(el => el.textContent.trim()));
          }
        } catch (error) {
          console.warn(`Error extracting ${key} with selector ${selector}:`, error.message);
          extractedData[key] = null;
        }
      }
    }
    
    // Take screenshot if requested
    let screenshot = null;
    if (screenshotSelector) {
      try {
        const element = await page.$(screenshotSelector);
        if (element) {
          const screenshotBuffer = await element.screenshot({ encoding: 'base64' });
          screenshot = `data:image/png;base64,${screenshotBuffer}`;
        }
      } catch (error) {
        console.warn('Error taking screenshot:', error.message);
      }
    }
    
    // Get the HTML content
    const html = await page.content();
    
    // Return the page to the browser and the browser to the pool
    await page.close();
    await returnBrowser(browser);
    
    // Return the result
    return res.json({
      success: true,
      html,
      extractedData,
      screenshot
    });
  } catch (error) {
    console.error('Error scraping webpage:', error);
    
    // Close the page and return the browser to the pool
    try {
      await page.close();
      await returnBrowser(browser);
    } catch (closeError) {
      console.error('Error closing resources:', closeError);
      // If we can't return to pool, just close the browser
      try { await browser.close(); } catch (e) { /* ignore */ }
    }
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API endpoint to take a screenshot of a webpage
 */
app.post('/api/screenshot', async (req, res) => {
  console.log('Received screenshot request:', req.body.url);
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    const { url, selector, fullPage = false, timeout = 30000 } = req.body;
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle2', timeout });
    
    // Take screenshot
    let screenshotBuffer;
    if (selector) {
      await page.waitForSelector(selector, { timeout });
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Selector "${selector}" not found`);
      }
      screenshotBuffer = await element.screenshot({ encoding: 'base64' });
    } else {
      screenshotBuffer = await page.screenshot({ 
        fullPage,
        encoding: 'base64'
      });
    }
    
    // Return the page to the browser and the browser to the pool
    await page.close();
    await returnBrowser(browser);
    
    // Return the result
    return res.json({
      success: true,
      screenshot: `data:image/png;base64,${screenshotBuffer}`
    });
  } catch (error) {
    console.error('Error taking screenshot:', error);
    
    // Close the page and return the browser to the pool
    try {
      await page.close();
      await returnBrowser(browser);
    } catch (closeError) {
      console.error('Error closing resources:', closeError);
      // If we can't return to pool, just close the browser
      try { await browser.close(); } catch (e) { /* ignore */ }
    }
    
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API endpoint to get browser and server status
 */
app.get('/api/status', (req, res) => {
  const status = {
    uptime: process.uptime(),
    browserPool: browserPool.length,
    maxBrowsers: MAX_BROWSERS,
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  
  res.json(status);
});

// Start the server
const PORT = process.env.PORT || 3600;
app.listen(PORT, () => {
  console.log(`Puppeteer MCP server running on port ${PORT}`);
  console.log(`Chrome executable path: ${process.env.PUPPETEER_EXECUTABLE_PATH || 'default'}`);
}); 