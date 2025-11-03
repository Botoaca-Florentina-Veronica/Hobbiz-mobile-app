import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Modal,
  Pressable,
  Keyboard,
  UIManager,
  findNodeHandle,
  Linking,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PermissionsAndroid } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { useTabBar } from '../../src/context/TabBarContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../src/context/ThemeContext';
import api from '../../src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import storage from '../../src/services/storage';
import { useAuth } from '../../src/context/AuthContext';
import { useChatNotifications } from '../../src/context/ChatNotificationContext';
import ImageViewing from '../../src/components/ImageViewer';
// NOTE: Pentru a evita eroarea html2canvas (folosită intern de react-native-view-shot pe web),
// NU importăm direct view-shot; vom crea un loader lazy doar pentru platformele native.
// Dacă vrei snapshot real pentru web mai târziu, putem introduce o implementare fallback bazată pe canvas.
let captureRef: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    captureRef = require('react-native-view-shot').captureRef;
  } catch (e) {
    captureRef = null;
  }
}

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

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  image?: string;
  createdAt: string;
  isRead?: boolean;
  senderInfo?: { firstName?: string; lastName?: string; avatar?: string };
  replyTo?: { messageId: string; senderId: string; senderName: string; text?: string; image?: string };
  reactions?: Array<{ userId: string; emoji: string }>;
  // If true the message has been deleted and should render a placeholder bubble
  deleted?: boolean;
}

export default function ChatScreen() {
  const { tokens, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { hideTabBar, showTabBar } = useTabBar();
  const { refreshUnreadCount, decrementUnreadCount, setUnreadCount } = useChatNotifications();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationFilter, setConversationFilter] = useState<'selling' | 'buying'>('buying');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(user?.id || null);
  const messagesEndRef = useRef<ScrollView>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  // dynamic menu positioning states
  const [menuPosition, setMenuPosition] = useState<null | { x: number; y: number; width: number; height: number; showAbove: boolean }>(null);
  const [menuHeight, setMenuHeight] = useState(0); // reserved for future measuring if needed
  const FIXED_MENU_WIDTH = 300;
  const MENU_ITEM_HEIGHT = 48;
  const MENU_DIVIDER_HEIGHT = StyleSheet.hairlineWidth || 1;
  const [reactionBarWidth, setReactionBarWidth] = useState(0);
  const [reactionBarHeight, setReactionBarHeight] = useState(0);
  const [floatingSnapshot, setFloatingSnapshot] = useState<string | null>(null);
  const [floatingReady, setFloatingReady] = useState(false);
  const [overlayPlacement, setOverlayPlacement] = useState<'above' | 'below'>('above');
  // Hold refs for each bubble to measure its screen position
  const bubbleRefs = useRef<Record<string, View | null>>({});
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<{ uri: string }[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [bubbleLayoutsMap, setBubbleLayoutsMap] = useState<Record<string, {x:number;y:number;width:number;height:number}>>({});
  const [reactionDimsMap, setReactionDimsMap] = useState<Record<string, {width:number;height:number}>>({});
  const [replyTo, setReplyTo] = useState<{ messageId: string; senderId: string; senderName: string; text?: string; image?: string } | null>(null);

  const width = Dimensions.get('window').width;
  // Static local empty-state image (added to mobile-app/assets/images)
  // Use require so Metro bundles the asset for native apps.
  const gumballChat = require('../../assets/images/gumballChat.jpg');
  
  // Page colors (kept for backward compatibility; use tokens below)
  const primaryColor = '#355070';
  const accent = '#F8B195';

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

  // Keep local userId in sync with AuthContext
  useEffect(() => {
    setUserId(user?.id || null);
  }, [user]);

  // Check incoming route params to auto-open a conversation (e.g. from announcement details)
  const routeParams = useLocalSearchParams();
  const handledRouteConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    // New: support navigation from other screens using explicit conversationId and optional messageId
    const routeConversationId = (routeParams as any)?.conversationId;
    const routeMessageId = (routeParams as any)?.messageId;

    // If explicit conversationId is provided, try to open it
    if (routeConversationId) {
      const expectedConversationId = String(routeConversationId);
      if (handledRouteConversationIdRef.current === expectedConversationId) return;

      const found = conversations.find((c) => c.conversationId === expectedConversationId);
      if (found) {
        setSelectedConversation(found);
        handledRouteConversationIdRef.current = expectedConversationId;
      } else {
        // Create a lightweight temporary conversation so the UI opens
        const tempConv: Conversation = {
          id: expectedConversationId,
          conversationId: expectedConversationId,
          name: '(Conversatie)',
          avatar: '',
          participantName: 'Utilizator',
          participantAvatar: '',
          announcementTitle: '',
          announcementOwnerName: 'Utilizator',
          lastMessage: '',
          time: new Date().toLocaleString('ro-RO'),
          unread: false,
          otherParticipant: { id: '', firstName: '', lastName: '', avatar: '' },
          lastSeen: undefined,
          announcementOwnerId: '',
          announcementId: '',
        };
        setSelectedConversation(tempConv);
        handledRouteConversationIdRef.current = expectedConversationId;
      }
      // We still allow the announcementOwnerId flow below to run if present
    }

    // Backward-compatible: support announcementOwnerId route
    const ownerId = (routeParams as any)?.announcementOwnerId;
    const announcementId = (routeParams as any)?.announcementId;
    if (ownerId) {
      // Construct deterministic conversationId similar to backend logic.
      let expectedConversationId = '';
      if (announcementId) {
        expectedConversationId = `${ownerId}-${userId}-${announcementId}`;
      } else {
        expectedConversationId = [String(ownerId), String(userId)].sort().join('-');
      }

      if (handledRouteConversationIdRef.current === expectedConversationId) return;

      const found = conversations.find(
        (c) => c.conversationId === expectedConversationId || (announcementId && c.announcementId === announcementId && c.announcementOwnerId === ownerId)
      );

      if (found) {
        setSelectedConversation(found);
        handledRouteConversationIdRef.current = expectedConversationId;
        return;
      }

      // If not found, create a temporary conversation object so the UI opens a detail view
      const tempConv: Conversation = {
        id: ownerId,
        conversationId: expectedConversationId,
        name: (routeParams as any)?.announcementTitle || '(fără titlu)',
        avatar: (routeParams as any)?.announcementOwnerAvatar || '',
        participantName: `${(routeParams as any)?.announcementOwnerFirstName || ''} ${(routeParams as any)?.announcementOwnerLastName || ''}`.trim() || 'Utilizator',
        participantAvatar: (routeParams as any)?.announcementOwnerAvatar || '',
        announcementTitle: (routeParams as any)?.announcementTitle || '',
        announcementOwnerName: `${(routeParams as any)?.announcementOwnerFirstName || ''} ${(routeParams as any)?.announcementOwnerLastName || ''}`.trim() || 'Utilizator',
        lastMessage: '',
        time: new Date().toLocaleString('ro-RO'),
        unread: false,
        otherParticipant: { id: ownerId, firstName: (routeParams as any)?.announcementOwnerFirstName, lastName: (routeParams as any)?.announcementOwnerLastName, avatar: (routeParams as any)?.announcementOwnerAvatar },
        lastSeen: undefined,
        announcementOwnerId: ownerId,
        announcementId: announcementId || '',
      };

      // Open the temporary conversation but don't mutate the fetched conversations array.
      setSelectedConversation(tempConv);
      handledRouteConversationIdRef.current = expectedConversationId;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeParams, userId, conversations]);

  // If the route contained a messageId, scroll to it after messages load
  useEffect(() => {
    const routeMessageId = (routeParams as any)?.messageId;
    if (!routeMessageId) return;
    if (!messages || messages.length === 0) return;
    const layout = bubbleLayoutsMap[routeMessageId];
    if (layout && messagesEndRef.current && typeof messagesEndRef.current.scrollTo === 'function') {
      // Scroll so the message is visible with some offset (20px)
      try {
        messagesEndRef.current.scrollTo({ y: Math.max(0, layout.y - 20), animated: true });
        // Optionally, mark message as read on server side could be done here
      } catch (e) {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, bubbleLayoutsMap, routeParams]);

  // Fetch conversations
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
      // Update global unread badge locally for instant feedback
      try {
        const localTotal = formattedConversations.reduce((acc: number, c: Conversation) => acc + (c.unreadCount ?? (c.unread ? 1 : 0)), 0);
        setUnreadCount(localTotal);
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

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async () => {
    if (!selectedConversation) return;
    try {
      setLoading(true);
      const response = await api.get(`/api/messages/conversation/${selectedConversation.conversationId}`);
      const raw = (response.data || []) as any[];
      // Enrich replyTo with senderName if backend doesn't include it
      const normalized = raw.map((m: any) => {
        if (m && m.replyTo && !m.replyTo.senderName) {
          const isSelf = String(m.replyTo.senderId || '') === String(userId || '');
          const fallbackName = isSelf ? 'Tu' : (selectedConversation?.participantName || 'Utilizator');
          return { ...m, replyTo: { ...m.replyTo, senderName: fallbackName } };
        }
        return m;
      });
      setMessages(normalized);

      // Mark as read and update badge
      if (selectedConversation.unread && selectedConversation.unreadCount) {
        try {
          await api.put(`/api/messages/conversation/${selectedConversation.conversationId}/mark-read`);
          const unreadAmount = selectedConversation.unreadCount;
          setConversations((prev) =>
            prev.map((c) =>
              c.conversationId === selectedConversation.conversationId ? { ...c, unread: false, unreadCount: 0 } : c
            )
          );
          // Actualizează badge-ul global
          decrementUnreadCount(unreadAmount);
          // Refresh count pentru siguranță
          await refreshUnreadCount();
        } catch (e) {
          console.error('Error marking as read:', e);
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [selectedConversation, userId, decrementUnreadCount, refreshUnreadCount]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation, fetchMessages]);

  // Hide the bottom tab bar when we're inside a conversation detail view.
  // Use counter-based API to avoid races: call hideTabBar when entering and showTabBar when leaving.
  useEffect(() => {
    if (selectedConversation) {
      hideTabBar();
      return () => showTabBar();
    }
    // If not selectedConversation, ensure we show (no-op if already visible)
    showTabBar();
    return;
  }, [selectedConversation, hideTabBar, showTabBar]);

  // Ensure that if the screen loses focus (user navigates away) we close any open conversation
  // and restore the tab bar. This helps when the user navigates via tabs, deep links, or other screens.
  useFocusEffect(
    useCallback(() => {
      // Refresh conversations and unread count when screen gains focus
      fetchConversations();
      refreshUnreadCount();
      
      return () => {
        if (selectedConversation) {
          setSelectedConversation(null);
        }
        showTabBar();
      };
    }, [selectedConversation, showTabBar, fetchConversations, refreshUnreadCount])
  );

  // Handle Android hardware back button when inside a conversation: close it and show tab bar.
  useEffect(() => {
    if (!selectedConversation) return;
    const onBackPress = () => {
      setSelectedConversation(null);
      showTabBar();
      return true; // prevent default behavior
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [selectedConversation, showTabBar]);

  // Scroll to end when messages change
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (selectedConversation) {
      await fetchMessages();
    } else {
      await fetchConversations();
    }
    setRefreshing(false);
  }, [selectedConversation, fetchMessages, fetchConversations]);

  const handleSendMessage = async () => {
    if (!userId || !newMessage.trim() || !selectedConversation) return;
    // Capture replyTo now so clearing state doesn't remove the data we send
    const capturedReply = replyTo;

    const tempMessage: Message = {
      _id: Date.now().toString(),
      conversationId: selectedConversation.conversationId,
      senderId: userId,
      text: newMessage.trim(),
      createdAt: new Date().toISOString(),
      senderInfo: {
        firstName: 'Tu',
        lastName: '',
      },
      ...(capturedReply ? { replyTo: capturedReply } : {}),
    };

    // Optimistic update
    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    // Clear reply preview for the UI but we kept capturedReply for sending/preserving in the message
    setReplyTo(null);

    try {
      const messageData: any = {
        conversationId: selectedConversation.conversationId,
        senderId: userId,
        senderRole: 'cumparator',
        destinatarId: selectedConversation.otherParticipant.id,
        text: newMessage.trim(),
        ...(selectedConversation.announcementId ? { announcementId: selectedConversation.announcementId } : {}),
        ...(capturedReply ? { replyTo: capturedReply } : {}),
      };

      const response = await api.post('/api/messages', messageData);

      if (response.data) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempMessage._id
              ? {
                  // Merge server data but preserve senderInfo and ensure replyTo keeps senderName
                  ...response.data,
                  senderInfo: tempMessage.senderInfo,
                  replyTo: (() => {
                    const serverReply: any = response.data.replyTo || {};
                    const localReply: any = tempMessage.replyTo || {};
                    return {
                      ...(serverReply || {}),
                      // If server didn't include senderName, take it from our optimistic reply
                      ...(localReply.senderName && !serverReply?.senderName ? { senderName: localReply.senderName } : {}),
                    };
                  })(),
                }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
      Alert.alert('Eroare', 'Nu s-a putut trimite mesajul.');
    }
  };

  // Pick image from gallery, request permission first
  const handlePickImagePress = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert('Permisiune', 'Trebuie să permiți accesul la galerie pentru a selecta o imagine.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

  // expo-image-picker v13+ returns { canceled: boolean, assets: [...] }
  if ((result as any).canceled) return;

      // expo-image-picker v13+ returns { assets: [...] }
      const asset: any = (result as any).assets ? (result as any).assets[0] : result;
      if (!asset || !asset.uri) return;

      const uri = asset.uri;
      const fileName = asset.fileName || uri.split('/').pop() || `photo_${Date.now()}.jpg`;
      const extMatch = /\.([a-zA-Z0-9]+)$/.exec(fileName);
      const ext = extMatch ? extMatch[1] : 'jpg';
      const mimeType = asset.type ? `${asset.type}/${ext}` : `image/${ext}`;

      // Capture replyTo now so we can clear UI immediately and keep data for send
      const capturedReplyForImage = replyTo;

      // Optimistic UI: add a temporary message
      const tempMessage: Message = {
        _id: Date.now().toString(),
        conversationId: selectedConversation!.conversationId,
        senderId: userId!,
        image: uri,
        createdAt: new Date().toISOString(),
        senderInfo: { firstName: 'Tu', lastName: '' },
        ...(capturedReplyForImage ? { replyTo: capturedReplyForImage } : {}),
      };

      setMessages((prev) => [...prev, tempMessage]);
      // Clear reply preview in composer now that we've captured it
      setReplyTo(null);

      // Prepare multipart form data
      const form = new FormData();
      // @ts-ignore - react native file
      form.append('image', { uri, name: fileName, type: mimeType });
      form.append('conversationId', selectedConversation!.conversationId);
      form.append('destinatarId', selectedConversation!.otherParticipant.id);
      form.append('senderRole', 'cumparator');
      if (selectedConversation!.announcementId) {
        form.append('announcementId', selectedConversation!.announcementId);
      }
      if (capturedReplyForImage) {
        // send replyTo as JSON string in multipart
        form.append('replyTo', JSON.stringify(capturedReplyForImage));
      }

      try {
        const res = await api.post('/api/messages', form as any, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res?.data) {
          setMessages((prev) => prev.map((m) => {
            if (m._id !== tempMessage._id) return m;
            const server = res.data;
            return {
              ...server,
              senderInfo: tempMessage.senderInfo,
              replyTo: server.replyTo || tempMessage.replyTo,
            };
          }));
        }
      } catch (err) {
        console.error('Upload image error:', err);
        setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
        Alert.alert('Eroare', 'Nu s-a putut trimite imaginea.');
      }
    } catch (err) {
      console.error('handlePickImagePress error:', err);
      Alert.alert('Eroare', 'A apărut o eroare la selectarea imaginii.');
    }
  };

  // Pick a generic file (document). Uses dynamic import for expo-document-picker so the dependency is optional.
  const handlePickFilePress = async () => {
    try {
      // On Android modern SDKs there are different permissions; try to request whichever exist.
      if (Platform.OS === 'android') {
        try {
          // Try the common READ_EXTERNAL_STORAGE permission first
          const perm = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
          if (perm) {
            const granted = await PermissionsAndroid.request(perm);
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              // If not granted, try the newer media permissions if available
              const imgPerm = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES || PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
              const vidPerm = PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO || PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
              const g2 = await PermissionsAndroid.requestMultiple([imgPerm, vidPerm]);
              const ok = Object.values(g2).some((v) => v === PermissionsAndroid.RESULTS.GRANTED);
              if (!ok) {
                Alert.alert('Permisiune', 'Trebuie să permiți accesul la fișiere pentru a selecta un document.');
                return;
              }
            }
          }
        } catch (pErr) {
          // ignore and proceed — DocumentPicker may request its own permissions
          console.warn('Permission request failed, proceeding to picker', pErr);
        }
      }

      let DocumentPicker: any = null;
      try {
        // dynamic import to avoid build-time errors if not installed
        // @ts-ignore
        DocumentPicker = await import('expo-document-picker');
      } catch (e) {
        // If the package isn't installed, offer the user to open the gallery as a fallback
        Alert.alert(
          'Selector fișiere lipsă',
          'Pentru a selecta orice tip de fișier instalează pachetul expo-document-picker. Vrei să deschizi galeria ca alternativă?',
          [
            { text: 'Anulează', style: 'cancel' },
            {
              text: 'Deschide galerie',
              onPress: async () => {
                try {
                  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
                  if ((res as any).canceled) return;
                  const asset: any = (res as any).assets ? (res as any).assets[0] : res;
                  if (!asset || !asset.uri) return;
                  // Reuse the upload flow for files (image) picked from gallery
                  const uri = asset.uri;
                  const fileName = asset.name || asset.fileName || uri.split('/').pop() || `file_${Date.now()}`;
                  const mimeType = asset.type ? `${asset.type}/${(fileName.split('.').pop() || 'jpg')}` : asset.mimeType || 'application/octet-stream';

                  // Capture replyTo and clear it from the composer immediately
                  const capturedReplyForFallback = replyTo;
                  const tempMessage: Message = {
                    _id: Date.now().toString(),
                    conversationId: selectedConversation!.conversationId,
                    senderId: userId!,
                    image: uri,
                    createdAt: new Date().toISOString(),
                    senderInfo: { firstName: 'Tu', lastName: '' },
                    ...(capturedReplyForFallback ? { replyTo: capturedReplyForFallback } : {}),
                  };
                  setMessages((prev) => [...prev, tempMessage]);
                  setReplyTo(null);

                  const form = new FormData();
                  // @ts-ignore
                  form.append('image', { uri, name: fileName, type: mimeType });
                  form.append('conversationId', selectedConversation!.conversationId);
                  form.append('destinatarId', selectedConversation!.otherParticipant.id);
                  form.append('senderRole', 'cumparator');
                  if (selectedConversation!.announcementId) {
                    form.append('announcementId', selectedConversation!.announcementId);
                  }
                  if (capturedReplyForFallback) form.append('replyTo', JSON.stringify(capturedReplyForFallback));

                  const r = await api.post('/api/messages', form as any, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  if (r?.data) {
                    setMessages((prev) => prev.map((m) => {
                      if (m._id !== tempMessage._id) return m;
                      const server = r.data;
                      return {
                        ...server,
                        senderInfo: tempMessage.senderInfo,
                        replyTo: server.replyTo || tempMessage.replyTo,
                      };
                    }));
                  }
                } catch (err) {
                  console.error('Fallback gallery upload failed', err);
                  Alert.alert('Eroare', 'Nu s-a putut încărca fișierul din galerie.');
                }
              },
            },
          ]
        );
        return;
      }

      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!res || res.type !== 'success') return;

      const uri = res.uri;
      const fileName = res.name || uri.split('/').pop() || `file_${Date.now()}`;
      const mimeType = res.mimeType || 'application/octet-stream';

      // Capture replyTo and clear the preview in composer
      const capturedReplyForFile = replyTo;
      const tempMessage: Message = {
        _id: Date.now().toString(),
        conversationId: selectedConversation!.conversationId,
        senderId: userId!,
        image: uri, // reuse image field for backend; backend accepts any uploaded file under 'image'
        createdAt: new Date().toISOString(),
        senderInfo: { firstName: 'Tu', lastName: '' },
        ...(capturedReplyForFile ? { replyTo: capturedReplyForFile } : {}),
      };

      setMessages((prev) => [...prev, tempMessage]);
      setReplyTo(null);

      const form = new FormData();
      // @ts-ignore
      form.append('image', { uri, name: fileName, type: mimeType });
      form.append('conversationId', selectedConversation!.conversationId);
      form.append('destinatarId', selectedConversation!.otherParticipant.id);
      form.append('senderRole', 'cumparator');
      if (selectedConversation!.announcementId) {
        form.append('announcementId', selectedConversation!.announcementId);
      }
  if (capturedReplyForFile) form.append('replyTo', JSON.stringify(capturedReplyForFile));

      try {
        const r = await api.post('/api/messages', form as any, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (r?.data) {
          setMessages((prev) => prev.map((m) => {
            if (m._id !== tempMessage._id) return m;
            const server = r.data;
            return {
              ...server,
              senderInfo: tempMessage.senderInfo,
              replyTo: server.replyTo || tempMessage.replyTo,
            };
          }));
        }
      } catch (err) {
        console.error('Upload file error:', err);
        setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
        Alert.alert('Eroare', 'Nu s-a putut trimite fișierul.');
      }
    } catch (err) {
      console.error('handlePickFilePress error:', err);
      Alert.alert('Eroare', 'A apărut o eroare la selectarea fișierului.');
    }
  };

  // (Removed duplicate placeholder permission-only handlers — full picker implementations above are used.)

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatLastSeen = (lastSeenDate?: string) => {
    if (!lastSeenDate) return 'Necunoscut';

    const now = new Date();
    const lastSeen = new Date(lastSeenDate);
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 5) {
      return 'Online acum';
    } else if (diffInMinutes < 60) {
      return `Activ acum ${diffInMinutes} minute`;
    } else if (diffInHours < 24) {
      return `Activ acum ${diffInHours} ${diffInHours === 1 ? 'oră' : 'ore'}`;
    } else if (diffInDays === 1) {
      return 'Activ ieri';
    } else if (diffInDays < 7) {
      return `Activ acum ${diffInDays} zile`;
    } else {
      return lastSeen.toLocaleDateString('ro-RO', {
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const resolveAvatarUrl = (src?: string) => {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    const cleaned = src.replace(/^\.\//, '').replace(/^\//, '');
    return cleaned.startsWith('uploads/') ? `/${cleaned}` : `/uploads/${cleaned.replace(/^.*[\\\/]/, '')}`;
  };

  const handleOpenImage = useCallback(
    (uri?: string) => {
      if (!uri) return;
      if (Platform.OS === 'web') {
        Linking.openURL(uri).catch((err) => console.error('Nu s-a putut deschide imaginea în browser.', err));
        return;
      }

      const imageMessages = messages.filter((m) => !!m.image);
      const gallery = imageMessages.length > 0 ? imageMessages.map((m) => ({ uri: m.image! })) : [{ uri }];
      const initialIndex = imageMessages.findIndex((m) => m.image === uri);

      setImageViewerImages(gallery);
      setImageViewerIndex(initialIndex >= 0 ? initialIndex : 0);
      setImageViewerVisible(true);
    },
    [messages]
  );

  const handleCloseImageViewer = useCallback(() => {
    setImageViewerVisible(false);
    setTimeout(() => {
      setImageViewerImages([]);
      setImageViewerIndex(0);
    }, 250);
  }, []);

  const getAvatarFallback = (name: string) => {
    const initial = name.slice(0, 1).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=355070&color=fff`;
  };

  const handleLongPressMessage = (message: Message) => {
    // Haptic feedback
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    // Ensure the keyboard doesn't steal vertical space when opening the menu
    try { Keyboard.dismiss(); } catch {}
    setFloatingSnapshot(null);
    setFloatingReady(false);
    const ref = bubbleRefs.current[message._id];
    if (!ref) {
      setSelectedMessage(message);
      setMenuPosition(null);
      setContextMenuVisible(true);
      return;
    }
    const node = findNodeHandle(ref);
    if (!node) {
      setSelectedMessage(message);
      setMenuPosition(null);
      setContextMenuVisible(true);
      return;
    }
    // First measurement (immediate)
    UIManager.measureInWindow(node, (x, y, width, height) => {
      const screenHeight = Dimensions.get('window').height;
      const spaceAbove = y - insets.top;
      const spaceBelow = screenHeight - (y + height) - insets.bottom;
      const estimatedMenuHeight = 320; // rough estimate
      const showAbove = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
      // set initial values so UI can render quickly
      setSelectedMessage(message);
      setMenuPosition({ x, y, width, height, showAbove });
      setContextMenuVisible(true);
      if (!captureRef) {
        // Fallback clone will be used; consider it ready immediately
        setFloatingReady(true);
      }
      // Re-measure after a very short delay to get a stabilized height/width
      // (addresses race conditions where layout/line-wrapping can change slightly)
      setTimeout(() => {
        try {
          UIManager.measureInWindow(node, (x2, y2, w2, h2) => {
            const screenH2 = Dimensions.get('window').height;
            const spaceAbove2 = y2 - insets.top;
            const spaceBelow2 = screenH2 - (y2 + h2) - insets.bottom;
            const showAbove2 = spaceBelow2 < estimatedMenuHeight && spaceAbove2 > spaceBelow2;
            setMenuPosition({ x: x2, y: y2, width: w2, height: h2, showAbove: showAbove2 });
          });
          // Try to capture a pixel-perfect snapshot of the original bubble so we can
          // render it above the BlurView (avoids blurring the message). This only
          // works on native when captureRef is available; otherwise we'll fallback
          // to rendering a cloned view above the blur.
          if (captureRef) {
            try {
              // captureRef can fail if view transiently changes; ignore failures
              // @ts-ignore
              captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile' })
                .then((uri: string) => {
                  setFloatingSnapshot(uri as string);
                  setFloatingReady(true);
                })
                .catch(() => {
                  // ignore, fallback handled in render
                  setFloatingReady(true);
                });
            } catch (e) {
              // ignore
              setFloatingReady(true);
            }
          } else {
            // captureRef unavailable → fallback clone considered ready already (if not yet set)
            setFloatingReady(true);
          }
        } catch (e) {
          // ignore failed re-measure
          setFloatingReady(true);
        }
      }, 45);
    });
  };

  const closeContextMenu = () => {
    setContextMenuVisible(false);
    setShowReactionPicker(false);
    setMenuPosition(null);
    setFloatingSnapshot(null);
    setFloatingReady(false);
    setTimeout(() => setSelectedMessage(null), 250);
  };

  // Recompute where to place reaction bar + context menu so they NEVER overlap bubble
  useEffect(() => {
    if (!menuPosition || !contextMenuVisible) return;
  const screenH = Dimensions.get('window').height;
  const gap = 8; // base gap between elements
  const rbH = reactionBarHeight || 48; // fallback estimate
  const menuCountBase = 6; // Star, Reply, Forward, Copy, Speak, Report
  const includeDelete = !!(selectedMessage && String(selectedMessage.senderId) === String(userId) && !selectedMessage.deleted);
  const mCount = menuCountBase + (includeDelete ? 1 : 0);
  const mH = mCount * MENU_ITEM_HEIGHT + Math.max(0, mCount - 1) * MENU_DIVIDER_HEIGHT;
    const spaceAbove = menuPosition.y - insets.top;
    const spaceBelow = screenH - (menuPosition.y + menuPosition.height) - insets.bottom;
    const neededTotal = rbH + mH + gap * 3; // reaction bar + menu + gaps

    if (spaceAbove >= neededTotal) {
      setOverlayPlacement('above');
      return;
    }
    if (spaceBelow >= neededTotal) {
      setOverlayPlacement('below');
      return;
    }
    // Not enough continuous space on either side for full stack.
    // Choose side with more space; elements will compress toward bubble but keep gap.
    if (spaceAbove >= spaceBelow) {
      setOverlayPlacement('above');
    } else {
      setOverlayPlacement('below');
    }
  }, [menuPosition, reactionBarHeight, menuHeight, insets.top, insets.bottom, contextMenuVisible]);

  const handleReaction = async (emoji: string) => {
    if (!selectedMessage || !userId) return;
    // Keep a snapshot to rollback in case of server error
    const previousMessages = messages;
    try {
      // Optimistic update
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === selectedMessage._id) {
            const reactions = m.reactions || [];
            const existingIdx = reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);
            if (existingIdx >= 0) {
              // Remove reaction
              return { ...m, reactions: reactions.filter((_, i) => i !== existingIdx) };
            } else {
              // Add reaction
              return { ...m, reactions: [...reactions, { userId, emoji }] };
            }
          }
          return m;
        })
      );
      closeContextMenu();

      // Send reaction to server (toggle/update)
      const res = await api.post(`/api/messages/${selectedMessage._id}/react`, { emoji });
      // Server returns the updated message object — sync local state with authoritative response
      const updatedMessage = res.data;
      if (updatedMessage && updatedMessage._id) {
        setMessages((prev) => prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)));
      }
    } catch (err) {
      console.error('Reaction error:', err);
      // Rollback optimistic update
      try {
        setMessages(previousMessages || []);
      } catch (e) {
        // ignore
      }
      // Inform user (non-blocking)
      try {
        Alert.alert('Eroare', 'Nu s-a putut salva reacția. Verifică conexiunea și încearcă din nou.');
      } catch (e) {}
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    // Only allow actual delete if current user is the sender
    if (String(selectedMessage.senderId) !== String(userId)) {
      Alert.alert('Nu poți șterge', 'Nu ești proprietarul acestui mesaj. Poți folosi Raportează dacă este neadecvat.');
      closeContextMenu();
      return;
    }

    if (selectedMessage.deleted) {
      Alert.alert('Mesaj deja șters', 'Acest mesaj este deja marcat ca șters.');
      closeContextMenu();
      return;
    }

    Alert.alert(
      'Șterge mesaj',
      'Ești sigur că vrei să ștergi acest mesaj?',
      [
        { text: 'Anulează', style: 'cancel' },
        {
          text: 'Șterge',
          style: 'destructive',
          onPress: async () => {
            try {
              // Optimistically mark message as deleted so it stays in the list but shows a placeholder
              setMessages((prev) => prev.map((m) => (m._id === selectedMessage._id ? { ...m, deleted: true, text: undefined, image: undefined } : m)));
              closeContextMenu();
              // Try deleting on server but don't remove locally if it fails; server may physically delete, but UI keeps a placeholder
              try {
                await api.delete(`/api/messages/${selectedMessage._id}`);
              } catch (serverErr) {
                // If server deletion fails, keep local deleted flag — it represents that user removed it locally.
                console.warn('Server delete failed, message kept as deleted locally', serverErr);
              }
            } catch (err) {
              console.error('Delete error:', err);
            }
          },
        },
      ]
    );
  };

  const handleCopyMessage = async () => {
    if (!selectedMessage) return;
    try {
      if (selectedMessage.text) {
        await Clipboard.setStringAsync(selectedMessage.text);
        Alert.alert('Copiat', 'Mesajul a fost copiat.');
        closeContextMenu();
        return;
      }
      if (selectedMessage.image) {
        await Clipboard.setStringAsync(selectedMessage.image);
        Alert.alert('Copiat', 'Link-ul imaginii a fost copiat.');
        closeContextMenu();
        return;
      }
      Alert.alert('Nimic de copiat', 'Mesajul nu conține text sau imagine ce poate fi copiat.');
      closeContextMenu();
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  const handleReplyMessage = () => {
    if (!selectedMessage) return;
    
    // Determine sender name
    const senderName = selectedMessage.senderId === userId 
      ? 'Tu'
      : selectedConversation?.participantName || 'Utilizator';
    
    setReplyTo({
      messageId: selectedMessage._id,
      senderId: selectedMessage.senderId,
      senderName,
      text: selectedMessage.text,
      image: selectedMessage.image,
    });
    
    closeContextMenu();
  };

  const handleForwardMessage = () => {
    // TODO: implement forward functionality
    Alert.alert('Forward', 'Funcționalitate în curând');
    closeContextMenu();
  };

  const handleStarMessage = () => {
    if (!selectedMessage || !userId) return;
    (async () => {
      try {
        const key = `starredMessages:${userId}`;
        console.log('[star] key=', key, 'messageId=', selectedMessage._id);
        const raw = await storage.getItemAsync(key);
        const list = raw ? JSON.parse(raw) : [];
        const exists = list.find((s: any) => String(s._id) === String(selectedMessage._id));
        if (exists) {
          const updated = list.filter((s: any) => String(s._id) !== String(selectedMessage._id));
          await storage.setItemAsync(key, JSON.stringify(updated));
          console.log('[star] removed, newCount=', updated.length);
          Alert.alert('Removed', 'Mesajul a fost eliminat din favorite.');
        } else {
          // store minimal message snapshot
          const snapshot = {
            _id: selectedMessage._id,
            conversationId: selectedMessage.conversationId,
            senderId: selectedMessage.senderId,
            text: selectedMessage.text,
            image: selectedMessage.image,
            createdAt: selectedMessage.createdAt,
          };
          list.push(snapshot);
          await storage.setItemAsync(key, JSON.stringify(list));
          const confirmRaw = await storage.getItemAsync(key);
          const confirmList = confirmRaw ? JSON.parse(confirmRaw) : [];
          console.log('[star] saved, newCount=', confirmList.length);
          Alert.alert('Saved', `Mesajul a fost marcat cu stea. (${confirmList.length} total)`);
        }
      } catch (err) {
        console.error('Star error:', err);
        Alert.alert('Eroare', 'Nu s-a putut actualiza mesajele favorite.');
      } finally {
        closeContextMenu();
      }
    })();
  };

  const handleReportMessage = () => {
    Alert.alert('Raportează mesaj', 'Vrei să raportezi acest mesaj?', [
      { text: 'Anulează', style: 'cancel' },
      { text: 'Raportează', onPress: () => {
        // TODO: report to server
        Alert.alert('Raportat', 'Mesajul a fost raportat.');
        closeContextMenu();
      }},
    ]);
  };

  const unreadConversations = conversations.filter((conv) => conv.unread);
  const readConversations = conversations.filter((conv) => !conv.unread);
  const sellingConversations = conversations.filter((conv) => conv.announcementOwnerId === userId);
  const buyingConversations = conversations.filter((conv) => conv.announcementOwnerId !== userId);
  const filteredConversations = conversationFilter === 'selling' ? sellingConversations : buyingConversations;
  const totalConversations = conversations.length;

  // If conversation is selected, show chat view
  if (selectedConversation) {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: tokens.colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Clean header with back button, seller avatar + name, and announcement preview below */}
        <View style={[
          styles.chatHeaderClean,
          {
            paddingTop: insets.top + 12,
            backgroundColor: tokens.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: tokens.colors.border,
          },
        ]}>
          {/* Center block: avatar + name (centered), announcement preview below */}
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <TouchableOpacity onPress={() => setSelectedConversation(null)} style={styles.backBtnClean}>
                <Ionicons name="arrow-back" size={26} color={tokens.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const otherId = selectedConversation.id || selectedConversation.otherParticipant?.id;
                  if (!otherId) return;
                  try {
                    router.push(`/profile?userId=${encodeURIComponent(String(otherId))}`);
                  } catch (e) {
                    // ignore navigation errors
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center' }}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: selectedConversation.participantAvatar || getAvatarFallback(selectedConversation.participantName) }}
                  style={styles.headerAvatarClean}
                />
                <Text style={[styles.headerNameClean, isDark ? styles.headerNameCleanDark : undefined]}>{selectedConversation.participantName}</Text>
              </TouchableOpacity>
            </View>

            {/* thin separator between title row and announcement preview */}
            <View style={[styles.headerSeparator, isDark ? styles.headerSeparatorDark : undefined]} />

            <TouchableOpacity
              style={styles.announcementRow}
              activeOpacity={0.85}
              onPress={() => {
                const aid = selectedConversation?.announcementId;
                if (!aid) return;
                router.push(`/announcement-details?id=${encodeURIComponent(aid)}`);
              }}
            >
              <Image
                source={{ uri: selectedConversation.avatar || selectedConversation.participantAvatar || getAvatarFallback(selectedConversation.participantName) }}
                style={styles.announcementThumb}
              />
              <View style={styles.announcementInfo}>
                <Text style={[styles.announcementTitle, isDark ? styles.announcementTitleDark : undefined]} numberOfLines={1}>{selectedConversation.announcementTitle || 'Anunț'}</Text>
                {selectedConversation.announcementId ? (
                  <Text style={[styles.announcementId, isDark ? styles.announcementIdDark : undefined]}>ID: {selectedConversation.announcementId}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.moreBtn, styles.moreBtnTop, { top: insets.top + 12 }]}>
            <Ionicons name="ellipsis-vertical" size={22} color={tokens.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={messagesEndRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />}
        >
          {loading && messages.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tokens.colors.primary} />
                <Text style={[styles.loadingText, { color: tokens.colors.muted }]}>Se încarcă mesajele...</Text>
              </View>
          ) : messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={tokens.colors.border} />
                <Text style={[styles.emptyText, { color: tokens.colors.muted }]}>Nicio conversație încă. Scrie primul mesaj!</Text>
              </View>
          ) : (
            <>
              {messages.map((message, idx) => {
                const isOwn = message.senderId === userId;
                const prevMessage = idx > 0 ? messages[idx - 1] : null;
                const showDateSeparator = 
                  !prevMessage || 
                  new Date(message.createdAt).toLocaleDateString() !== new Date(prevMessage.createdAt).toLocaleDateString();

                // Only show the time for the last message in a run of messages that share the same minute
                // BUT only collapse/hide the time when the next message is from the same sender.
                const timeForMessage = formatTime(message.createdAt);
                const nextMessage = idx < messages.length - 1 ? messages[idx + 1] : null;
                const nextTime = nextMessage ? formatTime(nextMessage.createdAt) : null;
                const sameSenderAsNext = !!nextMessage && nextMessage.senderId === message.senderId;
                const sameTimeAsNext = !!nextMessage && nextTime === timeForMessage;
                // showTime is true when there is no next message OR the next message either has a different time
                // or is from a different sender. We only hide the time when both time and sender match.
                const showTime = !nextMessage || !(sameTimeAsNext && sameSenderAsNext);
                // compactBelow reduces spacing only when next message is from the same sender and same minute
                const compactBelow = sameTimeAsNext && sameSenderAsNext;

                return (
                  <View key={message._id}>
                    {/* Date separator */}
                    {showDateSeparator && (
                      <View style={styles.dateSeparator}>
                        <View style={styles.dateLine} />
                        <Text style={styles.dateSeparatorText}>
                          {new Date(message.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }).toUpperCase()}
                        </Text>
                        <View style={styles.dateLine} />
                      </View>
                    )}

                    {/* Message bubble */}
                    <View style={[styles.messageRow, isOwn && styles.messageRowOwn, compactBelow && styles.messageRowCompact]}>
                      <View style={[styles.messageGroup, { position: 'relative' }]}>
                        {/* Reactions display above message - absolutely positioned next to bubble */}
                        {message.reactions && message.reactions.length > 0 && (() => {
                          // Group reactions by emoji and count how many of each
                          const counts: Record<string, number> = {};
                          (message.reactions || []).forEach((r) => {
                            counts[r.emoji] = (counts[r.emoji] || 0) + 1;
                          });
                          const entries = Object.keys(counts).map((emoji) => ({ emoji, count: counts[emoji] }));
                          // sort by count desc then emoji for deterministic order
                          entries.sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
                          const visible = entries.slice(0, 3);
                          const more = Math.max(0, entries.length - visible.length);
                          // Simple absolute placement relative to the bubble
                          const absStyle: ViewStyle = isOwn
                            ? { position: 'absolute', right: 12, top: -36 }
                            : { position: 'absolute', left: 12, top: -36 };
                          return (
                            <View
                              onLayout={(e) => {
                                const { width, height } = e.nativeEvent.layout;
                                setReactionDimsMap((prev) => ({ ...prev, [message._id]: { width, height } }));
                              }}
                              style={[styles.reactionsContainer, absStyle]}
                            >
                              {visible.map((e) => (
                                <View key={`r-${e.emoji}`} style={styles.reactionBubble}>
                                  <Text style={styles.reactionEmoji}>{e.emoji}</Text>
                                  {e.count > 1 && <Text style={styles.reactionCount}>{e.count}</Text>}
                                </View>
                              ))}
                              {more > 0 && (
                                <View style={styles.reactionBubble}>
                                  <Text style={styles.reactionCount}>+{more}</Text>
                                </View>
                              )}
                            </View>
                          );
                        })()}
                        <Pressable
                          ref={(r) => { bubbleRefs.current[message._id] = r; }}
                          onLayout={(e) => {
                            const { x, y, width, height } = e.nativeEvent.layout;
                            setBubbleLayoutsMap((prev) => ({ ...prev, [message._id]: { x, y, width, height } }));
                          }}
                          onLongPress={() => handleLongPressMessage(message)}
                          delayLongPress={400}
                          style={[
                            styles.messageBubbleClean,
                            isOwn
                              ? {
                                  backgroundColor: isDark ? tokens.colors.primary : '#d1e7ff',
                                  marginLeft: 'auto',
                                  marginRight: 12,
                                  borderTopLeftRadius: 20,
                                  borderTopRightRadius: 20,
                                  borderBottomLeftRadius: 20,
                                  borderBottomRightRadius: 6,
                                }
                              : {
                                  backgroundColor: tokens.colors.elev,
                                  marginLeft: 12,
                                  marginRight: 'auto',
                                  borderTopLeftRadius: 20,
                                  borderTopRightRadius: 20,
                                  borderBottomLeftRadius: 6,
                                  borderBottomRightRadius: 20,
                                },
                          ]}
                        >
                          {message.deleted ? (
                            <Text style={[styles.messageTextClean, { color: tokens.colors.muted, fontStyle: 'italic' }]}>acest mesaj a fost șters</Text>
                          ) : (
                            <>
                              {/* Reply preview in message bubble (only when replyTo.messageId exists) */}
                              {message.replyTo && message.replyTo.messageId && (
                                <View style={[styles.replyInBubble, { 
                                  backgroundColor: isOwn 
                                    ? (isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)') 
                                    : 'rgba(0,0,0,0.05)',
                                  borderLeftColor: tokens.colors.primary 
                                }]}>
                                  <Text style={[styles.replyInBubbleName, { 
                                    color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.primary 
                                  }]}>
                                    {message.replyTo.senderName}
                                  </Text>
                                  {message.replyTo.text && (
                                    <Text 
                                      style={[styles.replyInBubbleText, { 
                                        color: isOwn && isDark ? 'rgba(255,255,255,0.7)' : tokens.colors.muted 
                                      }]} 
                                      numberOfLines={1}
                                    >
                                      {message.replyTo.text}
                                    </Text>
                                  )}
                                  {message.replyTo.image && (
                                    <View style={styles.replyInBubbleImageRow}>
                                      <Ionicons 
                                        name="image-outline" 
                                        size={14} 
                                        color={isOwn && isDark ? 'rgba(255,255,255,0.7)' : tokens.colors.muted} 
                                      />
                                      <Text 
                                        style={[styles.replyInBubbleText, { 
                                          color: isOwn && isDark ? 'rgba(255,255,255,0.7)' : tokens.colors.muted,
                                          marginLeft: 4 
                                        }]}
                                      >
                                        Fotografie
                                      </Text>
                                    </View>
                                  )}
                                </View>
                              )}
                              
                              {message.text && (
                                <Text style={[styles.messageTextClean, { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.text }] }>
                                  {message.text}
                                </Text>
                              )}
                              {message.image && (
                                <TouchableOpacity
                                  activeOpacity={0.85}
                                  onPress={() => handleOpenImage(message.image)}
                                >
                                  <Image source={{ uri: message.image }} style={[styles.messageImage, { borderRadius: 12 }]} resizeMode="cover" />
                                </TouchableOpacity>
                              )}
                              {isOwn && (
                                <Ionicons
                                  name="checkmark-done"
                                  size={15}
                                  color={message.isRead ? (isDark ? '#ffabb7' : '#34B7F1') : tokens.colors.muted}
                                  style={styles.tickIconClean}
                                />
                              )}
                            </>
                          )}
                        </Pressable>
                        {/* Time + checkmarks below bubble (only shown at end of same-time group) */}
                        {showTime && (
                          <View 
                            style={[
                              styles.messageTimestamp, 
                              isOwn ? { alignSelf: 'flex-end', marginRight: 12 } : { alignSelf: 'flex-start', marginLeft: 12 }
                            ]}
                          >
                            <Text style={[styles.messageTimeClean, { color: tokens.colors.muted }] }>
                              {timeForMessage}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>

    {/* Reply Preview (only when replying to a real message) */}
    {replyTo && replyTo.messageId && (
            <View style={[styles.replyPreviewContainer, { backgroundColor: tokens.colors.elev, borderTopColor: tokens.colors.border }]}>
              <View style={[styles.replyPreviewBar, { backgroundColor: tokens.colors.primary }]} />
              <View style={styles.replyPreviewContent}>
                <Text style={[styles.replyPreviewName, { color: tokens.colors.primary }]}>
                  {replyTo.senderName}
                </Text>
                {replyTo.text && (
                  <Text style={[styles.replyPreviewText, { color: tokens.colors.muted }]} numberOfLines={1}>
                    {replyTo.text}
                  </Text>
                )}
                {replyTo.image && (
                  <View style={styles.replyPreviewImageRow}>
                    <Ionicons name="image-outline" size={16} color={tokens.colors.muted} />
                    <Text style={[styles.replyPreviewText, { color: tokens.colors.muted, marginLeft: 4 }]}>
                      Fotografie
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyPreviewClose}>
                <Ionicons name="close" size={20} color={tokens.colors.muted} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={[styles.inputContainerClean, { 
            backgroundColor: tokens.colors.surface, 
            borderTopWidth: 1, 
            borderTopColor: tokens.colors.border,
          }]}>
          <TouchableOpacity style={styles.inputIcon} onPress={handlePickImagePress}>
            <Ionicons name="image-outline" size={26} color={tokens.colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputIcon} onPress={handlePickFilePress}>
            <Ionicons name="attach-outline" size={26} color={tokens.colors.muted} />
          </TouchableOpacity>
          <TextInput
            style={[styles.inputClean, isDark ? styles.inputCleanDark : undefined]}
            placeholder="Scrie mesajul tău..."
            placeholderTextColor={tokens.colors.placeholder}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            style={[styles.sendBtnClean, { opacity: newMessage.trim() ? 1 : 0.4 }]}
          >
            <Ionicons name="send" size={20} color={isDark ? '#F51866' : tokens.colors.primary} />
          </TouchableOpacity>
          </View>

        <ImageViewing
          images={imageViewerImages}
          imageIndex={imageViewerIndex}
          visible={imageViewerVisible}
          onRequestClose={handleCloseImageViewer}
          onImageIndexChange={setImageViewerIndex}
          swipeToCloseEnabled
          doubleTapToZoomEnabled
          backgroundColor="rgba(0,0,0,0.96)"
          HeaderComponent={() => (
            <View style={[styles.imageViewerHeader, { paddingTop: insets.top + 12 }] }>
              <TouchableOpacity
                onPress={handleCloseImageViewer}
                activeOpacity={0.85}
                style={styles.imageViewerCloseButton}
              >
                <Ionicons name="close" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          )}
          // No FooterComponent to avoid any index/count overlay
        />

        {/* Dynamic Context Menu Modal */}
  <Modal visible={contextMenuVisible} transparent animationType="none" onRequestClose={closeContextMenu}>
          <Pressable style={styles.modalOverlay} onPress={closeContextMenu}>
            <BlurView
              intensity={80}
              tint="dark"
              style={StyleSheet.absoluteFill}
              {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : { style: [StyleSheet.absoluteFill, { pointerEvents: 'none' }] })}
            />
            {selectedMessage && menuPosition && (
              <>
                {/* Floating snapshot OR fallback clone (unblurred) */}
                {floatingReady && floatingSnapshot ? (
                  <View
                    style={[
                      styles.floatingBubble,
                      { top: menuPosition.y, left: menuPosition.x, width: menuPosition.width, height: menuPosition.height, zIndex: 30 },
                      Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined,
                    ]}
                    {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : {})}
                  >
                    <Image source={{ uri: floatingSnapshot }} style={{ width: menuPosition.width, height: menuPosition.height, borderRadius: 12 }} resizeMode="cover" />
                  </View>
                ) : null}
                {/* When snapshot unavailable (e.g., web), keep original bubble visible */}

                {/* Reaction bar (unblurred) */}
                <View
                  onLayout={(e) => { setReactionBarWidth(e.nativeEvent.layout.width); setReactionBarHeight(e.nativeEvent.layout.height); }}
                  style={[
                    styles.reactionBarAbsolute,
                    { zIndex: 40 },
                    (() => {
                      const screenW = Dimensions.get('window').width;
                      const estWidth = reactionBarWidth || 280;
                      const rbH = reactionBarHeight || 48;
                      const gap = 8;
                      // Place reaction bar on the opposite side of the context menu so both are visible
                      const desiredBarSide = overlayPlacement === 'above' ? 'below' : 'above';
                      let top: number;
                      if (desiredBarSide === 'above') {
                        // place reaction bar above the bubble
                        top = menuPosition.y - rbH - gap;
                        // clamp to not go off the top
                        if (top < insets.top + gap) top = insets.top + gap;
                        // if still overlapping bubble due to tiny space, push it below instead
                        if (top + rbH > menuPosition.y) top = menuPosition.y + menuPosition.height + gap;
                      } else {
                        // place reaction bar below the bubble
                        top = menuPosition.y + menuPosition.height + gap;
                        const screenBottomLimit = Dimensions.get('window').height - insets.bottom - rbH - gap;
                        if (top > screenBottomLimit) {
                          // clamp to bottom
                          top = Math.max(insets.top + gap, screenBottomLimit);
                        }
                        // if overlaps bubble (very rare), push above
                        if (top < menuPosition.y + menuPosition.height + gap) {
                          const alt = menuPosition.y - rbH - gap;
                          if (alt >= insets.top + gap) top = alt;
                        }
                      }
                      const left = Math.max(8, Math.min(menuPosition.x + menuPosition.width / 2 - estWidth / 2, screenW - estWidth - 8));
                      return { top, left };
                    })(),
                    // theme-aware overrides
                    { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)', shadowOpacity: isDark ? 0.08 : 0.15 },
                  ]}
                >
                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                    <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={[styles.quickReactionButton, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }]}>
                      <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => setShowReactionPicker((p) => !p)} style={[styles.quickReactionButton, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }]}>
                    <Ionicons name={showReactionPicker ? 'close' : 'add-circle-outline'} size={24} color={isDark ? tokens.colors.muted : '#666'} />
                  </TouchableOpacity>
                  {showReactionPicker && (
                    <View style={[styles.reactionPickerDropdown, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }] }>
                      {['🤩','😎','🔥','🎉','😔','🙌','👌','🥳','🤔','🤯'].map((emoji) => (
                          <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={[styles.reactionPickerButton, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }]}>
                            <Text style={styles.reactionPickerEmoji}>{emoji}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}
                </View>

                {/* Context menu (unblurred) */}
                <View
                  style={[
                    styles.contextMenuAbsolute,
                    { zIndex: 50 },
                    (() => {
                      const win = Dimensions.get('window');
                      const gap = 8; // match reaction bar spacing to keep both close to the bubble
                      // Exact menu height based on current items (Delete shown only for own, non-deleted messages)
                      const baseCount = 6; // Star, Reply, Forward, Copy, Speak, Report
                      const showDelete = !!(selectedMessage && String(selectedMessage.senderId) === String(userId) && !selectedMessage.deleted);
                      const count = baseCount + (showDelete ? 1 : 0);
                      const desiredH = count * MENU_ITEM_HEIGHT + Math.max(0, count - 1) * MENU_DIVIDER_HEIGHT;
                      const desiredW = FIXED_MENU_WIDTH;
                      let top: number;
                      if (overlayPlacement === 'above') {
                        // place the context menu directly above the bubble with small gap
                        top = menuPosition.y - desiredH - gap;
                        // if that places it off-screen above, clamp to top
                        if (top < insets.top + 8) top = insets.top + 8;
                      } else {
                        // place the context menu directly below the bubble with small gap
                        top = menuPosition.y + menuPosition.height + gap;
                        // clamp so it doesn't overflow bottom
                        if (top + desiredH + insets.bottom > win.height) top = Math.max(insets.top + 8, win.height - insets.bottom - desiredH - 8);
                      }
                      const left = Math.max(8, Math.min(menuPosition.x, win.width - desiredW - 8));
                      return { top, left, width: desiredW, height: desiredH };
                    })(),
                  // theme sensitive background/shadow
                  , { backgroundColor: isDark ? tokens.colors.surface : '#ffffff', shadowOpacity: isDark ? 0.18 : 0.3 }
                  ]}
                >
                  <View
                    style={[
                      { width: FIXED_MENU_WIDTH, height: '100%', overflow: 'hidden' },
                      Platform.OS === 'web' ? { pointerEvents: 'box-none' as any } : undefined,
                    ]}
                    {...(Platform.OS !== 'web' ? { pointerEvents: 'box-none' } : {})}
                  >
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ backgroundColor: isDark ? tokens.colors.surface : '#ffffff' }}
                      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                      <View style={[styles.contextMenu, { backgroundColor: isDark ? tokens.colors.surface : '#ffffff' }] }>
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleStarMessage}>
                      <Text style={[styles.contextMenuText, { color: tokens.colors.text }]}>Star</Text>
                      <Ionicons name="star-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleReplyMessage}>
                      <Text style={[styles.contextMenuText, { color: tokens.colors.text }]}>Reply</Text>
                      <Ionicons name="arrow-undo-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleForwardMessage}>
                      <Text style={[styles.contextMenuText, { color: tokens.colors.text }]}>Forward</Text>
                      <Ionicons name="arrow-redo-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleCopyMessage}>
                      <Text style={[styles.contextMenuText, { color: tokens.colors.text }]}>Copy</Text>
                      <Ionicons name="copy-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={() => { Alert.alert('Speak', 'Text-to-speech funcționalitate în curând'); closeContextMenu(); }}>
                      <Text style={[styles.contextMenuText, { color: tokens.colors.text }]}>Speak</Text>
                      <Ionicons name="volume-medium-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleReportMessage}>
                      <Text style={[styles.contextMenuText, { color: tokens.colors.text }]}>Report</Text>
                      <Ionicons name="warning-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    {String(selectedMessage?.senderId) === String(userId) && !selectedMessage?.deleted ? (
                      <>
                        <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                        <TouchableOpacity style={styles.contextMenuItem} onPress={handleDeleteMessage}>
                          <Text style={[styles.contextMenuText, { color: '#ff3b30' }]}>Delete</Text>
                          <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                        </TouchableOpacity>
                      </>
                    ) : null}
                    </View>
                    </ScrollView>
                  </View>
                </View>
              </>
            )}
          </Pressable>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  // Conversation list view
  return (
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
            <Text style={styles.listHeaderTitle}>Mesaje ({totalConversations})</Text>
            <Text style={styles.listHeaderSubtitle}>Continuă conversațiile tale</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.85} onPress={() => router.push('/starred-messages')}>
              <Ionicons name="star-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.85}>
              <Ionicons name="search" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterSegment}>
          {(['buying', 'selling'] as const).map((filterKey) => (
            <TouchableOpacity
              key={filterKey}
              style={[
                styles.filterButton,
                conversationFilter === filterKey && styles.filterButtonActive,
              ]}
              activeOpacity={0.85}
              onPress={() => setConversationFilter(filterKey)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  conversationFilter === filterKey && styles.filterButtonTextActive,
                ]}
              >
                {filterKey === 'buying' ? 'De cumpărat' : 'De vândut'}
              </Text>
            </TouchableOpacity>
          ))}
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
              <Text style={[styles.loadingText, { color: tokens.colors.muted }]}>Se încarcă conversațiile...</Text>
            </View>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <TouchableOpacity
                key={conv.conversationId}
                activeOpacity={0.9}
                onPress={async () => {
                  const unreadAmount = conv.unreadCount || 0;
                  setSelectedConversation(conv);
                  setConversations((prev) =>
                    prev.map((c) => (c.conversationId === conv.conversationId ? { ...c, unread: false, unreadCount: 0 } : c))
                  );
                  if (conv.unread && unreadAmount > 0) {
                    try {
                      await api.put(`/api/messages/conversation/${conv.conversationId}/mark-read`);
                      decrementUnreadCount(unreadAmount);
                      await refreshUnreadCount();
                    } catch (e) {
                      // ignore
                    }
                  }
                }}
                style={[styles.conversationCardFlat, conv.unread && styles.conversationCardUnread, { borderBottomColor: tokens.colors.border }]}
              >
                <View style={styles.conversationAvatarWrapper}>
                  <Image
                    source={{ uri: conv.avatar || conv.participantAvatar || getAvatarFallback(conv.participantName) }}
                    style={styles.conversationAvatar}
                  />
                  {conv.unread && conv.unreadCount && conv.unreadCount > 0 && (
                    <View style={styles.conversationBadge}>
                      <Text style={styles.conversationBadgeText}>
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.conversationInfo}>
                  <View style={styles.conversationRowTop}>
                    <Text style={[styles.conversationName, { color: tokens.colors.text }]} numberOfLines={1}>
                      {conv.participantName}
                    </Text>
                    <Text style={[styles.conversationTime, { color: tokens.colors.muted }]}>{conv.time}</Text>
                  </View>
                  <Text style={[styles.conversationSnippet, { color: tokens.colors.muted }]} numberOfLines={1}>
                    {conv.lastMessage}
                  </Text>
                  <Text style={[styles.conversationTopic, { color: tokens.colors.muted }]} numberOfLines={1}>
                    {conv.announcementTitle}
                  </Text>
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
              <Text style={[styles.chatEmptyText, { color: tokens.colors.text }]}>Nu ai conversații </Text>
              <Text style={[styles.chatEmptySubtitle, { color: tokens.colors.muted }]}>E momentul tău Eminescu, începe să scrii!</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
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
  },
  filterButtonActive: {
    backgroundColor: '#ffffff',
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
  conversationCard: {
    // kept for backward compatibility; use flat variant for list
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
    backgroundColor: 'rgba(245, 24, 102, 0.04)',
    borderLeftWidth: 3,
    borderLeftColor: '#F51866',
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
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F51866',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  conversationBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.3,
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  // Web-like empty state for conversations list
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
  // Chat view
  chatHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  chatHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#F8B195',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    width: '100%',
  },
  messageRowCompact: {
    marginBottom: 4,
  },
  messageRowOwn: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 16,
    marginBottom: 6,
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  imageViewerCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 24,
  },
  imageViewerFooterText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  tickIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  // Clean chat view styles
  chatHeaderClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backBtnClean: {
    padding: 4,
  },
  // headerAvatarClean is declared later with updated sizing
  headerNameClean: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a', // overridden at runtime by tokens where used
  },
  moreBtn: {
    padding: 4,
  },
  moreBtnTop: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginLeft: 0,
  },
  headerAvatarClean: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: '#e6e6e6',
    alignSelf: 'stretch',
    marginTop: 8,
    marginBottom: 8,
  },
  announcementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  announcementThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 10,
  },
  announcementInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  announcementTitle: {
    fontSize: 14,
    color: '#444444', // overridden at runtime
  },
  announcementId: {
    fontSize: 12,
    color: '#999999', // overridden at runtime
    marginTop: 2,
  },
  // Dark mode overrides for one-to-one chat detail
  headerNameCleanDark: {
    color: '#ffffff',
  },
  headerSeparatorDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  announcementTitleDark: {
    color: '#ffffff',
  },
  announcementIdDark: {
    color: 'rgba(255,255,255,0.65)',
  },
  emptyTextDark: {
    color: '#ffffff',
  },
  // Input dark text
  inputCleanDark: {
    color: '#ffffff',
  },
  // Message bubble dark variants
  messageBubbleOwnDark: {
    backgroundColor: '#F51866',
  },
  messageBubbleOtherDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  messageTextDark: {
    color: '#ffffff',
  },
  messageTimeDark: {
    color: 'rgba(255,255,255,0.75)',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 0.5,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e6e6e6',
    marginHorizontal: 12,
  },
  messageGroup: {
    flex: 1,
  },
  messageBubbleClean: {
    paddingHorizontal: 14,
    paddingRight: 24,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '75%', // original constraint for normal list; floating bubble will override if needed
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  messageTextClean: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTimestamp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTimeClean: {
    fontSize: 11,
  },
  tickIconClean: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  inputContainerClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    padding: 4,
  },
  inputClean: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#1a1a1a',
    maxHeight: 100,
  },
  sendBtnClean: {
    padding: 8,
  },
  // Reactions styles
  reactionsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  reactionBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  reactionEmoji: {
    fontSize: 16,
    marginRight: 2,
  },
  reactionCount: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '600',
  },
  // Context menu styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contextMenuContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 0,
    width: Dimensions.get('window').width * 0.75,
    maxWidth: 320,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  contextMessagePreview: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 120,
  },
  contextMessageText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 20,
  },
  contextMessageImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginTop: 8,
  },
  quickReactions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  quickReactionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  quickReactionEmoji: {
    fontSize: 24,
  },
  reactionPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 16,
    gap: 12,
  },
  reactionPickerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  reactionPickerEmoji: {
    fontSize: 28,
  },
  contextMenu: {
    backgroundColor: '#ffffff',
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  contextMenuText: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  contextMenuDivider: {
    height: 0.5,
    backgroundColor: '#e8e8e8',
    marginHorizontal: 20,
  },
  // Dynamic absolute positioned elements
  reactionBarAbsolute: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 28,
    gap: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  reactionPickerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  contextMenuAbsolute: {
    position: 'absolute',
    width: 300,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  floatingBubble: {
    position: 'absolute',
    zIndex: 20,
    // width & left set dynamically
  },
  // Reply preview styles (above input)
  replyPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  replyPreviewBar: {
    width: 3,
    height: '100%',
    marginRight: 8,
    borderRadius: 2,
  },
  replyPreviewContent: {
    flex: 1,
  },
  replyPreviewName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 13,
  },
  replyPreviewImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyPreviewClose: {
    padding: 8,
  },
  // Reply in message bubble styles
  replyInBubble: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 6,
    paddingRight: 8,
    marginBottom: 6,
    borderRadius: 6,
  },
  replyInBubbleName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyInBubbleText: {
    fontSize: 12,
  },
  replyInBubbleImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
