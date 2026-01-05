import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { TransitionPresets } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { JsStack } from '../../components/JsStack';
import { NetworkStatus } from '../../components/NetworkStatus';
import { PrivacyTermsModal } from '../../components/PrivacyTermsModal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { AuthProvider } from '../../src/context/AuthContext';
import { ChatNotificationProvider } from '../../src/context/ChatNotificationContext';
import { NotificationProvider } from '../../src/context/NotificationContext';
import { LocaleProvider } from '../../src/context/LocaleContext';
import { setupNotificationListeners } from '../../src/services/notificationService';

const PRIVACY_TERMS_ACCEPTED_KEY = '@hobbiz_privacy_terms_accepted';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isCheckingPrivacy, setIsCheckingPrivacy] = useState(true);
  const [needsAcceptance, setNeedsAcceptance] = useState(false);

  // Check if user has accepted privacy terms
  useEffect(() => {
    checkPrivacyAcceptance();
  }, []);

  const checkPrivacyAcceptance = async () => {
    try {
      const accepted = await AsyncStorage.getItem(PRIVACY_TERMS_ACCEPTED_KEY);
      if (accepted !== 'true') {
        setShowPrivacyModal(true);
        setNeedsAcceptance(true);
      }
    } catch (error) {
      console.error('Error checking privacy acceptance:', error);
      // Show modal by default if there's an error
      setShowPrivacyModal(true);
      setNeedsAcceptance(true);
    } finally {
      setIsCheckingPrivacy(false);
    }
  };

  const handlePrivacyAccept = async () => {
    try {
      await AsyncStorage.setItem(PRIVACY_TERMS_ACCEPTED_KEY, 'true');
      setShowPrivacyModal(false);
      setNeedsAcceptance(false);
    } catch (error) {
      console.error('Error saving privacy acceptance:', error);
    }
  };

  // Don't show the acceptance popup on the 2 document pages.
  // It will re-appear automatically after the user exits them.
  const isPrivacyOrTermsPage = pathname === '/legal/privacy' || pathname === '/legal/terms';
  const privacyModalVisible = showPrivacyModal && !isPrivacyOrTermsPage;

  useEffect(() => {
    const cleanup = setupNotificationListeners(
      (notification) => {
        // Notification received in foreground
      },
      (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.link) {
          try {
            // link format: /chat/:conversationId/:messageId
            const parts = data.link.split('/');
            // parts[0] is empty, parts[1] is 'chat', parts[2] is conversationId, parts[3] is messageId
            if (parts[1] === 'chat' && parts[2]) {
               const params: any = { conversationId: parts[2] };
               if (parts[3]) params.messageId = parts[3];
               // Pass additional metadata if available
               if (data.senderName) params.senderName = data.senderName;
               if (data.senderAvatar) params.senderAvatar = data.senderAvatar;
               if (data.announcementOwnerId) params.announcementOwnerId = data.announcementOwnerId;
               if (data.announcementId) params.announcementId = data.announcementId;
               if (data.announcementTitle) params.announcementTitle = data.announcementTitle;
               if (data.announcementImage) params.announcementImage = data.announcementImage;
               router.push({
                  pathname: '/conversation',
                  params
               });
            } else if (parts[1] === 'users' && parts[3] === 'reviews') {
               // /users/:id/reviews
               router.push({
                  pathname: '/all-reviews',
                  params: { userId: parts[2] }
               });
            } else if (parts[1] === 'announcements' && parts[2]) {
               // /announcements/:id
               router.push({
                  pathname: '/announcement-details',
                  params: { id: parts[2] }
               });
            }
          } catch (e) {
            console.error('Error handling notification link:', e);
          }
        }
      }
    );
    return cleanup;
  }, []);

  if (!fontsLoaded || isCheckingPrivacy) {
    return null;
  }

  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <NotificationProvider>
            <ChatNotificationProvider>
              <SafeAreaProvider>
                <NetworkStatus />
                <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <JsStack
                  screenOptions={{
                    headerShown: false,
                    gestureEnabled: true,
                    gestureDirection: 'horizontal',
                    contentStyle: {
                      backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
                    },
                  }}
                >
                <JsStack.Screen name="(tabs)" options={{ headerShown: false }} />
                <JsStack.Screen name="login" options={{ headerShown: false }} />
                <JsStack.Screen name="signup" options={{ headerShown: false }} />
                <JsStack.Screen name="forgot-password" options={{ headerShown: false }} />
                <JsStack.Screen name="oauth" options={{ headerShown: false }} />
                <JsStack.Screen name="settings" options={{ headerShown: false }} />
                <JsStack.Screen name="notification-settings" options={{ headerShown: false }} />
                <JsStack.Screen name="about" options={{ headerShown: false }} />
                <JsStack.Screen name="legal" options={{ headerShown: false }} />
                <JsStack.Screen name="notifications" options={{ headerShown: false }} />
                <JsStack.Screen name="conversation" options={{ headerShown: false }} />
                <JsStack.Screen name="profile" options={{ headerShown: false }} />
                <JsStack.Screen name="my-announcements" options={{ headerShown: false }} />
                <JsStack.Screen name="edit-announcement" options={{ headerShown: false }} />
                <JsStack.Screen name="post-success" options={{ headerShown: false }} />
                <JsStack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
              </JsStack>
                <StatusBar style="auto" />
              </NavThemeProvider>
              {/* Privacy & Terms Modal */}
              <PrivacyTermsModal
                visible={privacyModalVisible}
                onAccept={handlePrivacyAccept}
              />
            </SafeAreaProvider>
          </ChatNotificationProvider>
        </NotificationProvider>
      </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}