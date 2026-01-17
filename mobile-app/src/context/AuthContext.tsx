import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import storage from '../services/storage';
import api from '../services/api';
import { loginWithCredentials, saveToken, logout as doLogout } from '../services/auth';
import { registerForPushNotificationsAsync } from '../services/notificationService';

interface UserProfile {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  phone?: string;
  localitate?: string;
  createdAt?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  collaborations?: string[];
  notificationSettings?: {
    email: boolean;
    push: boolean;
    messages: boolean;
    reviews: boolean;
    promotions: boolean;
  };
}

interface AuthContextType {
  loading: boolean;
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// Default fallback to prevent crashes
const defaultAuthContext: AuthContextType = {
  loading: true,
  user: null,
  token: null,
  isAuthenticated: false,
  login: async () => false,
  logout: async () => {},
  restore: async () => {},
  refreshProfile: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/api/users/profile');
      // Backend returnează direct obiectul user fără wrapper
      if (res.data && res.data._id) {
        // Hardcoded admin ID - acest user este întotdeauna admin
        const ADMIN_USER_ID = '6808bf9a48e492acb8db7173';
        const isHardcodedAdmin = res.data._id === ADMIN_USER_ID;
        
        setUser({
          id: res.data._id,
          email: res.data.email,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          avatar: res.data.avatar || null,
          phone: res.data.phone,
          localitate: res.data.localitate,
          createdAt: res.data.createdAt,
          isVerified: res.data.isVerified || false,
          isAdmin: isHardcodedAdmin || res.data.isAdmin || false,
          collaborations: res.data.collaborations || [],
          notificationSettings: res.data.notificationSettings || {
            email: true,
            push: true,
            messages: true,
            reviews: true,
            promotions: false
          },
        });
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const stored = await storage.getItemAsync('userToken');
      if (stored) {
        setToken(stored);
        try {
          await fetchProfile();
          // After profile is available, register for push notifications
          try {
            const tokenValue = await registerForPushNotificationsAsync();
            if (tokenValue) {
              try { await api.post('/api/users/push-token', { token: tokenValue }); } catch (_) {}
            }
          } catch (e) {
            // ignore push errors to not block auth
          }
        } catch (profileErr) {
          // If profile fetch fails (e.g., expired token), clear token
          console.warn('[Auth] Failed to fetch profile, clearing token');
          setToken(null);
          setUser(null);
          await storage.deleteItemAsync('userToken');
        }
      } else {
        setUser(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    restore();
  }, [restore]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await loginWithCredentials(email, password);
      if (data?.token) {
        await saveToken(data.token);
        setToken(data.token);
        await fetchProfile();

        // Register for push notifications
        try {
          const tokenValue = await registerForPushNotificationsAsync();
          if (tokenValue) {
            try { await api.post('/api/users/push-token', { token: tokenValue }); } catch (_) {}
          }
        } catch (e) {
          // ignore
        }

        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.warn('[Auth] login failed', e?.message);
      setLoading(false);
      throw e; // propagăm mesajul real
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Try to get current push token to remove only this device
      let tokenValue;
      try {
        tokenValue = await registerForPushNotificationsAsync();
      } catch (_) {}

      try { 
        if (tokenValue) {
          await api.delete('/api/users/push-token', { data: { token: tokenValue } }); 
        } else {
          await api.delete('/api/users/push-token'); 
        }
      } catch (_) {}

      await doLogout();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ loading, user, token, isAuthenticated: !!user && !!token, login, logout, restore, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};