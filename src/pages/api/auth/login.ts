import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@/lib/auth/AuthContext';

// In a real implementation, these would be stored in a database
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@example.com',
    password: '$2a$10$DGJM6F9cN6uG1suJiKDOZu/3vBnHjjJ4r7XHUgjkJU4GJ.gXFu/4y', // 'admin123'
    name: 'Admin User',
    role: 'admin' as UserRole
  },
  {
    id: '2',
    email: 'datamanager@example.com',
    password: '$2a$10$DGJM6F9cN6uG1suJiKDOZu/3vBnHjjJ4r7XHUgjkJU4GJ.gXFu/4y', // 'admin123'
    name: 'Data Manager',
    role: 'dataManager' as UserRole
  }
];

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST for login
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Find user by email (in a real app, this would query a database)
    const user = MOCK_USERS.find(u => u.email === email);

    // User not found
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Create JWT token (with sensitive info removed)
    const token = jwt.sign(
      { 
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info and token
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
} 