import type { NextApiResponse } from 'next';
import { getPuppeteerMCPStatus } from '@/lib/puppeteerClient';
import { AuthenticatedRequest, withRoles } from '@/lib/auth/authMiddleware';

type RequestData = {
  currentView: string;
  operation: string;
  previousSuccesses?: {
    browserTools: number;
    puppeteer: number;
  };
};

type ResponseData = {
  success: boolean;
  recommendedMCP: 'browser-tools' | 'puppeteer';
  confidence: number;
  reasoning: string;
  error?: string;
};

/**
 * API handler for recommending which MCP to use
 * This endpoint is protected and requires admin or dataManager role
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      recommendedMCP: 'browser-tools',
      confidence: 0,
      reasoning: 'Method not allowed'
    });
  }

  try {
    // Log the user making the request
    console.log(`MCP recommendation requested by user: ${req.user?.id} (${req.user?.email})`);
    
    const { currentView, operation, previousSuccesses } = req.body as RequestData;
    
    // Get current Puppeteer MCP status
    const puppeteerStatus = await getPuppeteerMCPStatus();
    
    // Decision logic based on available data
    let recommendedMCP: 'browser-tools' | 'puppeteer' = 'browser-tools';
    let confidence = 0.5;
    let reasoning = '';
    
    // 1. If Puppeteer MCP is overloaded, use Browser Tools
    if (puppeteerStatus && puppeteerStatus.browserPool >= puppeteerStatus.maxBrowsers - 1) {
      recommendedMCP = 'browser-tools';
      confidence = 0.9;
      reasoning = 'Puppeteer MCP is near capacity, using Browser Tools is more reliable.';
    }
    // 2. Check previous success rates if available
    else if (previousSuccesses) {
      const totalAttempts = (previousSuccesses.browserTools + previousSuccesses.puppeteer) || 1;
      const puppeteerSuccessRate = previousSuccesses.puppeteer / totalAttempts;
      const browserToolsSuccessRate = previousSuccesses.browserTools / totalAttempts;
      
      if (puppeteerSuccessRate > browserToolsSuccessRate) {
        recommendedMCP = 'puppeteer';
        confidence = 0.6 + (puppeteerSuccessRate - browserToolsSuccessRate);
        reasoning = `Puppeteer MCP has higher success rate (${Math.round(puppeteerSuccessRate * 100)}% vs ${Math.round(browserToolsSuccessRate * 100)}%).`;
      } else {
        recommendedMCP = 'browser-tools';
        confidence = 0.6 + (browserToolsSuccessRate - puppeteerSuccessRate);
        reasoning = `Browser Tools MCP has higher success rate (${Math.round(browserToolsSuccessRate * 100)}% vs ${Math.round(puppeteerSuccessRate * 100)}%).`;
      }
    }
    // 3. Operation-specific recommendations
    else {
      switch (operation) {
        case 'california_hcd_apr':
          // Complex reporting site works better with Puppeteer
          recommendedMCP = 'puppeteer';
          confidence = 0.8;
          reasoning = 'California HCD reporting site works better with Puppeteer due to complex JavaScript interactions.';
          break;
        case 'san_mateo_housing_portal':
          // Simple data portals work well with Browser Tools
          recommendedMCP = 'browser-tools';
          confidence = 0.7;
          reasoning = 'Simple data portals like San Mateo Housing Portal work efficiently with Browser Tools.';
          break;
        case 'rhna_allocation':
          // RHNA data can be complex
          recommendedMCP = 'puppeteer';
          confidence = 0.6;
          reasoning = 'RHNA allocation data has complex elements that Puppeteer handles better.';
          break;
        case 'all':
          // For all data refresh, use Puppeteer which is more robust
          recommendedMCP = 'puppeteer';
          confidence = 0.65;
          reasoning = 'When refreshing all data sources, Puppeteer provides more consistent results.';
          break;
        default:
          recommendedMCP = 'browser-tools';
          confidence = 0.5;
          reasoning = 'Using Browser Tools MCP as the default option for general operations.';
      }
    }

    // Audit log the recommendation (in a real system, this would go to a secure audit log)
    logAuditEvent({
      action: 'MCP_RECOMMENDATION',
      userId: req.user?.id || 'unknown',
      userEmail: req.user?.email || 'unknown',
      timestamp: new Date().toISOString(),
      details: `Recommended ${recommendedMCP} for ${operation} operation with ${confidence.toFixed(2)} confidence`
    });

    // Return the recommendation
    return res.status(200).json({
      success: true,
      recommendedMCP,
      confidence,
      reasoning
    });
    
  } catch (error) {
    console.error('Error recommending MCP:', error);
    
    return res.status(500).json({
      success: false,
      recommendedMCP: 'browser-tools', // Default to browser-tools on error
      confidence: 0.5,
      reasoning: 'Error occurred, defaulting to Browser Tools MCP',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * Log an audit event for security tracking
 * @param event The audit event to log
 */
function logAuditEvent(event: {
  action: string;
  userId: string;
  userEmail: string;
  timestamp: string;
  details: string;
}): void {
  // In a real implementation, this would write to a secure audit log
  console.log('AUDIT LOG:', event);
}

// Apply role-based authentication middleware - only admin and dataManager roles can access
export default withRoles(handler, ['admin', 'dataManager']); 