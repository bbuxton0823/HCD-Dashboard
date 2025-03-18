import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';

// Define user roles for RBAC
export type UserRole = 'public' | 'admin' | 'dataManager';

// Define user object type
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Define auth context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT token cookie name
const AUTH_COOKIE_NAME = 'hcd_dashboard_auth_token';

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/admin',
  '/admin/users',
  '/admin/data',
];

// Routes accessible only by specific roles
const ROLE_PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/admin/users': ['admin'],
  '/admin/data': ['admin', 'dataManager'],
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const router = useRouter();

  // Initialize auth state from JWT token in cookies
  const initializeAuth = async () => {
    setIsLoading(true);
    try {
      const token = Cookies.get(AUTH_COOKIE_NAME);
      if (token) {
        // Validate the token and get user data
        const userData = await validateToken(token);
        if (userData) {
          setUser(userData);
        } else {
          // Invalid token, clear it
          Cookies.remove(AUTH_COOKIE_NAME);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Authentication initialization error:', error);
      setUser(null);
      Cookies.remove(AUTH_COOKIE_NAME);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  // Validate JWT token with the server
  const validateToken = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Token validation error:', error);
      return null;
    }
  };

  // Handle login
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store token in cookie (secure, HTTP-only in production)
        Cookies.set(AUTH_COOKIE_NAME, data.token, { 
          expires: 7, // 7 days
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        setUser(data.user);
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  // Handle logout
  const logout = async (): Promise<void> => {
    try {
      // Call logout endpoint to invalidate the token server-side
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Remove token cookie
      Cookies.remove(AUTH_COOKIE_NAME);
      setUser(null);
      // Redirect to home page
      router.push('/');
    }
  };

  // Check if user has required permissions
  const hasPermission = (requiredRoles: UserRole[]): boolean => {
    if (!user) return false;
    if (requiredRoles.includes(user.role)) return true;
    return false;
  };

  // Route protection logic
  useEffect(() => {
    if (!isInitialized) return;

    const path = router.pathname;
    
    // Check if current route requires authentication
    const requiresAuth = PROTECTED_ROUTES.some(route => 
      path === route || path.startsWith(`${route}/`)
    );

    if (requiresAuth && !user) {
      // Redirect to login page with return URL
      router.push(`/login?returnUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }

    // Check role-based access
    for (const [routePath, roles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
      if (path === routePath || path.startsWith(`${routePath}/`)) {
        if (!hasPermission(roles)) {
          // Redirect to unauthorized page
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [router.pathname, user, isInitialized]);

  // Initialize auth on component mount
  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated: !!user, 
      login, 
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 