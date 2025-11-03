import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface ChatNotificationContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  decrementUnreadCount: (amount?: number) => void;
  incrementUnreadCount: (amount?: number) => void;
  setUnreadCount: (n: number) => void;
}

const ChatNotificationContext = createContext<ChatNotificationContextType | undefined>(undefined);

export const ChatNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await api.get(`/api/messages/conversations/${user.id}`);
      const conversations = Array.isArray(response.data) ? response.data : [];
      const totalUnread = conversations.reduce((acc, convo) => {
        const value = typeof convo?.unreadCount === 'number'
          ? convo.unreadCount
          : (convo?.unread ? 1 : 0);
        return acc + (Number.isFinite(value) ? value : 0);
      }, 0);
      setUnreadCount(totalUnread);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 404 && status !== 401) {
        console.error('Error fetching unread count:', error);
      }
      setUnreadCount(0);
    }
  }, [user?.id, isAuthenticated]);

  const decrementUnreadCount = useCallback((amount: number = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - amount));
  }, []);

  const incrementUnreadCount = useCallback((amount: number = 1) => {
    setUnreadCount((prev) => prev + amount);
  }, []);

  // Fetch initial unread count when user logs in
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshUnreadCount();
    } else {
      setUnreadCount(0);
    }
  }, [isAuthenticated, user?.id, refreshUnreadCount]);

  // Refresh unread count periodically (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const interval = setInterval(() => {
      refreshUnreadCount();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id, refreshUnreadCount]);

  return (
    <ChatNotificationContext.Provider
      value={{
        unreadCount,
        refreshUnreadCount,
        decrementUnreadCount,
        incrementUnreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </ChatNotificationContext.Provider>
  );
};

export const useChatNotifications = () => {
  const context = useContext(ChatNotificationContext);
  if (context === undefined) {
    throw new Error('useChatNotifications must be used within a ChatNotificationProvider');
  }
  return context;
};
