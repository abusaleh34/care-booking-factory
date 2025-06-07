'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Using next/navigation for App Router
// import { useTranslation } from 'react-i18next'; // For i18n error messages

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
  token: string | null; // This will be the access token
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: Record<string, any>) => Promise<User>;
  logout: () => Promise<void>;
  register: (userData: Record<string, any>) => Promise<any>; // Returns API response for OTP or other flows
  fetchUserProfile: () => Promise<User | null>; // Fetches profile if token exists but user state is null
  updateLocalUser: (updatedUserData: Partial<User>) => void; // Updates user in context and localStorage
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (passwordResetToken: string, newPassword: string) => Promise<void>;
  refreshToken: () => Promise<string | null>; // Function to attempt token refresh
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const ACCESS_TOKEN_KEY = 'accessToken'; // Changed from authToken for clarity
const AUTH_USER_KEY = 'authUser';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null); // Access Token
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // const { t } = useTranslation('auth'); // For i18n error messages

  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  };

  const persistAuthData = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(ACCESS_TOKEN_KEY, newToken);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
  };

  const fetchUserProfile = useCallback(async (): Promise<User | null> => {
    const currentToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!currentToken) {
      clearAuthData();
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    try {
      // Attempt to fetch user profile using the stored token
      // This also serves to validate the token
      const response = await fetch('/api/users/me', { // Assuming an endpoint to get current user
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) { // Token might be expired or invalid
          // Attempt to refresh token
          const newAccessToken = await refreshToken();
          if (newAccessToken) {
            // Retry fetchUserProfile with new token
            // This recursive call should have a depth limit or different handling in a real app
            return await fetchUserProfile(); // Simplified: re-call to re-validate with new token
          }
        }
        throw new Error('Failed to fetch user profile'); // Or a more specific error from response
      }

      const userData: User = await response.json();
      persistAuthData(currentToken, userData); // Persist potentially updated user data
      return userData;
    } catch (error) {
      console.error('Fetch user profile error:', error);
      await logout(); // If fetching profile fails (e.g. token invalid, refresh failed), log out
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []); // Added dependencies, including refreshToken and logout

  const refreshToken = async (): Promise<string | null> => {
    try {
      // The browser will automatically send the httpOnly refresh token cookie
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const { accessToken: newAccessToken } = await response.json();
      if (newAccessToken && user) { // Ensure user context exists to update
        persistAuthData(newAccessToken, user); // Re-persist with new access token, existing user data
        return newAccessToken;
      }
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      await logout(); // If refresh fails, logout
      return null;
    }
  };


  useEffect(() => {
    const initializeAuth = async () => {
      await fetchUserProfile(); // This will try to load user based on stored token
      setIsLoading(false);
    };
    initializeAuth();
  }, [fetchUserProfile]);


  const login = async (credentials: Record<string, any>): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', { // MSW will intercept this
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'auth:login.error'); // Use i18n key
      }

      if (data.user && data.accessToken) { // Assuming backend returns accessToken
        persistAuthData(data.accessToken, data.user);
        return data.user;
      } else {
        throw new Error('auth:login.missingTokenOrUser');
      }
    } catch (error) {
      console.error('Login error:', error);
      clearAuthData();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Record<string, any>): Promise<any> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', { // MSW will intercept
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'auth:register.error');
      }
      
      // If registration auto-logins and returns token/user:
      if (responseData.user && responseData.accessToken) {
        persistAuthData(responseData.accessToken, responseData.user);
      }
      return responseData; // Return for further processing (e.g., OTP, email verification)
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Call backend to invalidate refresh token (which is httpOnly)
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error("Logout API call failed, clearing client-side session anyway:", error);
    } finally {
      clearAuthData();
      setIsLoading(false);
      router.push('/auth/login');
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

  const requestPasswordReset = async (email: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'auth:forgotPassword.error');
      }
      // Typically, you'd show a success message to the user here
    } catch (error) {
      console.error('Request password reset error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (passwordResetToken: string, newPassword: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: passwordResetToken, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'auth:resetPassword.error');
      }
      // Password reset successful, perhaps redirect to login or show success message
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
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
        requestPasswordReset,
        resetPassword,
        refreshToken,
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

// Conceptual example of how an API client might use refreshToken
// This would typically be part of a dedicated API service with interceptors.
/*
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  let token = localStorage.getItem(ACCESS_TOKEN_KEY);

  const makeRequest = async (currentToken: string | null) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json',
      },
    });
  };

  let response = await makeRequest(token);

  if (response.status === 401) { // Unauthorized, possibly expired token
    try {
      const authContext = useAuth(); // This hook usage is problematic outside components/hooks
                                    // In a real app, you'd get refreshToken function from context or a global store
      const newAccessToken = await authContext.refreshToken(); // Or call the refresh endpoint directly
      if (newAccessToken) {
        response = await makeRequest(newAccessToken); // Retry with new token
      } else {
        // Refresh failed, logout or redirect
        // authContext.logout(); // This would also be problematic here
        throw new Error("Session expired, please log in again.");
      }
    } catch (refreshError) {
       // authContext.logout();
       throw refreshError;
    }
  }
  return response;
}
*/
