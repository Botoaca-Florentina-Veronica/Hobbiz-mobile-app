import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import storage from '../services/storage';
import api from '../services/api';
import { loginWithCredentials, saveToken, logout as doLogout } from '../services/auth';

interface UserProfile {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
  phone?: string;
  localitate?: string;
  createdAt?: string;
}

interface AuthContextType {
  loading: boolean;
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/api/users/profile');
      // Backend returnează direct obiectul user fără wrapper
      if (res.data && res.data._id) {
        setUser({
          id: res.data._id,
          email: res.data.email,
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          avatar: res.data.avatar || null,
          phone: res.data.phone,
          localitate: res.data.localitate,
          createdAt: res.data.createdAt,
        });
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  }, []);

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
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
              const { status } = await Notifications.requestPermissionsAsync();
              finalStatus = status;
            }
            if (finalStatus === 'granted') {
              const projectId = (Constants as any)?.expoConfig?.extra?.eas?.projectId || (Constants as any)?.easConfig?.projectId;
              const pushTokenData = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined as any);
              const tokenValue = (pushTokenData as any)?.data || (pushTokenData as any)?.expoPushToken;
              if (tokenValue) {
                try { await api.post('/api/users/push-token', { token: tokenValue }); } catch (_) {}
              }
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
      try { await api.delete('/api/users/push-token'); } catch (_) {}
      await doLogout();
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ loading, user, token, isAuthenticated: !!user && !!token, login, logout, restore }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
