import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { ThemedText } from '../../components/themed-text';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTabBar } from '../../src/context/TabBarContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useChatNotifications } from '../../src/context/ChatNotificationContext';
import { ProtectedRoute } from '@/src/components/ProtectedRoute';
import { useLocale } from '../../src/context/LocaleContext';

interface Conversation {
  id: string;
  conversationId: string;
  name: string;
  avatar: string;
  participantName: string;
  participantAvatar: string;
  announcementTitle: string;
  announcementOwnerName: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  unreadCount?: number;
  otherParticipant: { id: string; firstName?: string; lastName?: string; avatar?: string; lastSeen?: string };
  lastSeen?: string;
  announcementOwnerId: string;
  announcementId: string;
}

const TRANSLATIONS = {
  ro: {
    messages: 'Mesaje',
    continueConversations: 'Continuă conversațiile tale',
    buying: 'De cumpărat',
    selling: 'De vândut',
    loadingConversations: 'Se încarcă conversațiile...',
    noConversations: 'Nu ai conversații',
    startWriting: 'E momentul tău Eminescu, începe să scrii!',
  },
  en: {
    messages: 'Messages',
    continueConversations: 'Continue your conversations',
    buying: 'Buying',
    selling: 'Selling',
    loadingConversations: 'Loading conversations...',
    noConversations: 'You have no conversations',
    startWriting: 'It\'s your moment, start writing!',
  },
};

export default function ChatScreen() {
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const t = TRANSLATIONS[locale === 'en' ? 'en' : 'ro'];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { showTabBar } = useTabBar();
  const { refreshUnreadCount, setUnreadCount } = useChatNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationFilter, setConversationFilter] = useState<'selling' | 'buying'>('buying');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(user?.id || null);
  const lastUnreadCountRef = useRef<number>(-1);

  const width = Dimensions.get('window').width;
  const gumballChat = require('../../assets/images/gumballChat.jpg');

  const hexToRgba = (hex: string, alpha = 1) => {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const int = parseInt(full, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  useEffect(() => {
    setUserId(user?.id || null);
  }, [user]);

  // Check incoming route params to auto-redirect to conversation page
  const routeParams = useLocalSearchParams();
  useEffect(() => {
    if (!userId) return;
    const routeConversationId = (routeParams as any)?.conversationId;
    const ownerId = (routeParams as any)?.announcementOwnerId;

    if (routeConversationId || ownerId) {
        // Redirect to the new conversation page
        router.replace({
            pathname: '/conversation',
            params: routeParams as any
        });
    }
  }, [JSON.stringify(routeParams), userId]);

  const resolveAvatarUrl = (src?: string) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    const cleaned = src.replace(/^\.\//, '').replace(/^\//, '');
    const path = cleaned.startsWith('uploads/') ? `/${cleaned}` : `/uploads/${cleaned.replace(/^.*[\\\/]/, '')}`;
    return `${base}${path}`;
  };

  const getAvatarFallback = (name: string) => {
    const initial = name.slice(0, 1).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=355070&color=fff`;
  };

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await api.get(`/api/messages/conversations/${userId}`);
      const conversationsData = response.data;

      const formattedConversations = conversationsData.map((conv: any) => {
        const participantAvatar = resolveAvatarUrl(conv.otherParticipant?.avatar);
        const announcementImg = resolveAvatarUrl(conv.announcementImage);
        const participantName = `${conv.otherParticipant.firstName} ${conv.otherParticipant.lastName}`.trim();
        const resolvedAnnouncementTitle =
          conv.announcementTitle ||
          conv.name ||
          (conv.announcement && (conv.announcement.title || conv.announcement.name)) ||
          conv.title ||
          '(fără titlu)';

        const announcementOwnerName = conv.announcementOwnerName || participantName;
        return {
          id: conv.otherParticipant.id,
          conversationId: conv.conversationId,
          name: resolvedAnnouncementTitle,
          avatar: announcementImg || participantAvatar || '',
          participantName,
          participantAvatar,
          announcementTitle: resolvedAnnouncementTitle,
          announcementOwnerName,
          lastMessage: conv.lastMessage.text,
          time: new Date(conv.lastMessage.createdAt).toLocaleString('ro-RO', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          unread: conv.unread,
          unreadCount: conv.unreadCount || 0,
          otherParticipant: conv.otherParticipant,
          lastSeen: conv.otherParticipant.lastSeen,
          announcementOwnerId: conv.announcementOwnerId,
          announcementId: conv.announcementId,
        };
      });
      setConversations(formattedConversations);
      
      try {
        const localTotal = formattedConversations.reduce((acc: number, c: Conversation) => acc + (c.unreadCount ?? (c.unread ? 1 : 0)), 0);
        if (localTotal !== lastUnreadCountRef.current) {
            setUnreadCount(localTotal);
            lastUnreadCountRef.current = localTotal;
        }
      } catch {}
    } catch (error) {
      console.error('Error loading conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
      refreshUnreadCount();
      showTabBar();
    }, [showTabBar, fetchConversations, refreshUnreadCount])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const unreadConversations = conversations.filter((conv) => conv.unread);
  const readConversations = conversations.filter((conv) => !conv.unread);
  const sellingConversations = conversations.filter((conv) => conv.announcementOwnerId === userId);
  const buyingConversations = conversations.filter((conv) => conv.announcementOwnerId !== userId);
  const filteredConversations = conversationFilter === 'selling' ? sellingConversations : buyingConversations;
  const totalConversations = conversations.length;
  
  // Calculate unread counts per category
  const buyingUnreadCount = buyingConversations.reduce((acc, conv) => acc + (conv.unreadCount || (conv.unread ? 1 : 0)), 0);
  const sellingUnreadCount = sellingConversations.reduce((acc, conv) => acc + (conv.unreadCount || (conv.unread ? 1 : 0)), 0);

  return (
    <ProtectedRoute>
    <View style={[styles.listContainer, { backgroundColor: tokens.colors.bg }]}> 
      <LinearGradient
        colors={
          isDark
            ? ['#f51866', '#00000000']
            : [
                tokens.colors.primary || '#355070',
                hexToRgba(tokens.colors.primary || '#355070', 0.75),
                tokens.colors.bg || '#ffffff',
              ]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.listHeaderGradient, { paddingTop: insets.top + 18 }]}
      >
        <View style={styles.listHeaderTopRow}>
          <View>
            <ThemedText style={styles.listHeaderTitle}>{t.messages} ({totalConversations})</ThemedText>
            <ThemedText style={styles.listHeaderSubtitle}>{t.continueConversations}</ThemedText>
          </View>
        </View>

        <View style={styles.filterSegment}>
          {(['buying', 'selling'] as const).map((filterKey) => {
            const unreadCount = filterKey === 'buying' ? buyingUnreadCount : sellingUnreadCount;
            const hasUnread = unreadCount > 0;
            
            return (
              <TouchableOpacity
                key={filterKey}
                style={[
                  styles.filterButton,
                  conversationFilter === filterKey && styles.filterButtonActive,
                  hasUnread && conversationFilter !== filterKey && styles.filterButtonWithBadge,
                ]}
                activeOpacity={0.85}
                onPress={() => setConversationFilter(filterKey)}
              >
                {hasUnread && conversationFilter !== filterKey && (
                  <View style={styles.filterButtonPulse} />
                )}
                <ThemedText
                  style={[
                    styles.filterButtonText,
                    conversationFilter === filterKey && styles.filterButtonTextActive,
                  ]}
                >
                  {filterKey === 'buying' ? t.buying : t.selling}
                </ThemedText>
                {hasUnread && (
                  <View style={[
                    styles.filterBadge,
                    conversationFilter === filterKey && styles.filterBadgeActive
                  ]}>
                    <ThemedText style={[
                      styles.filterBadgeText,
                      conversationFilter === filterKey && styles.filterBadgeTextActive
                    ]}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      <View style={[styles.listContentWrapper, { backgroundColor: 'transparent', marginTop: 0, paddingTop: 0 }] }>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(64, insets.bottom + 40) }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={isDark ? tokens.colors.primary : '#355070'} />}
          keyboardShouldPersistTaps="handled"
        >
          {loading && conversations.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={isDark ? tokens.colors.primary : '#355070'} />
              <ThemedText style={[styles.loadingText, { color: tokens.colors.muted }]}>{t.loadingConversations}</ThemedText>
            </View>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <TouchableOpacity
                key={conv.conversationId}
                activeOpacity={0.9}
                onPress={() => {
                  // Mark as read locally immediately
                  setConversations(prev => prev.map(c => {
                    if (c.conversationId === conv.conversationId) {
                      return { ...c, unread: false, unreadCount: 0 };
                    }
                    return c;
                  }));

                  router.push({
                    pathname: '/conversation',
                    params: {
                      conversationId: conv.conversationId,
                      senderName: conv.participantName,
                      senderAvatar: conv.participantAvatar,
                      senderId: conv.otherParticipant.id,
                      announcementTitle: conv.announcementTitle,
                      announcementId: conv.announcementId,
                      announcementOwnerId: conv.announcementOwnerId,
                      announcementImage: conv.avatar,
                      unread: conv.unread ? 'true' : 'false',
                      unreadCount: conv.unreadCount ? conv.unreadCount.toString() : '0',
                    }
                  });
                }}
                style={[styles.conversationCardFlat, conv.unread && styles.conversationCardUnread, { borderBottomColor: tokens.colors.border }]}
              >
                {conv.unread && (
                  <LinearGradient
                    colors={isDark ? ['rgba(245, 24, 102, 0.12)', 'rgba(245, 24, 102, 0.04)'] : ['rgba(245, 24, 102, 0.08)', 'rgba(245, 24, 102, 0.02)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.conversationGradientOverlay}
                  />
                )}
                <View style={styles.conversationAvatarWrapper}>
                  {conv.unread && (
                    <View style={[styles.avatarPulseRing, { borderColor: isDark ? '#F51866' : '#F51866' }]} />
                  )}
                  <Image
                    source={{ uri: conv.avatar || conv.participantAvatar || getAvatarFallback(conv.participantName) }}
                    style={styles.conversationAvatar}
                  />
                  {conv.unread && conv.unreadCount && conv.unreadCount > 0 && (
                    <View style={styles.conversationBadge}>
                      <ThemedText style={styles.conversationBadgeText}>
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.conversationInfo}>
                  <View style={styles.conversationRowTop}>
                    <ThemedText style={[styles.conversationName, conv.unread && styles.conversationNameUnread, { color: tokens.colors.text }]} numberOfLines={1}>
                      {conv.participantName}
                    </ThemedText>
                    <ThemedText style={[styles.conversationTime, { color: tokens.colors.muted }]}>{conv.time}</ThemedText>
                  </View>
                  <ThemedText style={[styles.conversationSnippet, conv.unread && styles.conversationSnippetUnread, { color: tokens.colors.muted }]} numberOfLines={1}>
                    {conv.lastMessage}
                  </ThemedText>
                  <ThemedText style={[styles.conversationTopic, { color: tokens.colors.muted }]} numberOfLines={1}>
                    {conv.announcementTitle}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.chatEmptyMain}>
              <View style={styles.chatEmptyIcon}>
                <Image
                  source={gumballChat}
                  style={{ width: Math.min(160, width * 0.6), height: Math.min(320, width * 0.6), borderRadius: 8 }}
                  resizeMode="contain"
                />
              </View>
              <ThemedText style={[styles.chatEmptyText, { color: tokens.colors.text }]}>{t.noConversations} </ThemedText>
              <ThemedText style={[styles.chatEmptySubtitle, { color: tokens.colors.muted }]}>{t.startWriting}</ThemedText>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  listHeaderGradient: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  listHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  listHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  listHeaderSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  filterSegment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.22)',
    padding: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: '#ffffff',
  },
  filterButtonWithBadge: {
    shadowColor: '#F51866',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  filterButtonPulse: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#F51866',
    opacity: 0.3,
  },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F51866',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    zIndex: 10,
  },
  filterBadgeActive: {
    backgroundColor: '#355070',
  },
  filterBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  filterBadgeTextActive: {
    color: '#ffffff',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  filterButtonTextActive: {
    color: '#355070',
  },
  listContentWrapper: {
    flex: 1,
    marginTop: 0,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    paddingTop: 0,
  },
  listContent: {
    paddingBottom: 48,
    paddingHorizontal: 20,
  },
  conversationCardFlat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  conversationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: '#F51866',
    shadowColor: '#F51866',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  conversationGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 0,
  },
  avatarPulseRing: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: '#F51866',
    opacity: 0.4,
  },
  conversationNameUnread: {
    fontWeight: '800',
    color: '#F51866',
  },
  conversationSnippetUnread: {
    fontWeight: '600',
  },
  conversationAvatarWrapper: {
    position: 'relative',
    marginRight: 16,
  },
  conversationAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  conversationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F51866',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  conversationBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  conversationName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#273043',
    marginRight: 12,
  },
  conversationTime: {
    fontSize: 12,
    color: '#7f89a8',
  },
  conversationSnippet: {
    fontSize: 14,
    color: '#46506a',
    marginBottom: 4,
  },
  conversationTopic: {
    fontSize: 13,
    color: '#9aa3c0',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  chatEmptyMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  chatEmptyIcon: {
    marginBottom: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatEmptyText: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -55,
  },
  chatEmptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});