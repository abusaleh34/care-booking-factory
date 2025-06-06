'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Using next/navigation for App Router

// Define types
export type UserRole = 'customer' | 'provider' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phoneNumber?: string;
  language?: string;
  // Add other user-specific fields as needed
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: Record<string, any>) => Promise<void>;
  logout: () => void;
  register: (userData: Record<string, any>) => Promise<any>; // Returns API response for OTP or other flows
  fetchUserProfile: () => Promise<void>; // Fetches profile if token exists but user state is null
  updateLocalUser: (updatedUserData: Partial<User>) => void; // Updates user in context and localStorage
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start true for initial load check
  const router = useRouter();

  const loadAuthDataFromStorage = useCallback(() => {
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUserJson = localStorage.getItem(AUTH_USER_KEY);

      if (storedToken && storedUserJson) {
        const storedUser: User = JSON.parse(storedUserJson);
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Failed to load auth data from storage:", error);
      // Clear potentially corrupted storage
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuthDataFromStorage();
  }, [loadAuthDataFromStorage]);

  const login = async (credentials: Record<string, any>): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      if (data.user && data.token) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      } else {
        throw new Error('Login response missing user or token');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw for the component to handle
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Record<string, any>): Promise<any> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Registration failed');
      }
      
      // Depending on flow, registration might auto-login or require OTP
      // For now, just return the response. If it contains user/token, handle it.
      if (responseData.user && responseData.token) {
        setUser(responseData.user);
        setToken(responseData.token);
        localStorage.setItem(AUTH_TOKEN_KEY, responseData.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(responseData.user));
      }
      return responseData; // Return the full response for further processing (e.g., OTP)
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    // Optionally, call a backend logout endpoint
    // fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login'); // Redirect to login page after logout
  };

  const fetchUserProfile = async (): Promise<void> => {
    const currentToken = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!currentToken) {
      // No token, ensure user is logged out
      if (user || token) {
         setUser(null);
         setToken(null);
      }
      setIsLoading(false);
      return;
    }

    // If user is already in state with this token, no need to fetch unless forced
    if (user && token === currentToken) {
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    try {
      // In a real app, you'd have an endpoint like /api/users/me
      // For this mock setup, we rely on localStorage or re-fetch if user ID is known
      // Let's assume login stores user, and this function is a fallback or refresh.
      // If we only have a token and no user in localStorage, this function would hit /api/users/me.
      // Since our mock login stores the user, we can re-use loadAuthDataFromStorage or implement /api/users/me.
      // For now, let's assume if token exists, user should also exist in localStorage.
      const storedUserJson = localStorage.getItem(AUTH_USER_KEY);
      if (storedUserJson) {
        const storedUser: User = JSON.parse(storedUserJson);
        setUser(storedUser);
        setToken(currentToken); // Ensure token state is also up-to-date
      } else {
        // This case means token exists but user data is missing from storage - an inconsistent state.
        // Ideally, call /api/users/me here. For now, clear the potentially invalid token.
        console.warn("Token found but user data missing from storage. Clearing token.");
        logout(); // This will clear token and redirect
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout(); // If fetching profile fails, log out
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateLocalUser = (updatedUserData: Partial<User>) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const newUser = { ...prevUser, ...updatedUserData };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      return newUser;
    });
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        register,
        fetchUserProfile,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Example ProtectedRoute HOC (can be in a separate file)
// This is a conceptual example. Actual implementation might vary.
/*
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/auth/login');
      } else if (!isLoading && isAuthenticated && allowedRoles) {
        if (!user?.role || !allowedRoles.includes(user.role)) {
          router.push('/unauthorized'); // Or some other page
        }
      }
    }, [isLoading, isAuthenticated, user, router, allowedRoles]);

    if (isLoading || !isAuthenticated) {
      return <div>Loading authentication...</div>; // Or a spinner component
    }
    
    if (allowedRoles && (!user?.role || !allowedRoles.includes(user.role))) {
        return <div>Checking authorization...</div>; // Or redirecting
    }

    return <WrappedComponent {...props} />;
  };
}
*/
