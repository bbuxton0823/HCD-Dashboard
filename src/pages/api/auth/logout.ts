import type { NextApiRequest, NextApiResponse } from 'next';

/**
 * Endpoint to handle user logout
 * In a real implementation, this would also invalidate the token on the server side
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST for logout
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // In a real implementation with a token blacklist:
    // 1. Get the token from the Authorization header
    // 2. Add it to a blacklist or token revocation list
    // 3. Set the expiry time to the token's original expiry
    
    // For now, we'll just return a success response
    // The client-side code will clear the cookie
    
    return res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
} 