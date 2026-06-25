import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization, UserRole, LoginInput, SignupInput, AuthResponse } from '../types/api';
import { apiClient } from '../lib/axios';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  signup: (details: SignupInput & { organizationName: string }) => Promise<void>;
  logout: () => Promise<void>;
  joinOrgByCode: (code: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => {
    setUser(null);
    setOrganization(null);
    setRole(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
  };

  const fetchCurrentUser = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setIsLoading(false);
        return;
      }
      
      const response = await apiClient.get('/auth/me');
      if (response.data?.success && response.data?.data) {
        const { user: u, organization: org, role: r } = response.data.data;
        setUser(u);
        setOrganization(org);
        setRole(r);
        localStorage.setItem('userRole', r);
      }
    } catch (error) {
      console.error('Failed to restore authentication session:', error);
      // Session is invalid — clear tokens and redirect to login
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleSessionExpired = () => {
      clearSession();
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, []);

  const login = async (credentials: LoginInput) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', credentials);
      if (response.data?.success && response.data?.data) {
        const data: AuthResponse = response.data.data;
        setUser(data.user);
        setOrganization(data.organization);
        setRole(data.role);
        
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('userRole', data.role);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Invalid email or password';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (details: SignupInput & { organizationName: string }) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/signup', details);
      if (response.data?.success && response.data?.data) {
        const data: AuthResponse = response.data.data;
        setUser(data.user);
        setOrganization(data.organization);
        setRole(data.role);
        
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        localStorage.setItem('userRole', data.role);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || 'Failed to create account';
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      console.warn('Logout endpoint did not respond.');
    } finally {
      clearSession();
    }
  };

  const joinOrgByCode = async (inviteCode: string) => {
    try {
      await apiClient.post('/orgs/join', { inviteCode });
      await fetchCurrentUser();
    } catch (error) {
      console.error('Failed to join organization:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        role,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        joinOrgByCode,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
