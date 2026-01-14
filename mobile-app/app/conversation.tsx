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
import { ThemedText } from '../components/themed-text';
// @ts-ignore - local component resolves correctly at runtime
import { ThemedTextInput } from '../components/themed-text-input';
import { Toast } from '../components/ui/Toast';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
// @ts-ignore - rely on Expo's runtime types for this native module
import * as DocumentPicker from 'expo-document-picker';
import { PermissionsAndroid } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import api from '../src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import storage from '../src/services/storage';
import { useAuth } from '../src/context/AuthContext';
import { useChatNotifications } from '../src/context/ChatNotificationContext';
import ImageViewing from '../src/components/ImageViewer';
// @ts-ignore - local component resolves correctly at runtime
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import { useLocale } from '../src/context/LocaleContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

// NOTE: Pentru a evita eroarea html2canvas (folosită intern de react-native-view-shot pe web),
// NU importăm direct view-shot; vom crea un loader lazy doar pentru platformele native.
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
  destinatarId?: string;
  text?: string;
  image?: string;
  createdAt: string;
  isRead?: boolean;
  senderInfo?: { firstName?: string; lastName?: string; avatar?: string };
  replyTo?: { messageId: string; senderId: string; senderName: string; text?: string; image?: string };
  reactions?: Array<{ userId: string; emoji: string }>;
  deleted?: boolean;
  messageType?: 'text' | 'collaboration_request';
  collaborationData?: {
    participants?: string[];
    acceptedBy?: string[];
    declinedBy?: string[];
  };
}

const TRANSLATIONS = {
  ro: {
    loadingMessages: 'Se încarcă mesajele...',
    noConversation: 'Nicio conversație încă. Scrie primul mesaj!',
    writeMessage: 'Scrie mesajul tău...',
    error: 'Eroare',
    sendMessageError: 'Nu s-a putut trimite mesajul.',
    permissionTitle: 'Permisiune',
    galleryPermission: 'Trebuie să permiți accesul la galerie pentru a selecta o imagine.',
    sendImageError: 'Nu s-a putut trimite imaginea.',
    selectImageError: 'A apărut o eroare la selectarea imaginii.',
    filePermission: 'Trebuie să permiți accesul la fișiere pentru a selecta un document.',
    sendFileError: 'Nu s-a putut trimite fișierul.',
    selectFileError: 'A apărut o eroare la selectarea fișierului.',
    reactionError: 'Nu s-a putut salva reacția. Verifică conexiunea și încearcă din nou.',
    cannotDelete: 'Nu poți șterge',
    notOwner: 'Nu ești proprietarul acestui mesaj. Poți folosi Raportează dacă este neadecvat.',
    alreadyDeleted: 'Mesaj deja șters',
    messageDeleted: 'Acest mesaj este deja marcat ca șters.',
    deleteMessage: 'Șterge mesaj',
    deleteConfirm: 'Ești sigur că vrei să ștergi acest mesaj?',
    cancel: 'Anulează',
    delete: 'Șterge',
    copied: 'Copiat',
    messageCopied: 'Mesajul a fost copiat.',
    imageLinkCopied: 'Link-ul imaginii a fost copiat.',
    nothingToCopy: 'Nimic de copiat',
    nothingToCopyMessage: 'Mesajul nu conține text sau imagine ce poate fi copiat.',
    forward: 'Forward',
    comingSoon: 'Funcționalitate în curând',
    removed: 'Removed',
    removedFromFavorites: 'Mesajul a fost eliminat din favorite.',
    saved: 'Saved',
    markedWithStar: 'Mesajul a fost marcat cu stea.',
    updateFavoritesError: 'Nu s-a putut actualiza mesajele favorite.',
    reportMessage: 'Raportează mesaj',
    reportConfirm: 'Vrei să raportezi acest mesaj?',
    report: 'Raportează',
    reported: 'Raportat',
    messageReported: 'Mesajul a fost raportat.',
    speak: 'Speak',
    textToSpeech: 'Text-to-speech funcționalitate în curând',
    deletedMessage: 'acest mesaj a fost șters',
    photo: 'Fotografie',
    you: 'Tu',
    star: 'Marchează cu Stea',
    reply: 'Răspunde',
    copy: 'Copiază',
    deleteBtn: 'Șterge',
    messages: 'Mesaje',
    continueConversations: 'Continuă conversațiile tale',
    buying: 'De cumpărat',
    selling: 'De vândut',
    loadingConversations: 'Se încarcă conversațiile...',
    noConversations: 'Nu ai conversații',
    startWriting: 'E momentul tău Eminescu, începe să scrii!',

    collaborate: 'Colaborează',
    collaborateConfirmTitle: 'Cerere de colaborare',
    collaborateConfirmMessage:
      'Vrei să trimiți o cerere de colaborare? După ce este acceptată de amândoi, veți putea lăsa recenzii unul altuia.',
    collaborationRequestText: 'Vrei să colaborăm?',
    collaborationPending: 'În așteptare',
    collaborationAccepted: 'Confirmată',
    collaborationDeclined: 'Refuzată',
    collaborationYouAcceptedWaiting: 'Ai acceptat. Așteptăm confirmarea celuilalt utilizator.',
    collaborationAlreadyPending: 'Există deja o cerere de colaborare în așteptare.',
    collaborationAlreadyAccepted: 'Colaborarea este deja confirmată.',
    accept: 'Acceptă',
    decline: 'Refuză',
  },
  en: {
    loadingMessages: 'Loading messages...',
    noConversation: 'No conversation yet. Write the first message!',
    writeMessage: 'Write your message...',
    error: 'Error',
    sendMessageError: 'Could not send the message.',
    permissionTitle: 'Permission',
    galleryPermission: 'You must allow access to gallery to select an image.',
    sendImageError: 'Could not send the image.',
    selectImageError: 'An error occurred while selecting the image.',
    filePermission: 'You must allow access to files to select a document.',
    sendFileError: 'Could not send the file.',
    selectFileError: 'An error occurred while selecting the file.',
    reactionError: 'Could not save the reaction. Check your connection and try again.',
    cannotDelete: 'Cannot delete',
    notOwner: 'You are not the owner of this message. You can use Report if it is inappropriate.',
    alreadyDeleted: 'Message already deleted',
    messageDeleted: 'This message is already marked as deleted.',
    deleteMessage: 'Delete message',
    deleteConfirm: 'Are you sure you want to delete this message?',
    cancel: 'Cancel',
    delete: 'Delete',
    copied: 'Copied',
    messageCopied: 'The message has been copied.',
    imageLinkCopied: 'The image link has been copied.',
    nothingToCopy: 'Nothing to copy',
    nothingToCopyMessage: 'The message does not contain text or image that can be copied.',
    forward: 'Forward',
    comingSoon: 'Feature coming soon',
    removed: 'Removed',
    removedFromFavorites: 'The message has been removed from favorites.',
    saved: 'Saved',
    markedWithStar: 'The message has been marked with a star.',
    updateFavoritesError: 'Could not update favorite messages.',
    reportMessage: 'Report message',
    reportConfirm: 'Do you want to report this message?',
    report: 'Report',
    reported: 'Reported',
    messageReported: 'The message has been reported.',
    speak: 'Speak',
    textToSpeech: 'Text-to-speech feature coming soon',
    deletedMessage: 'this message has been deleted',
    photo: 'Photo',
    you: 'You',
    star: 'Star',
    reply: 'Reply',
    copy: 'Copy',
    deleteBtn: 'Delete',
    messages: 'Messages',
    continueConversations: 'Continue your conversations',
    buying: 'Buying',
    selling: 'Selling',
    loadingConversations: 'Loading conversations...',
    noConversations: 'You have no conversations',
    startWriting: 'It\'s your moment, start writing!',

    collaborate: 'Collaborate',
    collaborateConfirmTitle: 'Collaboration request',
    collaborateConfirmMessage:
      'Send a collaboration request? After both users accept, you will be able to leave reviews for each other.',
    collaborationRequestText: 'Do you want to collaborate?',
    collaborationPending: 'Pending',
    collaborationAccepted: 'Confirmed',
    collaborationDeclined: 'Declined',
    collaborationYouAcceptedWaiting: 'You accepted. Waiting for the other user to confirm.',
    collaborationAlreadyPending: 'There is already a pending collaboration request.',
    collaborationAlreadyAccepted: 'Collaboration is already confirmed.',
    accept: 'Accept',
    decline: 'Decline',
  },
};

export default function ConversationScreen() {
  const { tokens, isDark } = useAppTheme();
  const { locale } = useLocale();
  const t = TRANSLATIONS[locale === 'en' ? 'en' : 'ro'];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const { decrementUnreadCount } = useChatNotifications();
  
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
  const [menuPosition, setMenuPosition] = useState<null | { x: number; y: number; width: number; height: number; showAbove: boolean }>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const FIXED_MENU_WIDTH = 300;
  const MENU_ITEM_HEIGHT = 48;
  const MENU_DIVIDER_HEIGHT = StyleSheet.hairlineWidth || 1;
  const [reactionBarWidth, setReactionBarWidth] = useState(0);
  const [reactionBarHeight, setReactionBarHeight] = useState(0);
  const [floatingSnapshot, setFloatingSnapshot] = useState<string | null>(null);
  const [floatingReady, setFloatingReady] = useState(false);
  const [overlayPlacement, setOverlayPlacement] = useState<'above' | 'below'>('above');
  const bubbleRefs = useRef<Record<string, View | null>>({});
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<{ uri: string }[]>([]);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [bubbleLayoutsMap, setBubbleLayoutsMap] = useState<Record<string, {x:number;y:number;width:number;height:number}>>({});
  const [reactionDimsMap, setReactionDimsMap] = useState<Record<string, {width:number;height:number}>>({});
  const [replyTo, setReplyTo] = useState<{ messageId: string; senderId: string; senderName: string; text?: string; image?: string } | null>(null);
  const [targetMessageId, setTargetMessageId] = useState<string | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [confirmCollabVisible, setConfirmCollabVisible] = useState(false);
  const [sendingCollab, setSendingCollab] = useState(false);

  const width = Dimensions.get('window').width;

  const getCollaborationMessageStatus = useCallback((message: Message) => {
    const acceptedBy = (message.collaborationData?.acceptedBy || []).map(String);
    const declinedBy = (message.collaborationData?.declinedBy || []).map(String);
    const isDeclined = declinedBy.length > 0;
    const isAccepted = acceptedBy.length >= 2;
    return { acceptedBy, declinedBy, isDeclined, isAccepted };
  }, []);

  const isCollaborationRequestMessage = useCallback((message: Message) => {
    if (!message) return false;
    return (
      message.messageType === 'collaboration_request' ||
      String(message.text || '').trim() === 'COLLABORATION_REQUEST'
    );
  }, []);

  const findExistingCollaborationRequest = useCallback(() => {
    const collabMessages = messages.filter((m) => isCollaborationRequestMessage(m));
    const latest = [...collabMessages].reverse()[0] || null;
    if (collabMessages.length === 0) {
      return { latest: null as Message | null, accepted: false, pending: false };
    }

    const accepted = collabMessages.some((m) => getCollaborationMessageStatus(m).isAccepted);
    const pending =
      !accepted &&
      collabMessages.some((m) => {
        const s = getCollaborationMessageStatus(m);
        return !s.isAccepted && !s.isDeclined;
      });

    return { latest, accepted, pending };
  }, [messages, getCollaborationMessageStatus, isCollaborationRequestMessage]);

  const handleSendCollaborationRequest = async () => {
    if (!userId || !selectedConversation || sendingCollab) return;

    const existing = findExistingCollaborationRequest();
    if (existing.accepted) {
      setToastMessage(t.collaborationAlreadyAccepted);
      setToastType('info');
      setToastVisible(true);
      return;
    }
    if (existing.pending) {
      setToastMessage(t.collaborationAlreadyPending);
      setToastType('info');
      setToastVisible(true);
      return;
    }

    setConfirmCollabVisible(true);
  };

  const confirmSendCollaborationRequest = async () => {
    if (!userId || !selectedConversation || sendingCollab) return;
    const otherId = selectedConversation.otherParticipant?.id;
    if (!otherId) return;

    setConfirmCollabVisible(false);
    setSendingCollab(true);

    const tempMessage: Message = {
      _id: `tmp-collab-${Date.now()}`,
      conversationId: selectedConversation.conversationId,
      senderId: userId,
      destinatarId: otherId,
      text: t.collaborationRequestText,
      createdAt: new Date().toISOString(),
      senderInfo: { firstName: 'Tu', lastName: '' },
      messageType: 'collaboration_request',
      collaborationData: {
        participants: [String(userId), String(otherId)],
        acceptedBy: [String(userId)],
        declinedBy: [],
      },
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const isSeller = String(userId) === String(selectedConversation.announcementOwnerId);
      const senderRole = isSeller ? 'vanzator' : 'cumparator';

      const payload: any = {
        conversationId: selectedConversation.conversationId,
        senderId: userId,
        senderRole,
        destinatarId: otherId,
        text: 'COLLABORATION_REQUEST',
        messageType: 'collaboration_request',
        collaborationData: {
          participants: [String(userId), String(otherId)],
          acceptedBy: [String(userId)],
          declinedBy: [],
        },
        ...(selectedConversation.announcementId ? { announcementId: selectedConversation.announcementId } : {}),
      };

      const response = await api.post('/api/messages', payload);
      if (response.data && response.data._id) {
        setMessages((prev) => prev.map((m) => (m._id === tempMessage._id ? { ...response.data, senderInfo: tempMessage.senderInfo } : m)));
      }
    } catch (error) {
      console.error('Error sending collaboration request:', error);
      setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
      Alert.alert(t.error, t.sendMessageError);
    } finally {
      setSendingCollab(false);
    }
  };

  const handleCollaborationResponse = async (messageId: string, accept: boolean) => {
    if (!messageId) return;
    try {
      const res = await api.post(`/api/messages/${encodeURIComponent(String(messageId))}/collaboration-response`, { accept });
      const updated = res.data;
      if (updated && updated._id) {
        setMessages((prev) => prev.map((m) => (m._id === updated._id ? { ...m, ...updated } : m)));
      }
    } catch (err) {
      console.error('Collaboration response error:', err);
      Alert.alert(t.error, t.sendMessageError);
    }
  };

  const renderCollaborationBody = (message: Message, isOwn: boolean) => {
    const { acceptedBy, declinedBy, isAccepted, isDeclined } = getCollaborationMessageStatus(message);
    const me = String(userId || '');
    const iAccepted = acceptedBy.includes(me);
    const iDeclined = declinedBy.includes(me);
    const canRespond = !isAccepted && !isDeclined && !iAccepted && !iDeclined;

    const statusText = isAccepted
      ? t.collaborationAccepted
      : isDeclined
        ? t.collaborationDeclined
        : `${t.collaborationPending} (${acceptedBy.length}/2)`;

    return (
      <View style={styles.collabContainer}>
        <ThemedText
          style={[
            styles.collabTitle,
            { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.text },
          ]}
        >
          {t.collaborationRequestText}
        </ThemedText>
        <ThemedText
          style={[
            styles.collabStatus,
            { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.muted },
          ]}
        >
          {statusText}
        </ThemedText>

        {iAccepted && !isAccepted && !isDeclined ? (
          <ThemedText
            style={[
              styles.collabHint,
              { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.muted },
            ]}
          >
            {t.collaborationYouAcceptedWaiting}
          </ThemedText>
        ) : null}

        {canRespond ? (
          <View style={styles.collabButtonsRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleCollaborationResponse(message._id, true)}
              style={[
                styles.collabBtn,
                {
                  backgroundColor: tokens.colors.primary,
                  borderColor: tokens.colors.primary,
                },
              ]}
            >
              <ThemedText style={[styles.collabBtnText, { color: tokens.colors.primaryContrast }]}>
                {t.accept}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleCollaborationResponse(message._id, false)}
              style={[
                styles.collabBtn,
                {
                  backgroundColor: 'transparent',
                  borderColor: tokens.colors.border,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.collabBtnText,
                  { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.text },
                ]}
              >
                {t.decline}
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

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

  const routeParams = useLocalSearchParams();
  const routeParamsRef = useRef(routeParams);
  routeParamsRef.current = routeParams;

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

  // Initialize conversation from params
  useEffect(() => {
    if (!userId) return;

    const routeConversationId = (routeParams as any)?.conversationId;
    const routeMessageId = (routeParams as any)?.messageId;

    if (routeConversationId) {
      const expectedConversationId = String(routeConversationId);
      
      // Try to construct conversation object from params
      const senderName = (routeParams as any)?.senderName || 'Utilizator';
      const senderAvatar = (routeParams as any)?.senderAvatar || '';
      let senderId = (routeParams as any)?.senderId || '';
      
      if (!senderId && expectedConversationId && userId) {
        const parts = expectedConversationId.split('-');
        const candidate = parts.find(p => p !== userId && /^[a-fA-F0-9]{24}$/.test(p));
        if (candidate) senderId = candidate;
      }

      const conversationAvatar = (routeParams as any)?.announcementImage || senderAvatar;
      const resolvedAvatar = resolveAvatarUrl(conversationAvatar) || resolveAvatarUrl(senderAvatar) || '';
      const resolvedParticipantAvatar = resolveAvatarUrl(senderAvatar) || '';
      
      const tempConv: Conversation = {
        id: senderId || expectedConversationId,
        conversationId: expectedConversationId,
        name: (routeParams as any)?.announcementTitle || '(Conversatie)',
        avatar: resolvedAvatar,
        participantName: senderName,
        participantAvatar: resolvedParticipantAvatar,
        announcementTitle: (routeParams as any)?.announcementTitle || '',
        announcementOwnerName: senderName,
        lastMessage: '',
        time: new Date().toLocaleString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
        unread: (routeParams as any)?.unread === 'true',
        unreadCount: parseInt((routeParams as any)?.unreadCount || '0', 10),
        otherParticipant: { 
          id: senderId, 
          firstName: senderName.split(' ')[0] || '', 
          lastName: senderName.split(' ').slice(1).join(' ') || '', 
          avatar: resolvedParticipantAvatar,
          lastSeen: undefined
        },
        lastSeen: undefined,
        announcementOwnerId: (routeParams as any)?.announcementOwnerId || '',
        announcementId: (routeParams as any)?.announcementId || '',
      };
      setSelectedConversation(tempConv);
      if (routeMessageId) setTargetMessageId(String(routeMessageId));
    } else {
        // Fallback for announcementOwnerId logic
        const ownerId = (routeParams as any)?.announcementOwnerId;
        const announcementId = (routeParams as any)?.announcementId;
        if (ownerId) {
            let expectedConversationId = '';
            if (announcementId) {
                expectedConversationId = `${ownerId}-${userId}-${announcementId}`;
            } else {
                expectedConversationId = [String(ownerId), String(userId)].sort().join('-');
            }
            
            const senderName = (routeParams as any)?.senderName || 
                `${(routeParams as any)?.announcementOwnerFirstName || ''} ${(routeParams as any)?.announcementOwnerLastName || ''}`.trim() || 
                'Utilizator';
            const senderAvatar = (routeParams as any)?.senderAvatar || 
                (routeParams as any)?.announcementOwnerAvatar || '';
            
            const conversationAvatar = (routeParams as any)?.announcementImage || senderAvatar || '';
            const resolvedAvatar = resolveAvatarUrl(conversationAvatar) || '';
            const resolvedParticipantAvatar = resolveAvatarUrl(senderAvatar) || '';

            const tempConv: Conversation = {
                id: ownerId,
                conversationId: expectedConversationId,
                name: (routeParams as any)?.announcementTitle || '(fără titlu)',
                avatar: resolvedAvatar,
                participantName: senderName,
                participantAvatar: resolvedParticipantAvatar,
                announcementTitle: (routeParams as any)?.announcementTitle || '',
                announcementOwnerName: senderName,
                lastMessage: '',
                time: new Date().toLocaleString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
                unread: (routeParams as any)?.unread === 'true',
                unreadCount: parseInt((routeParams as any)?.unreadCount || '0', 10),
                otherParticipant: { 
                id: ownerId, 
                firstName: (routeParams as any)?.announcementOwnerFirstName || senderName.split(' ')[0] || '', 
                lastName: (routeParams as any)?.announcementOwnerLastName || senderName.split(' ').slice(1).join(' ') || '', 
                avatar: resolvedParticipantAvatar,
                lastSeen: undefined
                },
                lastSeen: undefined,
                announcementOwnerId: ownerId,
                announcementId: announcementId || '',
            };
            setSelectedConversation(tempConv);
        }
    }
  }, [JSON.stringify(routeParams), userId]);

  // Scroll to target message
  useEffect(() => {
    const idToScroll = targetMessageId || (routeParams as any)?.messageId;
    if (!idToScroll) return;
    if (!messages || messages.length === 0) return;
    const layout = bubbleLayoutsMap[idToScroll];
    if (layout && messagesEndRef.current && typeof messagesEndRef.current.scrollTo === 'function') {
      try {
        messagesEndRef.current.scrollTo({ y: Math.max(0, layout.y - 20), animated: true });
        if (targetMessageId) setTargetMessageId(null);
      } catch (e) {}
    }
  }, [messages, bubbleLayoutsMap, routeParams, targetMessageId]);

  const fetchMessages = useCallback(async () => {
    if (!selectedConversation) return;
    try {
      setLoading(true);
      const response = await api.get(`/api/messages/conversation/${selectedConversation.conversationId}`);
      const raw = (response.data || []) as any[];
      const normalized = raw.map((m: any) => {
        if (m && m.replyTo && !m.replyTo.senderName) {
          const isSelf = String(m.replyTo.senderId || '') === String(userId || '');
          const fallbackName = isSelf ? 'Tu' : (selectedConversation?.participantName || 'Utilizator');
          return { ...m, replyTo: { ...m.replyTo, senderName: fallbackName } };
        }
        return m;
      });
      setMessages(normalized);

      if (selectedConversation.unread && selectedConversation.unreadCount) {
        try {
          await api.put(`/api/messages/conversation/${selectedConversation.conversationId}/mark-read`);
          decrementUnreadCount(selectedConversation.unreadCount);
          setSelectedConversation(prev => prev ? ({ ...prev, unread: false, unreadCount: 0 }) : null);
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
  }, [selectedConversation, userId, decrementUnreadCount]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
    }
  }, [selectedConversation, fetchMessages]);

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
    }
    setRefreshing(false);
  }, [selectedConversation, fetchMessages]);

  const handleSendMessage = async () => {
    if (!userId || !newMessage.trim() || !selectedConversation) return;
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

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
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
                  ...response.data,
                  senderInfo: tempMessage.senderInfo,
                  replyTo: (() => {
                    const serverReply: any = response.data.replyTo || {};
                    const localReply: any = tempMessage.replyTo || {};
                    return {
                      ...(serverReply || {}),
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
      Alert.alert(t.error, t.sendMessageError);
    }
  };

  const handlePickImagePress = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.status !== 'granted') {
        Alert.alert(t.permissionTitle, t.galleryPermission);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      if ((result as any).canceled) return;

      const asset: any = (result as any).assets ? (result as any).assets[0] : result;
      if (!asset || !asset.uri) return;

      const uri = asset.uri;
      const fileName = asset.fileName || uri.split('/').pop() || `photo_${Date.now()}.jpg`;
      const extMatch = /\.([a-zA-Z0-9]+)$/.exec(fileName);
      const ext = extMatch ? extMatch[1] : 'jpg';
      const mimeType = asset.type ? `${asset.type}/${ext}` : `image/${ext}`;

      const capturedReplyForImage = replyTo;

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
      if (capturedReplyForImage) {
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
        Alert.alert(t.error, t.sendImageError);
      }
    } catch (err) {
      console.error('handlePickImagePress error:', err);
      Alert.alert(t.error, t.selectImageError);
    }
  };

  const handlePickFilePress = async () => {
    try {
      if (Platform.OS === 'android') {
        try {
          const perm = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
          if (perm) {
            const granted = await PermissionsAndroid.request(perm);
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              const imgPerm = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES || PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
              const vidPerm = PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO || PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
              const g2 = await PermissionsAndroid.requestMultiple([imgPerm, vidPerm]);
              const ok = Object.values(g2).some((v) => v === PermissionsAndroid.RESULTS.GRANTED);
              if (!ok) {
                Alert.alert(t.permissionTitle, t.filePermission);
                return;
              }
            }
          }
        } catch (pErr) {
          console.warn('Permission request failed, proceeding to picker', pErr);
        }
      }

      const res = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (res.canceled) return;

      const asset = res.assets[0];
      const uri = asset.uri;
      const fileName = asset.name;
      const mimeType = asset.mimeType || 'application/octet-stream';

      const capturedReplyForFile = replyTo;
      const tempMessage: Message = {
        _id: Date.now().toString(),
        conversationId: selectedConversation!.conversationId,
        senderId: userId!,
        image: uri,
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
        Alert.alert(t.error, t.sendFileError);
      }
    } catch (err) {
      console.error('handlePickFilePress error:', err);
      Alert.alert(t.error, t.selectFileError);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ro-RO', {
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const handleLongPressMessage = (message: Message) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
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
    UIManager.measureInWindow(node, (x, y, width, height) => {
      const screenHeight = Dimensions.get('window').height;
      const spaceAbove = y - insets.top;
      const spaceBelow = screenHeight - (y + height) - insets.bottom;
      const estimatedMenuHeight = 320;
      const showAbove = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;
      
      setSelectedMessage(message);
      setMenuPosition({ x, y, width, height, showAbove });
      setContextMenuVisible(true);
      setFloatingReady(true);
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

  useEffect(() => {
    if (!menuPosition || !contextMenuVisible) return;
    const screenH = Dimensions.get('window').height;
    const gap = 8;
    const rbH = reactionBarHeight || 48;
    const menuCountBase = 6;
    const includeDelete = !!(selectedMessage && String(selectedMessage.senderId) === String(userId) && !selectedMessage.deleted);
    const mCount = menuCountBase + (includeDelete ? 1 : 0);
    const mH = mCount * MENU_ITEM_HEIGHT + Math.max(0, mCount - 1) * MENU_DIVIDER_HEIGHT;
    const spaceAbove = menuPosition.y - insets.top;
    const spaceBelow = screenH - (menuPosition.y + menuPosition.height) - insets.bottom;
    const neededTotal = rbH + mH + gap * 3;

    if (spaceAbove >= neededTotal) {
      setOverlayPlacement('above');
      return;
    }
    if (spaceBelow >= neededTotal) {
      setOverlayPlacement('below');
      return;
    }
    if (spaceAbove >= spaceBelow) {
      setOverlayPlacement('above');
    } else {
      setOverlayPlacement('below');
    }
  }, [menuPosition, reactionBarHeight, menuHeight, insets.top, insets.bottom, contextMenuVisible]);

  const handleReaction = async (emoji: string) => {
    if (!selectedMessage || !userId) return;
    const previousMessages = messages;
    try {
      setMessages((prev) =>
        prev.map((m) => {
          if (m._id === selectedMessage._id) {
            const reactions = m.reactions || [];
            const existingIdx = reactions.findIndex((r) => r.userId === userId && r.emoji === emoji);
            if (existingIdx >= 0) {
              return { ...m, reactions: reactions.filter((_, i) => i !== existingIdx) };
            } else {
              return { ...m, reactions: [...reactions, { userId, emoji }] };
            }
          }
          return m;
        })
      );
      closeContextMenu();

      const res = await api.post(`/api/messages/${selectedMessage._id}/react`, { emoji });
      const updatedMessage = res.data;
      if (updatedMessage && updatedMessage._id) {
        setMessages((prev) => prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m)));
      }
    } catch (err) {
      console.error('Reaction error:', err);
      try {
        setMessages(previousMessages || []);
      } catch (e) {}
      try {
        Alert.alert(t.error, t.reactionError);
      } catch (e) {}
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;
    if (String(selectedMessage.senderId) !== String(userId)) {
      Alert.alert(t.cannotDelete, t.notOwner);
      closeContextMenu();
      return;
    }

    if (selectedMessage.deleted) {
      Alert.alert(t.alreadyDeleted, t.messageDeleted);
      closeContextMenu();
      return;
    }

    // Open the styled ConfirmDialog instead of native Alert
    setConfirmDeleteVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedMessage) return;
    try {
      // Mark locally as deleted immediately for fast feedback
      setMessages((prev) => prev.map((m) => (m._id === selectedMessage._id ? { ...m, deleted: true, text: undefined, image: undefined } : m)));
      setConfirmDeleteVisible(false);
      closeContextMenu();
      try {
        await api.delete(`/api/messages/${selectedMessage._id}`);
      } catch (serverErr) {
        console.warn('Server delete failed, message kept as deleted locally', serverErr);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setConfirmDeleteVisible(false);
    }
  };

  const handleCopyMessage = async () => {
    if (!selectedMessage) return;
    try {
      if (selectedMessage.text) {
        await Clipboard.setStringAsync(selectedMessage.text);
        setToastMessage(t.messageCopied);
        setToastType('success');
        setToastVisible(true);
        closeContextMenu();
        return;
      }
      if (selectedMessage.image) {
        await Clipboard.setStringAsync(selectedMessage.image);
        setToastMessage(t.imageLinkCopied);
        setToastType('success');
        setToastVisible(true);
        closeContextMenu();
        return;
      }
      setToastMessage(t.nothingToCopyMessage || t.nothingToCopy);
      setToastType('info');
      setToastVisible(true);
      closeContextMenu();
    } catch (err) {
      console.error('Copy error:', err);
    }
  };

  const handleReplyMessage = () => {
    if (!selectedMessage) return;
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
    Alert.alert(t.forward, t.comingSoon);
    closeContextMenu();
  };

  const handleReportMessage = () => {
    Alert.alert(t.reportMessage, t.reportConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.report, onPress: () => {
        Alert.alert(t.reported, t.messageReported);
        closeContextMenu();
      }},
    ]);
  };

  if (!selectedConversation) {
      return (
          <View style={[styles.container, { backgroundColor: tokens.colors.bg, justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
      );
  }

  return (
    <ProtectedRoute>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: tokens.colors.bg }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[
          styles.chatHeaderClean,
          {
            paddingTop: insets.top + 12,
            backgroundColor: tokens.colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: tokens.colors.border,
          },
        ]}>
          <View style={styles.headerCenter}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity 
                  onPress={() => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/(tabs)/chat');
                    }
                  }} 
                  style={styles.backBtnClean}
                >
                  <Ionicons name="arrow-back" size={26} color={tokens.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    const otherId = selectedConversation.id || selectedConversation.otherParticipant?.id;
                    if (!otherId) return;
                    try {
                      router.push(`/profile?userId=${encodeURIComponent(String(otherId))}`);
                    } catch (e) {}
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: selectedConversation.participantAvatar || getAvatarFallback(selectedConversation.participantName) }}
                    style={styles.headerAvatarClean}
                  />
                  <ThemedText style={[styles.headerNameClean, isDark ? styles.headerNameCleanDark : undefined]} numberOfLines={1}>
                    {selectedConversation.participantName}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSendCollaborationRequest}
                disabled={sendingCollab}
                activeOpacity={0.85}
                style={[styles.headerActionBtn, { opacity: sendingCollab ? 0.5 : 1 }]}
              >
                <Ionicons name="people-outline" size={22} color={tokens.colors.text} />
              </TouchableOpacity>
            </View>

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
                <ThemedText style={[styles.announcementTitle, isDark ? styles.announcementTitleDark : undefined]} numberOfLines={1}>{selectedConversation.announcementTitle || 'Anunț'}</ThemedText>
                {selectedConversation.announcementId ? (
                  <ThemedText style={[styles.announcementId, isDark ? styles.announcementIdDark : undefined]}>ID: {selectedConversation.announcementId}</ThemedText>
                ) : null}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={messagesEndRef}
          style={styles.messagesContainer}
          contentContainerStyle={{ paddingHorizontal: 0, paddingVertical: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />}
        >
          {loading && messages.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={tokens.colors.primary} />
                <ThemedText style={[styles.loadingText, { color: tokens.colors.muted }]}>{t.loadingMessages}</ThemedText>
              </View>
          ) : messages.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={tokens.colors.border} />
                <ThemedText style={[styles.emptyText, { color: tokens.colors.muted }]}>{t.noConversation}</ThemedText>
              </View>
          ) : (
            <>
              {messages.map((message, idx) => {
                const isOwn = message.senderId === userId;
                const prevMessage = idx > 0 ? messages[idx - 1] : null;
                const showDateSeparator = 
                  !prevMessage || 
                  new Date(message.createdAt).toLocaleDateString() !== new Date(prevMessage.createdAt).toLocaleDateString();

                const timeForMessage = formatTime(message.createdAt);
                const nextMessage = idx < messages.length - 1 ? messages[idx + 1] : null;
                const nextTime = nextMessage ? formatTime(nextMessage.createdAt) : null;
                const sameSenderAsNext = !!nextMessage && nextMessage.senderId === message.senderId;
                const sameTimeAsNext = !!nextMessage && nextTime === timeForMessage;
                const showTime = !nextMessage || !(sameTimeAsNext && sameSenderAsNext);
                const compactBelow = sameTimeAsNext && sameSenderAsNext;

                return (
                  <View key={message._id}>
                    {showDateSeparator && (
                      <View style={styles.dateSeparator}>
                        <View style={styles.dateLine} />
                        <ThemedText style={styles.dateSeparatorText}>
                          {new Date(message.createdAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }).toUpperCase()}
                        </ThemedText>
                        <View style={styles.dateLine} />
                      </View>
                    )}

                    <View style={[styles.messageRow, isOwn && styles.messageRowOwn, compactBelow && styles.messageRowCompact]}>
                      <View style={[styles.messageGroup, { position: 'relative' }]}>
                        {message.reactions && message.reactions.length > 0 && (() => {
                          const counts: Record<string, number> = {};
                          (message.reactions || []).forEach((r) => {
                            counts[r.emoji] = (counts[r.emoji] || 0) + 1;
                          });
                          const entries = Object.keys(counts).map((emoji) => ({ emoji, count: counts[emoji] }));
                          entries.sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
                          const visible = entries.slice(0, 3);
                          const more = Math.max(0, entries.length - visible.length);
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
                                  <ThemedText style={styles.reactionEmoji}>{e.emoji}</ThemedText>
                                  {e.count > 1 && <ThemedText style={styles.reactionCount}>{e.count}</ThemedText>}
                                </View>
                              ))}
                              {more > 0 && (
                                <View style={styles.reactionBubble}>
                                  <ThemedText style={styles.reactionCount}>+{more}</ThemedText>
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
                            <ThemedText style={[styles.messageTextClean, { color: tokens.colors.muted, fontStyle: 'italic' }]}>{t.deletedMessage}</ThemedText>
                          ) : (
                            <>
                              {message.replyTo && message.replyTo.messageId && (
                                <View style={[styles.replyInBubble, { 
                                  backgroundColor: isOwn 
                                    ? (isDark ? '#ffffff' : 'rgba(0,0,0,0.08)') 
                                    : 'rgba(0,0,0,0.05)',
                                  borderLeftColor: isDark ? '#000000' : tokens.colors.primary 
                                }]}> 
                                  <ThemedText style={[styles.replyInBubbleName, { 
                                    color: isOwn && isDark ? '#000000' : tokens.colors.primary 
                                  }]}>
                                    {message.replyTo.senderName}
                                  </ThemedText>
                                  {message.replyTo.text && (
                                    <ThemedText 
                                      style={[styles.replyInBubbleText, { 
                                        color: isOwn && isDark ? '#000000' : tokens.colors.muted 
                                      }]} 
                                      numberOfLines={1}
                                    >
                                      {message.replyTo.text}
                                    </ThemedText>
                                  )}
                                  {message.replyTo.image && (
                                    <View style={styles.replyInBubbleImageRow}>
                                      <Ionicons 
                                        name="image-outline" 
                                        size={14} 
                                        color={isOwn && isDark ? '#000000' : tokens.colors.muted} 
                                      />
                                      <ThemedText 
                                        style={[styles.replyInBubbleText, { 
                                          color: isOwn && isDark ? '#000000' : tokens.colors.muted,
                                          marginLeft: 4 
                                        }]}
                                      >
                                        {t.photo}
                                      </ThemedText>
                                    </View>
                                  )}
                                </View>
                              )}
                              
                              {isCollaborationRequestMessage(message) ? (
                                renderCollaborationBody(message, isOwn)
                              ) : (
                                <>
                                  {message.text && (
                                    <ThemedText style={[styles.messageTextClean, { color: isOwn && isDark ? tokens.colors.primaryContrast : tokens.colors.text }] }>
                                      {message.text}
                                    </ThemedText>
                                  )}
                                  {message.image && (
                                    <TouchableOpacity
                                      activeOpacity={0.85}
                                      onPress={() => handleOpenImage(message.image)}
                                    >
                                      <Image source={{ uri: message.image }} style={[styles.messageImage, { borderRadius: 12 }]} resizeMode="cover" />
                                    </TouchableOpacity>
                                  )}
                                </>
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
                        {showTime && (
                          <View 
                            style={[
                              styles.messageTimestamp, 
                              isOwn ? { alignSelf: 'flex-end', marginRight: 12 } : { alignSelf: 'flex-start', marginLeft: 12 }
                            ]}
                          >
                            <ThemedText style={[styles.messageTimeClean, { color: tokens.colors.muted }] }>
                              {timeForMessage}
                            </ThemedText>
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

    {replyTo && replyTo.messageId && (
            <View style={[styles.replyPreviewContainer, { backgroundColor: tokens.colors.elev, borderTopColor: tokens.colors.border }]}> 
              <View style={[styles.replyPreviewBar, { backgroundColor: isDark ? '#000000' : tokens.colors.primary }]} />
              <View style={styles.replyPreviewContent}>
                <ThemedText style={[styles.replyPreviewName, { color: tokens.colors.primary }]}>
                  {replyTo.senderName}
                </ThemedText>
                {replyTo.text && (
                  <ThemedText style={[styles.replyPreviewText, { color: tokens.colors.muted }]} numberOfLines={1}>
                    {replyTo.text}
                  </ThemedText>
                )}
                {replyTo.image && (
                  <View style={styles.replyPreviewImageRow}>
                    <Ionicons name="image-outline" size={16} color={tokens.colors.muted} />
                    <ThemedText style={[styles.replyPreviewText, { color: tokens.colors.muted, marginLeft: 4 }]}>
                      {t.photo}
                    </ThemedText>
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
            paddingBottom: Math.max(insets.bottom, 10),
          }]}>
          <TouchableOpacity style={styles.inputIcon} onPress={handlePickImagePress}>
            <Ionicons name="image-outline" size={26} color={tokens.colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputIcon} onPress={handlePickFilePress}>
            <Ionicons name="attach-outline" size={26} color={tokens.colors.muted} />
          </TouchableOpacity>
          <ThemedTextInput
            style={[styles.inputClean, isDark ? styles.inputCleanDark : undefined]}
            placeholder={t.writeMessage}
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
        />

  <Modal visible={contextMenuVisible} transparent animationType="none" onRequestClose={closeContextMenu}>
          <Pressable style={styles.modalOverlay} onPress={closeContextMenu}>
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
              {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : { style: [StyleSheet.absoluteFill, { pointerEvents: 'none' }] })}
            />
            {selectedMessage && menuPosition && (
              <>
                {floatingReady && (
                  <View
                    style={[
                      styles.messageBubbleClean,
                      selectedMessage.senderId === userId
                        ? {
                            backgroundColor: isDark ? tokens.colors.primary : '#d1e7ff',
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            borderBottomLeftRadius: 20,
                            borderBottomRightRadius: 6,
                          }
                        : {
                            backgroundColor: tokens.colors.elev,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            borderBottomLeftRadius: 6,
                            borderBottomRightRadius: 20,
                          },
                      {
                        position: 'absolute',
                        top: menuPosition.y,
                        left: menuPosition.x,
                        width: menuPosition.width,
                        height: menuPosition.height,
                        zIndex: 30,
                        margin: 0,
                        marginLeft: 0,
                        marginRight: 0,
                        maxWidth: undefined,
                      },
                      Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined,
                    ]}
                    {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : {})}
                  >
                    {selectedMessage.deleted ? (
                      <ThemedText style={[styles.messageTextClean, { color: tokens.colors.muted, fontStyle: 'italic' }]}>{t.deletedMessage}</ThemedText>
                    ) : (
                      <>
                        {selectedMessage.replyTo && selectedMessage.replyTo.messageId && (
                          <View style={[styles.replyInBubble, { 
                            backgroundColor: selectedMessage.senderId === userId 
                              ? (isDark ? '#ffffff' : 'rgba(0,0,0,0.08)') 
                              : 'rgba(0,0,0,0.05)',
                            borderLeftColor: isDark ? '#000000' : tokens.colors.primary 
                          }]}> 
                            <ThemedText style={[styles.replyInBubbleName, { 
                              color: selectedMessage.senderId === userId && isDark ? '#000000' : tokens.colors.primary 
                            }]}>
                              {selectedMessage.replyTo.senderName}
                            </ThemedText>
                            {selectedMessage.replyTo.text && (
                              <ThemedText 
                                style={[styles.replyInBubbleText, { 
                                  color: selectedMessage.senderId === userId && isDark ? '#000000' : tokens.colors.muted 
                                }]} 
                                numberOfLines={1}
                              >
                                {selectedMessage.replyTo.text}
                              </ThemedText>
                            )}
                            {selectedMessage.replyTo.image && (
                              <View style={styles.replyInBubbleImageRow}>
                                <Ionicons 
                                  name="image-outline" 
                                  size={14} 
                                  color={selectedMessage.senderId === userId && isDark ? '#000000' : tokens.colors.muted} 
                                />
                                <ThemedText 
                                  style={[styles.replyInBubbleText, { 
                                    color: selectedMessage.senderId === userId && isDark ? '#000000' : tokens.colors.muted,
                                    marginLeft: 4 
                                  }]}
                                >
                                  {t.photo}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        )}
                        
                        {selectedMessage.text && (
                          <ThemedText style={[styles.messageTextClean, { color: selectedMessage.senderId === userId && isDark ? tokens.colors.primaryContrast : tokens.colors.text }] }>
                            {selectedMessage.text}
                          </ThemedText>
                        )}
                        {selectedMessage.image && (
                          <Image source={{ uri: selectedMessage.image }} style={[styles.messageImage, { borderRadius: 12 }]} resizeMode="cover" />
                        )}
                        {selectedMessage.senderId === userId && (
                          <Ionicons
                            name="checkmark-done"
                            size={15}
                            color={selectedMessage.isRead ? (isDark ? '#ffabb7' : '#34B7F1') : tokens.colors.muted}
                            style={styles.tickIconClean}
                          />
                        )}
                      </>
                    )}
                  </View>
                )}

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
                      const desiredBarSide = overlayPlacement === 'above' ? 'below' : 'above';
                      let top: number;
                      if (desiredBarSide === 'above') {
                        top = menuPosition.y - rbH - gap;
                        if (top < insets.top + gap) top = insets.top + gap;
                        if (top + rbH > menuPosition.y) top = menuPosition.y + menuPosition.height + gap;
                      } else {
                        top = menuPosition.y + menuPosition.height + gap;
                        const screenBottomLimit = Dimensions.get('window').height - insets.bottom - rbH - gap;
                        if (top > screenBottomLimit) {
                          top = Math.max(insets.top + gap, screenBottomLimit);
                        }
                        if (top < menuPosition.y + menuPosition.height + gap) {
                          const alt = menuPosition.y - rbH - gap;
                          if (alt >= insets.top + gap) top = alt;
                        }
                      }
                      const left = Math.max(8, Math.min(menuPosition.x + menuPosition.width / 2 - estWidth / 2, screenW - estWidth - 8));
                      return { top, left };
                    })(),
                    { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)', shadowOpacity: isDark ? 0.08 : 0.15 },
                  ]}
                >
                  {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                    <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={[styles.quickReactionButton, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }]}>
                      <ThemedText style={styles.quickReactionEmoji}>{emoji}</ThemedText>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => setShowReactionPicker((p) => !p)} style={[styles.quickReactionButton, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }]}>
                    <Ionicons name={showReactionPicker ? 'close' : 'add-circle-outline'} size={24} color={isDark ? tokens.colors.muted : '#666'} />
                  </TouchableOpacity>
                  {showReactionPicker && (
                    <View style={[styles.reactionPickerDropdown, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }] }>
                      {['🤩','😎','🔥','🎉','😔','🙌','👌','🥳','🤔','🤯'].map((emoji) => (
                          <TouchableOpacity key={emoji} onPress={() => handleReaction(emoji)} style={[styles.reactionPickerButton, { backgroundColor: isDark ? tokens.colors.elev : 'rgba(255,255,255,0.95)' }]}>
                            <ThemedText style={styles.reactionPickerEmoji}>{emoji}</ThemedText>
                          </TouchableOpacity>
                        ))}
                    </View>
                  )}
                </View>

                <View
                  style={[
                    styles.contextMenuAbsolute,
                    { zIndex: 50 },
                    (() => {
                      const win = Dimensions.get('window');
                      const gap = 8;
                      const baseCount = 4;
                      const showDelete = !!(selectedMessage && String(selectedMessage.senderId) === String(userId) && !selectedMessage.deleted);
                      const count = baseCount + (showDelete ? 1 : 0);
                      const desiredH = count * MENU_ITEM_HEIGHT + Math.max(0, count - 1) * MENU_DIVIDER_HEIGHT;
                      const desiredW = FIXED_MENU_WIDTH;
                      let top: number;
                      if (overlayPlacement === 'above') {
                        top = menuPosition.y - desiredH - gap;
                        if (top < insets.top + 8) top = insets.top + 8;
                      } else {
                        top = menuPosition.y + menuPosition.height + gap;
                        if (top + desiredH + insets.bottom > win.height) top = Math.max(insets.top + 8, win.height - insets.bottom - desiredH - 8);
                      }
                      const left = Math.max(8, Math.min(menuPosition.x, win.width - desiredW - 8));
                      return { top, left, width: desiredW, height: desiredH };
                    })(),
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
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleReplyMessage}>
                      <ThemedText style={[styles.contextMenuText, { color: tokens.colors.text }]}>{t.reply}</ThemedText>
                      <Ionicons name="arrow-undo-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleForwardMessage}>
                      <ThemedText style={[styles.contextMenuText, { color: tokens.colors.text }]}>{t.forward}</ThemedText>
                      <Ionicons name="arrow-redo-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleCopyMessage}>
                      <ThemedText style={[styles.contextMenuText, { color: tokens.colors.text }]}>{t.copy}</ThemedText>
                      <Ionicons name="copy-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                    <TouchableOpacity style={styles.contextMenuItem} onPress={handleReportMessage}>
                      <ThemedText style={[styles.contextMenuText, { color: tokens.colors.text }]}>{t.report}</ThemedText>
                      <Ionicons name="warning-outline" size={20} color={isDark ? tokens.colors.muted : '#333'} />
                    </TouchableOpacity>
                    {String(selectedMessage?.senderId) === String(userId) && !selectedMessage?.deleted ? (
                      <>
                        <View style={[styles.contextMenuDivider, { backgroundColor: tokens.colors.border }]} />
                        <TouchableOpacity style={styles.contextMenuItem} onPress={handleDeleteMessage}>
                          <ThemedText style={[styles.contextMenuText, { color: '#ff3b30' }]}>{t.deleteBtn}</ThemedText>
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
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />
        <ConfirmDialog
          visible={confirmDeleteVisible}
          title={t.deleteMessage}
          message={t.deleteConfirm}
          confirmText={t.deleteBtn}
          cancelText={t.cancel}
          confirmColor={isDark ? '#ff3b30' : '#d32f2f'}
          icon="trash-outline"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteVisible(false)}
        />
        <ConfirmDialog
          visible={confirmCollabVisible}
          title={t.collaborateConfirmTitle}
          message={t.collaborateConfirmMessage}
          confirmText={t.collaborate}
          cancelText={t.cancel}
          confirmColor={tokens.colors.primary}
          icon="people-outline"
          onConfirm={confirmSendCollaborationRequest}
          onCancel={() => setConfirmCollabVisible(false)}
        />
      </KeyboardAvoidingView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  headerNameClean: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
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
    justifyContent: 'space-between',
    gap: 14,
    marginLeft: 0,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  headerActionBtn: {
    padding: 8,
    marginLeft: 10,
    borderRadius: 12,
  },
  headerAvatarClean: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },

  collabContainer: {
    gap: 8,
  },
  collabTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  collabStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  collabHint: {
    fontSize: 12,
  },
  collabButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  collabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collabBtnText: {
    fontSize: 13,
    fontWeight: '700',
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
    color: '#444444',
  },
  announcementId: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
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
  tickIconClean: {
    position: 'absolute',
    bottom: 8,
    right: 8,
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
    maxWidth: '75%',
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
  inputCleanDark: {
    color: '#ffffff',
  },
  sendBtnClean: {
    padding: 8,
  },
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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