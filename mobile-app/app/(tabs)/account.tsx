import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, Switch, ScrollView, Image, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useLocale } from '../../src/context/LocaleContext';
import { Modal, Text } from 'react-native';
import { useRouter } from 'expo-router';
import storage from '../../src/services/storage';
import { LinearGradient } from 'expo-linear-gradient';
import { ProtectedRoute } from '@/src/components/ProtectedRoute';
import { Toast } from '../../components/ui/Toast';

const TRANSLATIONS = {
  ro: {
    profile: 'Profil',
    greeting: 'Ceau',
    user: 'Utilizator',
    settings: 'Setări',
    myAds: 'Anunțurile mele',
    notifications: 'Notificări',
    darkMode: 'Mod întunecat',
    language: 'Limba',
    aboutUs: 'Despre noi',
    legalInfo: 'Informații legale',
    logout: 'Ieși din cont',
    logoutConfirmTitle: 'Ești sigur(ă) că vrei să te deconectezi?',
    logoutConfirmMessage: 'Te poți reconecta oricând folosind datele tale.',
    cancel: 'Anulează',
    confirmLogout: 'Deconectează-te',
    selectLanguage: 'Selectează limba',
    selectLanguageMessage: 'Alege între Română și English.',
    languageChanged: 'Limba a fost schimbată în Română',
  },
  en: {
    profile: 'Profile',
    greeting: 'Hey',
    user: 'User',
    settings: 'Settings',
    myAds: 'My Announcements',
    notifications: 'Notifications',
    darkMode: 'Dark Mode',
    language: 'Language',
    aboutUs: 'About Us',
    legalInfo: 'Legal Information',
    logout: 'Log Out',
    logoutConfirmTitle: 'Are you sure you want to log out?',
    logoutConfirmMessage: 'You can log back in anytime using your credentials.',
    cancel: 'Cancel',
    confirmLogout: 'Log Out',
    selectLanguage: 'Select Language',
    selectLanguageMessage: 'Choose between Română and English.',
    languageChanged: 'Language changed to English',
  },
};

type RowSpec = { key: string; label: string; icon: string; action?: () => void; type?: 'switch' | 'danger' };

export default function AccountScreen() {
  const { isDark, setMode, tokens } = useAppTheme();
  const { locale, setLocale: setGlobalLocale } = useLocale();

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const [confirmVisible, setConfirmVisible] = React.useState(false);
  const [languageModalOpen, setLanguageModalOpen] = React.useState(false);
  const [toastVisible, setToastVisible] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');

  const t = TRANSLATIONS[locale === 'en' ? 'en' : 'ro'];

  const accountRows: RowSpec[] = [
    { key: 'settings', label: t.settings, icon: 'settings-outline', action: () => router.push('/settings') },
    { key: 'my-ads', label: t.myAds, icon: 'megaphone-outline', action: () => router.push('/my-announcements') },
    // Deschide ecranul dedicat de setări notificări (meniul complet deja implementat)
    { key: 'notifications', label: t.notifications, icon: 'notifications-outline', action: () => router.push('/notification-settings') },
    { key: 'profile', label: t.profile, icon: 'person-outline', action: () => router.push('/profile') },
    { key: 'darkmode', label: t.darkMode, icon: 'moon-outline', type: 'switch' },
    { key: 'language', label: t.language, icon: 'language-outline', action: () => setLanguageModalOpen(true) },
  ];

  const infoRows: RowSpec[] = [
    { key: 'about', label: t.aboutUs, icon: 'information-circle-outline', action: () => router.push('/about') },
    { key: 'legal', label: t.legalInfo, icon: 'document-text-outline', action: () => router.push('/legal') },
  ];

  // Combine primary and accent for a pleasing gradient (left: primary -> right: accent)
  // const primaryColor = '#355070';
  // const accent = '#F8B195';
  // const accentLight = '#FCEDE6';

  // Centralized per-screen palette so dark-mode tweaks are simple in one place
  const palette = React.useMemo(() => ({
    // Header background (use a flat gradient; you can make a real gradient by changing end color)
    headerBgStart: isDark ? '#f51866' : '#F8B195',
    headerBgEnd: isDark ? tokens.colors.primaryHover : '#F8B195',
    headerText: '#ffffff',
    // Name accent color within header greeting
    nameAccent: isDark ? '#121212' : '#355070',
    // Background for circular icons on rows
    iconBg: isDark ? tokens.colors.elev : '#F3F5F6',
  // Icon color (pink in dark mode)
  iconColor: isDark ? '#f51866' : tokens.colors.text,
    // Track ON color for the dark mode switch and generic confirm buttons
    emphasisBg: isDark ? tokens.colors.primary : '#F8B195',
    // Logout color accent
    danger: isDark ? '#ff5566' : '#ff2d2d',
  }), [isDark, tokens]);

  const displayName = user?.firstName || user?.lastName ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() : 'Utilizator';
  const { width } = useWindowDimensions();
  // Treat widths less than 768px as phone-sized devices
  const isPhone = width < 768;
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  // How much of the sun should remain visible when we push it into the status bar area.
  // Increase this value to show more of the sun (pixels). We use a modest default so it still overlaps but not too much.
  const sunOverlap = 28;
  // Small device-specific nudge to ensure the sun reaches the very top on phones where a thin gap appears.
  const sunTopNudge = Platform.select({ android: 8, ios: 4, default: 6 });
  // On web safe-area insets are usually 0 which would produce a positive top (gap).
  // Use a different formula for web so the sun is moved up into the corner.
  const sunTop = Platform.OS === 'web'
    ? -Math.round(sunOverlap / 2)
    : -insets.top + sunOverlap - (sunTopNudge as number);

  return (
    <ProtectedRoute>
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg }]}>      
      <ScrollView contentContainerStyle={[styles.scrollContent, { position: 'relative' }]} showsVerticalScrollIndicator={false}>
        {/* Decorative sun image stuck to the very top-right (overlaps status bar) but is part of scroll content so it will scroll away. */}
        <View
          style={[styles.sunWrapper, { position: 'absolute', top: sunTop, right: 0 }, Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined]}
          {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : {})}
        > 
          <Image
            source={isDark ? require('../../assets/images/night.png') : require('../../assets/images/sun.png')}
            resizeMode="contain"
            style={[styles.sunImage, isDark && styles.nightShift]}
          />
        </View>
        {/* Header with Gradient Background */}
        <LinearGradient
          colors={[palette.headerBgStart, palette.headerBgEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.headerRow}
          >
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >            
              <Ionicons name="arrow-back" size={24} color={palette.headerText} />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>{t.profile}</ThemedText>
          </View>
          {/* Greeting placed in the blue header. Name is pulled from user and colored yellow. */}
          <View style={styles.greetingContainer}>
            {/* Render greeting differently on phones vs larger devices:
                - On phones: "Ceau <Prenume>\n<Nume>!"
                - On larger devices: "Ceau <Prenume> <Nume>!" all on one line
            */}
            <ThemedText style={[styles.greetingText, { color: palette.headerText }]}>
              {t.greeting}{' '}
              {isPhone ? (
                <>
                  <ThemedText style={[styles.greetingText, { color: palette.nameAccent }]}>{firstName || t.user}</ThemedText>
                  {lastName ? <ThemedText style={[styles.greetingText, { color: palette.nameAccent }]}>{' \n'}{lastName}</ThemedText> : null}
                  <ThemedText style={[styles.greetingText, { color: palette.headerText }]}>{'!'}</ThemedText>
                </>
              ) : (
                <ThemedText style={[styles.greetingText, { color: palette.nameAccent }]}>{(firstName || lastName) ? `${firstName} ${lastName}`.trim() : t.user}!</ThemedText>
              )}
            </ThemedText>
          </View>
         </LinearGradient>

        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: tokens.colors.surface }]}>
          <View style={styles.avatarContainer}>
              <View style={styles.avatarOuter}>
              <View style={[styles.halfTop, { backgroundColor: isDark ? 'rgb(40, 40, 40)' : '#ffffff' }]} />
              <View style={[styles.halfBottom, { backgroundColor: isDark ? 'rgb(40, 40, 40)' : '#ffffff' }]} />
              <View style={[styles.avatarInner, { backgroundColor: tokens.colors.surface }]}> 
                {user?.avatar ? (
                  <Image 
                    source={{ uri: user.avatar }} 
                    style={styles.avatar}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: tokens.colors.surface }]}>
                    <Ionicons name="person" size={50} color={palette.iconColor} />
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <ThemedText style={[styles.userName, { color: tokens.colors.text }]}>
            {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : t.user}
          </ThemedText>
          
          {user?.phone && (
            <ThemedText style={[styles.userInfo, { color: tokens.colors.muted }]}>
              {user.phone}
            </ThemedText>
          )}
          
          {user?.email && (
            <ThemedText style={[styles.userInfo, { color: tokens.colors.muted }]}>
              {user.email}
            </ThemedText>
          )}
        </View>

        {/* Account Options Group */}
        <View style={styles.section}>          
          {accountRows.map((r) => {
            if (r.type === 'switch') {
              return (
                <View key={r.key} style={[styles.row, { backgroundColor: tokens.colors.surface }]}>                  
                  <View style={styles.rowLeft}>                    
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? tokens.colors.elev : '#F3F5F6' }]}>
                      <Ionicons name={r.icon as any} size={20} color={palette.iconColor} />
                    </View>
                    <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{r.label}</ThemedText>
                  </View>
                  <Switch
                    value={isDark}
                    onValueChange={(v) => setMode(v ? 'dark' : 'light')}
                    thumbColor={'#ffffff'}
                    trackColor={{ false: tokens.colors.border, true: '#f51866' }}
                  />
                </View>
              );
            }
            return (
              <TouchableOpacity
                key={r.key}
                activeOpacity={0.7}
                style={[styles.row, { backgroundColor: tokens.colors.surface }]}
                onPress={r.action}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: palette.iconBg }]}>
                    <Ionicons name={r.icon as any} size={20} color={palette.iconColor} />
                  </View>
                  <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{r.label}</ThemedText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {r.key === 'language' && (
                    <ThemedText style={{ color: tokens.colors.muted }}>{locale === 'en' ? 'English' : 'Română'}</ThemedText>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={tokens.colors.muted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Info Options Group */}
        <View style={styles.section}>
          {infoRows.map((r) => (
            <TouchableOpacity
              key={r.key}
              activeOpacity={0.7}
              style={[styles.row, { backgroundColor: tokens.colors.surface }]}
              onPress={r.action}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: palette.iconBg }]}>
                  <Ionicons name={r.icon as any} size={20} color={palette.iconColor} />
                </View>
                <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{r.label}</ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={tokens.colors.muted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.logoutTextContainer}
            onPress={() => setConfirmVisible(true)}
          >
            <ThemedText style={[styles.logoutTextRed, { color: palette.danger }]}>{t.logout}</ThemedText>
            <View style={[styles.logoutUnderline, { backgroundColor: palette.danger }]} />
          </TouchableOpacity>
        </View>

        {/* Confirmation modal */}
        <Modal
          visible={confirmVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}> 
            <View style={[styles.modalCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}> 
              <ThemedText style={[styles.modalTitle, { color: tokens.colors.text }]}>{t.logoutConfirmTitle}</ThemedText>
              <ThemedText style={[styles.modalMessage, { color: tokens.colors.muted }]}>{t.logoutConfirmMessage}</ThemedText>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setConfirmVisible(false)}
                >
                  <ThemedText style={{ color: tokens.colors.text }}>{t.cancel}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm, { backgroundColor: palette.emphasisBg }]}
                  onPress={async () => {
                    try {
                      await logout();
                      setConfirmVisible(false);
                      router.replace('/login');
                    } catch (e) {
                      console.warn('Logout failed', e);
                      setConfirmVisible(false);
                    }
                  }}
                >
                  <ThemedText style={{ color: '#ffffff' }}>{t.confirmLogout}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {/* Language selector modal */}
        <Modal
          visible={languageModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setLanguageModalOpen(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}> 
            <View style={[styles.modalCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}> 
              <TouchableOpacity style={styles.closeButton} onPress={() => setLanguageModalOpen(false)}>
                <Ionicons name="close" size={20} color={tokens.colors.muted} />
              </TouchableOpacity>
              <ThemedText style={[styles.modalTitle, { color: tokens.colors.text }]}>{t.selectLanguage}</ThemedText>
                <View style={{ marginTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { marginBottom: 8 }]}
                    onPress={async () => {
                      await setGlobalLocale('ro');
                      setLanguageModalOpen(false);
                      // Wait for modal close animation to complete before showing toast
                      setTimeout(() => {
                        setToastMessage(TRANSLATIONS.ro.languageChanged);
                        setToastVisible(true);
                      }, 300);
                    }}
                  >
                    <ThemedText style={{ color: tokens.colors.text, fontSize: 16 }}>Română</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { marginBottom: 8 }]}
                    onPress={async () => {
                      await setGlobalLocale('en');
                      setLanguageModalOpen(false);
                      // Wait for modal close animation to complete before showing toast
                      setTimeout(() => {
                        setToastMessage(TRANSLATIONS.en.languageChanged);
                        setToastVisible(true);
                      }, 300);
                    }}
                  >
                    <ThemedText style={{ color: tokens.colors.text, fontSize: 16 }}>English</ThemedText>
                  </TouchableOpacity>
                </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      
      {/* Toast notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type="success"
        duration={3000}
        onHide={() => setToastVisible(false)}
      />
    </ThemedView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  scrollContent: { 
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // keep content left-aligned; title will sit to the right of the back button
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 999, 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 12,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 28,
    marginBottom: 54,
    paddingHorizontal: 4,
  },
  greetingText: 
  {
    fontSize: 40,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
    lineHeight: 44,
  },
  profileCard: {
    marginTop: -80,
    marginHorizontal: 20,
    borderRadius: 16,
    paddingTop: 70,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  avatarContainer: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  avatarBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#2ecc71',
  },
  // Two-tone avatar outer ring
  avatarOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
  },
  halfBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  avatarInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
  },
  avatarPlaceholder: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 14,
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingVertical: 16, 
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { 
    fontSize: 16, 
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
  },
  modalCard: { 
    width: '100%', 
    maxWidth: 420, 
    borderRadius: 16, 
    padding: 24, 
    borderWidth: 1,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 10,
  },
  modalMessage: { 
    fontSize: 15, 
    marginBottom: 20,
    lineHeight: 22,
  },
  modalButtons: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end', 
    gap: 12,
  },
  modalBtn: { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 12,
  },
  modalBtnCancel: { 
    backgroundColor: 'transparent',
  },
  modalBtnConfirm: { 
    paddingHorizontal: 24,
  },
  logoutTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    width: '100%',
    backgroundColor: 'transparent',
  },
  logoutTextRed: {
    color: '#ff2d2d',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  logoutUnderline: {
    marginTop: 6,
    width: 56,
    height: 4,
    backgroundColor: '#ff2d2d',
    borderRadius: 2,
  },
  // Sun decoration in top-right corner
  sunWrapper: {
    position: 'absolute',
    width: 128,
    height: 128,
    zIndex: 50,
    elevation: 50,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunImage: {
    width: '100%',
    height: '100%',
  },
  nightShift: {
    transform: [{ translateY: 8 }],
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});