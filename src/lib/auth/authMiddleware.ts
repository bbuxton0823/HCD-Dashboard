import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { UserRole } from './AuthContext';

// Environment variable for JWT secret (should be stored in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Interface for extended request object with user data
export interface AuthenticatedRequest extends NextApiRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

// Type for handler functions that will receive authenticated requests
export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

/**
 * Middleware to verify JWT token and authenticate API requests
 * @param handler The API route handler
 * @returns A wrapped handler with authentication
 */
export function withAuth(handler: AuthenticatedHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // Get the authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Missing or invalid token format' });
      }
      
      // Extract the token
      const token = authHeader.substring(7);
      
      try {
        // Verify the token and extract user data
        const decodedToken = jwt.verify(token, JWT_SECRET) as {
          id: string;
          email: string;
          name: string;
          role: UserRole;
        };
        
        // Add user data to the request object
        (req as AuthenticatedRequest).user = {
          id: decodedToken.id,
          email: decodedToken.email,
          name: decodedToken.name,
          role: decodedToken.role,
        };
        
        // Proceed to the handler
        return handler(req as AuthenticatedRequest, res);
      } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
      }
    } catch (error) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
}

/**
 * Middleware to restrict access based on user roles
 * @param handler The API route handler
 * @param allowedRoles Array of roles that can access this endpoint
 * @returns A wrapped handler with role-based authorization
 */
export function withRoles(handler: AuthenticatedHandler, allowedRoles: UserRole[]) {
  return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
    // User property should exist from the withAuth middleware
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User not authenticated' });
    }
    
    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
    }
    
    // User has the required role, proceed to the handler
    return handler(req, res);
  });
}

/**
 * Create a JWT token
 * @param payload Data to include in the token
 * @param expiresIn Token expiration time (default 7 days)
 * @returns JWT token string
 */
export function createToken(payload: Record<string, any>, expiresIn: string = '7d'): string {
  // Use a separate options object for sign
  const options = { expiresIn };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export function verifyToken(token: string): Record<string, any> | null {
  try {
    return jwt.verify(token, JWT_SECRET) as Record<string, any>;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
} 