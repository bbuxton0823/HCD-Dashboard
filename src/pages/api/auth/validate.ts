import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/authMiddleware';

/**
 * Endpoint to validate a JWT token and return user data
 * This endpoint is protected by the withAuth middleware
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  // Only allow GET for token validation
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // User data is attached by the withAuth middleware
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Return the user information
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}

// Apply the authentication middleware
export default withAuth(handler); 