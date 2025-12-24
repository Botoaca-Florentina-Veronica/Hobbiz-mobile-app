import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
// @ts-ignore - socket.io-client types are not critical here
import { io, Socket } from 'socket.io-client';

interface NotificationContextType {
  unreadNotificationCount: number;
  refreshNotificationCount: () => Promise<void>;
  decrementNotificationCount: (amount?: number) => void;
  incrementNotificationCount: (amount?: number) => void;
  setNotificationCount: (n: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  const refreshNotificationCount = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const res = await api.get(`/api/notifications/${user.id}`);
      const list = Array.isArray(res.data) ? res.data : [];
      const unread = list.filter((n: any) => n && n.read === false).length;
      setUnreadNotificationCount(unread);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 404 && status !== 401) {
        console.error('Error fetching notification count:', error);
      }
      setUnreadNotificationCount(0);
    }
  }, [user?.id, isAuthenticated]);

  const decrementNotificationCount = useCallback((amount: number = 1) => {
    setUnreadNotificationCount((prev) => Math.max(0, prev - amount));
  }, []);

  const incrementNotificationCount = useCallback((amount: number = 1) => {
    setUnreadNotificationCount((prev) => prev + amount);
  }, []);

  const setNotificationCount = useCallback((n: number) => {
    setUnreadNotificationCount(Math.max(0, n));
  }, []);

  // Fetch initial notification count when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshNotificationCount();
    } else {
      setUnreadNotificationCount(0);
    }
  }, [isAuthenticated, user?.id, refreshNotificationCount]);

  // Setup Socket.IO for real-time notification updates
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const base = (api.defaults.baseURL || '').replace(/\/$/, '');
    const socketUrl = base || 'http://localhost:5000';

    const socket = io(socketUrl, { transports: ['websocket'], autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', String(user.id));
    });

    // Listen for new notification events
    socket.on('newNotification', (payload: any) => {
      // Increment count when new notification arrives
      setUnreadNotificationCount((prev) => prev + 1);
    });

    socket.on('disconnect', () => {
      // noop
    });

    return () => {
      try { socket.disconnect(); } catch (_) {}
      socketRef.current = null;
    };
  }, [isAuthenticated, user?.id]);

  // Refresh notification count periodically (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const interval = setInterval(() => {
      refreshNotificationCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id, refreshNotificationCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadNotificationCount,
        refreshNotificationCount,
        decrementNotificationCount,
        incrementNotificationCount,
        setNotificationCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};