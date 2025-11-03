import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';
import api from '../src/services/api';

interface NotificationItem {
  _id: string;
  senderName?: string;
  preview?: string;
  senderAvatar?: string | null;
  createdAt?: string;
  read?: boolean;
  link?: string;
}

export default function NotificationsScreen() {
  const { tokens, isDark } = useAppTheme();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const userId = user?.id;

  // Ensure avatar URLs are absolute for React Native <Image>
  const resolveUrl = useCallback((u?: string | null) => {
    if (!u) return undefined;
    if (/^https?:\/\//i.test(u)) return u;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    const path = u.startsWith('/') ? u : `/${u}`;
    return `${base}${path}`;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!userId) { setItems([]); return; }
      const res = await api.get(`/api/notifications/${userId}`);
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
    } catch (e: any) {
      // Suppress 404 and 401 errors (user not authenticated or endpoint not found)
      if (e?.response?.status !== 404 && e?.response?.status !== 401) {
        console.error('Error loading notifications:', e);
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const openLink = useCallback(async (link?: string, id?: string) => {
    if (!link) return;
    // Mark as read optimistically
    if (id) {
      setItems(prev => prev.map(it => it._id === id ? { ...it, read: true } : it));
      try { await api.patch(`/api/notifications/${id}/read`); } catch {}
    }
    // Expected formats:
    //  - /chat/:conversationId
    //  - /chat/:conversationId/:messageId
    if (link.startsWith('/chat/')) {
      const parts = link.replace('/chat/', '').split('/').map(p => p.trim()).filter(Boolean);
      const conversationId = parts[0];
      const messageId = parts[1];
      // try to read announcement metadata from the notification item if available
      const notif = id ? items.find(it => it._id === id) : undefined as any;
      const announcementId = notif?.announcementId;
      const announcementOwnerId = notif?.announcementOwnerId;
      const announcementTitle = notif?.announcementTitle;
      try {
        if (conversationId) {
          // Pass conversationId and optional messageId as route params so Chat screen can open the exact message
          const params: any = { conversationId };
          if (messageId) params.messageId = messageId;
          if (announcementOwnerId) params.announcementOwnerId = announcementOwnerId;
          if (announcementId) params.announcementId = announcementId;
          if (announcementTitle) params.announcementTitle = announcementTitle;
          // @ts-ignore
          router.push({ pathname: '/(tabs)/chat', params });
        } else {
          router.push('/(tabs)/chat');
        }
      } catch (e) {
        // fallback
        router.push('/(tabs)/chat');
      }

      // After navigating, remove the notification since user opened the message
      if (id) {
        try {
          await api.delete(`/api/notifications/${id}`);
          setItems(prev => prev.filter(it => it._id !== id));
        } catch (e) {
          // ignore deletion errors
        }
      }
    }
  }, [router]);

  const onDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setItems(prev => prev.filter(it => it._id !== id));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Delete notification failed:', (e as any)?.message);
    }
  }, []);

  const renderItem = ({ item }: { item: NotificationItem }) => {
    return (
      <View style={[styles.notificationItem, {
        backgroundColor: isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(255, 255, 255, 0.98)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        ...Platform.select({
          ios: {
            shadowColor: isDark ? '#000' : '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.4 : 0.15,
            shadowRadius: 12,
          },
          android: {
            elevation: 6,
          },
          web: {
            boxShadow: isDark
              ? '0 4px 20px rgba(0, 0, 0, 0.5)'
              : '0 4px 20px rgba(0, 0, 0, 0.15)',
          },
        }),
      }]}>        
        <View style={styles.notificationMain}>
          <View style={styles.notificationHeader}>
            <View style={[styles.avatarCircle, { 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            }]}>
              <Image
                source={{ uri: resolveUrl(item.senderAvatar) || 'https://ui-avatars.com/api/?name=User&background=355070&color=fff&size=128' }}
                style={styles.avatarImage}
              />
            </View>
            <View style={styles.headerText}>
              {item.senderName ? (
                <Text style={[styles.senderName, { color: isDark ? '#fe85a4' : tokens.colors.primary }]}>{item.senderName}</Text>
              ) : null}
              <Text style={[styles.dateText, { color: tokens.colors.muted }]}>{item.createdAt ? new Date(item.createdAt).toLocaleString('ro-RO') : ''}</Text>
            </View>
            {!item.read && (
              <View style={[styles.unreadBadge, { backgroundColor: tokens.colors.primary }]}>
                <Text style={styles.unreadBadgeText}>Nou</Text>
              </View>
            )}
          </View>
          
          <Text style={[styles.messageText, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]} numberOfLines={3}>
            {item.preview || 'Nu există conținut.'}
          </Text>
          
          {item.link && (
            <TouchableOpacity 
              style={[styles.chatButton, { 
                backgroundColor: tokens.colors.primary,
              }]} 
              onPress={() => openLink(item.link, item._id)}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
              <Text style={styles.chatButtonText}>Deschide chat</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item._id)} activeOpacity={0.6}>
          <View style={[styles.deleteIconCircle, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.03)' }]}>
            <Ionicons name="trash-outline" size={18} color={tokens.colors.muted} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { backgroundColor: tokens.colors.bg, paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>        
        <ActivityIndicator />
      </View>
    );
  }

  return (
  <View style={[styles.screen, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>      
      <View style={styles.header}>        
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]
          }
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tokens.colors.text }]}>Notificări</Text>
      </View>
      <View style={[styles.contentCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
            <Text style={[styles.loadingText, { color: tokens.colors.muted }]}>Se încarcă notificările...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Image source={require('../assets/images/gumballPeace.jpg')} style={styles.emptyImage} resizeMode="cover" />
            <Text style={[styles.emptyText, { color: tokens.colors.muted }]}>Nu ai notificări noi.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 12,
  },
  contentCard: {
    flex: 1,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  loadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    gap: 0,
  },
  emptyImage: {
    width: 160,
    height: 160,
    marginBottom: -44,
    marginTop: 62,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  notificationMain: {
    flex: 1,
    gap: 12,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  senderName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dateText: {
    fontSize: 12,
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteBtn: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  deleteIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
