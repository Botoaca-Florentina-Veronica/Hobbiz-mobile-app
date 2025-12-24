import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image, Platform } from 'react-native';
import { ThemedText } from '../components/themed-text';
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

  // Ensure avatar URLs are absolute
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

  const handleReply = useCallback(async (notificationId: string) => {
    const notification = items.find(it => it._id === notificationId);
    if (!notification) return;

    // Step 1: Mark notification as read optimistically
    setItems(prev => prev.map(it => 
      it._id === notificationId ? { ...it, read: true } : it
    ));

    // Step 2: Use explicit fields from backend if available, or fallback to link parsing
    const notifData = notification as any;
    let conversationId = notifData.conversationId;
    let messageId = null;

    if (!conversationId && notification.link && notification.link.startsWith('/chat/')) {
      const chatPath = notification.link.replace('/chat/', '');
      const parts = chatPath.split('/').map(s => s?.trim()).filter(Boolean);
      conversationId = parts[0];
      if (parts.length > 1) messageId = parts[1];
    }

    if (conversationId) {
      const navParams: any = { conversationId };
      if (messageId) navParams.messageId = messageId;
      
      // Add announcement metadata if available (from enriched notification)
      if (notifData.announcementOwnerId) navParams.announcementOwnerId = notifData.announcementOwnerId;
      if (notifData.announcementId) navParams.announcementId = notifData.announcementId;
      if (notifData.announcementTitle) navParams.announcementTitle = notifData.announcementTitle;
      if (notifData.announcementImage) navParams.announcementImage = notifData.announcementImage;
      // Add sender details to pre-populate the conversation header
      if (notifData.senderName) navParams.senderName = notifData.senderName;
      if (notifData.senderAvatar) navParams.senderAvatar = notifData.senderAvatar;
      if (notifData.senderId) navParams.senderId = notifData.senderId;

      // Step 3: Navigate to chat (replace to avoid stack issues)
      router.replace({ 
        pathname: '/conversation', 
        params: navParams, 
      } as any);

      // Step 4: Clean up notification asynchronously (don't block navigation)
      setTimeout(async () => {
        try {
          await api.delete(`/api/notifications/${notificationId}`);
          setItems(prev => prev.filter(it => it._id !== notificationId));
        } catch (err) {
          console.warn('Failed to delete notification:', err);
          // Optionally revert read status on error
          setItems(prev => prev.map(it => 
            it._id === notificationId ? { ...it, read: false } : it
          ));
        }
      }, 500);
    } else {
      console.warn('Invalid notification link - no conversationId');
    }
  }, [items, router]);

  const onDelete = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setItems(prev => prev.filter(it => it._id !== id));
    } catch (e) {
      console.warn('Delete failed');
    }
  }, []);

  // --- Redirect Logic ---
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  if (!isAuthenticated) return <View style={styles.centerLoading}><ActivityIndicator /></View>;

  // --- RENDER ITEM ---
  const renderItem = ({ item }: { item: NotificationItem }) => {
    const isUnread = !item.read;
    const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
    const textColor = isDark ? '#EEEEEE' : '#1A1A1A';
    const subTextColor = isDark ? '#AAAAAA' : '#666666';

    return (
      <View style={[
        styles.card, 
        { 
          backgroundColor: cardBg,
          shadowColor: isDark ? '#000' : '#888',
          borderLeftWidth: isUnread ? 3 : 0,
          borderLeftColor: tokens.colors.primary,
          // Micșorăm padding-ul stânga dacă avem border, pentru simetrie
          paddingLeft: isUnread ? 13 : 16 
        }
      ]}>
        {/* Container principal flex-row: Avatar Stânga | Conținut Dreapta */}
        <View style={styles.cardInner}>
            
            {/* 1. Avatar Column */}
            <View style={styles.avatarContainer}>
                <Image
                    source={{ uri: resolveUrl(item.senderAvatar) || 'https://ui-avatars.com/api/?name=User&background=random&color=fff' }}
                    style={styles.avatar}
                />
            </View>

            {/* 2. Text Content Column */}
            <View style={styles.contentColumn}>
                
                {/* Header: Name & Date */}
                <View style={styles.headerRow}>
                    <ThemedText style={[styles.senderName, { color: textColor }]} numberOfLines={1}>
                        {item.senderName || 'Sistem'}
                    </ThemedText>
                    <ThemedText style={styles.dateText}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ro-RO', { hour: '2-digit', minute:'2-digit' }) : ''}
                    </ThemedText>
                </View>

                {/* Message Preview - Immediately underneath */}
                <ThemedText style={[styles.messageText, { color: subTextColor }]} numberOfLines={3}>
                    {item.preview || 'Fără conținut.'}
                </ThemedText>

                {/* Action Button (Conditional) */}
                {item.link && (
                    <TouchableOpacity 
                        style={[styles.miniButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f2f4f7' }]}
                        onPress={() => handleReply(item._id)}
                        activeOpacity={0.7}
                    >
                        <ThemedText style={[styles.miniButtonText, { color: tokens.colors.primary }]}>Răspunde</ThemedText>
                        <Ionicons name="arrow-forward" size={14} color={tokens.colors.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* 3. Delete Button (Absolute Top Right) */}
            <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={() => onDelete(item._id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="close" size={16} color={isDark ? '#555' : '#BBB'} />
            </TouchableOpacity>

        </View>
      </View>
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>
      
      {/* Clean Header */}
      <View style={styles.header}>
        <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.headerBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={tokens.colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: tokens.colors.text }]}>Notificări</ThemedText>
        <View style={{ width: 24 }} /> 
      </View>

      {/* List */}
      <View style={styles.listContainer}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.centerContent}>
             <Ionicons name="notifications-off-outline" size={50} color={tokens.colors.muted} style={{ opacity: 0.4, marginBottom: 12 }} />
             <ThemedText style={[styles.emptyText, { color: tokens.colors.muted }]}>Nu ai notificări.</ThemedText>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centerLoading: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 6,
  },
  headerBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5, // Modern tight tracking
  },
  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
  },
  emptyText: {
    fontSize: 15,
  },
  
  // --- CARD STYLES ---
  card: {
    borderRadius: 14, // Slightly softer radius
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    // Soft shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  // Left: Avatar
  avatarContainer: {
    marginRight: 12,
    paddingTop: 2, // Optical alignment with name text
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20, // Circle again, simpler
    backgroundColor: '#eee',
  },

  // Right: Content Column
  contentColumn: {
    flex: 1,
    paddingRight: 20, // Space for delete button
    justifyContent: 'center',
  },
  
  // Name & Date Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2, // Minimal gap before message
  },
  senderName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1, // pushes date to right
    marginRight: 8,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },

  // Message
  messageText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '400',
  },

  // Action Button (Compact)
  miniButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 4,
  },
  miniButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Delete Icon
  deleteBtn: {
    position: 'absolute',
    top: -4,
    right: -6,
    padding: 6,
    opacity: 0.7,
  },
});