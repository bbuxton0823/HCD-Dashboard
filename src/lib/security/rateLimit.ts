import { NextApiRequest, NextApiResponse } from 'next';
import { AuthenticatedRequest } from '@/lib/auth/authMiddleware';

// In-memory store for rate limiting
// In production, this should be replaced with Redis or another distributed cache
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Add a log message to indicate the module is loading
console.log('Rate limit middleware loaded');

const rateLimits: RateLimitStore = {};

// Configuration options for rate limiting
interface RateLimitOptions {
  // Maximum number of requests allowed in the window
  limit: number;
  // Time window in seconds
  windowMs: number;
  // Optional identifier function (defaults to IP-based limiting)
  identifierFn?: (req: NextApiRequest) => string;
}

/**
 * Get a unique identifier for the request
 * Uses authenticated user ID if available, otherwise falls back to IP
 */
const getRequestIdentifier = (req: NextApiRequest): string => {
  // If user is authenticated, use their ID
  const authenticatedReq = req as AuthenticatedRequest;
  if (authenticatedReq.user?.id) {
    return `user:${authenticatedReq.user.id}`;
  }
  
  // Otherwise use IP address
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded 
    ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0])
    : req.socket.remoteAddress || 'unknown';
  
  return `ip:${ip}`;
};

/**
 * Rate limiting middleware for Next.js API routes
 */
export function rateLimitMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  options: RateLimitOptions = { limit: 10, windowMs: 60 * 1000 } // Default: 10 requests per minute
): boolean {
  // Get identifier for this request
  const identifier = options.identifierFn 
    ? options.identifierFn(req) 
    : getRequestIdentifier(req);
  
  const now = Date.now();
  
  // Initialize or get existing rate limit data
  if (!rateLimits[identifier] || rateLimits[identifier].resetTime < now) {
    rateLimits[identifier] = {
      count: 0,
      resetTime: now + options.windowMs
    };
  }
  
  // Increment request count
  rateLimits[identifier].count++;
  
  // Set headers to communicate rate limit info to client
  res.setHeader('X-RateLimit-Limit', options.limit.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, options.limit - rateLimits[identifier].count).toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimits[identifier].resetTime / 1000).toString());
  
  // If limit exceeded, return 429 Too Many Requests
  if (rateLimits[identifier].count > options.limit) {
    res.status(429).json({
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil((rateLimits[identifier].resetTime - now) / 1000)
    });
    return false;
  }
  
  // Limit not exceeded, request can proceed
  return true;
}

/**
 * Higher-order function to apply rate limiting to API handlers
 */
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void,
  options?: RateLimitOptions
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Apply rate limiting
    const canProceed = rateLimitMiddleware(req, res, options);
    
    // If rate limit not exceeded, proceed to handler
    if (canProceed) {
      return handler(req, res);
    }
  };
}

// Cleanup function to prevent memory leaks in development
// In production, this should be replaced with TTL in Redis
const cleanupRateLimits = () => {
  const now = Date.now();
  Object.keys(rateLimits).forEach(key => {
    if (rateLimits[key].resetTime < now) {
      delete rateLimits[key];
    }
  });
};

// Run cleanup every minute
if (typeof window === 'undefined') { // Only on server-side
  setInterval(cleanupRateLimits, 60 * 1000);
} 