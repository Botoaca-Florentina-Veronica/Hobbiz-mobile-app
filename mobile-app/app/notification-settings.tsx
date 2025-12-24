
import React, { useState, useEffect } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, Switch, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useRouter } from 'expo-router';
import api from '../src/services/api';
import { Toast } from '../components/ui/Toast';
import { useLocale } from '../src/context/LocaleContext';
import { useAuth } from '../src/context/AuthContext';

export default function NotificationSettingsScreen() {
  const { tokens, isDark } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { locale } = useLocale();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Default settings
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    messages: true,
    reviews: true,
    favorites: true,
    promotions: false
  });

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const TRANSLATIONS: Record<string, any> = {
    ro: {
      title: 'Setări Notificări',
      email: 'Notificări prin Email',
      emailDesc: 'Primește actualizări importante pe email',
      push: 'Notificări Push',
      pushDesc: 'Primește notificări pe telefon',
      messages: 'Mesaje Noi',
      messagesDesc: 'Notificări când primești un mesaj nou',
      reviews: 'Recenzii Noi',
      reviewsDesc: 'Notificări când primești o recenzie nouă',
      favorites: 'Anunțuri Adăugate la Favorite',
      favoritesDesc: 'Notificări când cineva adaugă anunțurile tale la favorite',
      promotions: 'Promoții și Noutăți',
      promotionsDesc: 'Fii la curent cu ultimele noutăți',
      saveSuccess: 'Setările au fost salvate',
      saveError: 'Nu s-au putut salva setările',
    },
    en: {
      title: 'Notification Settings',
      email: 'Email Notifications',
      emailDesc: 'Receive important updates via email',
      push: 'Push Notifications',
      pushDesc: 'Receive notifications on your phone',
      messages: 'New Messages',
      messagesDesc: 'Notify when you receive a new message',
      reviews: 'New Reviews',
      reviewsDesc: 'Notify when you receive a new review',
      favorites: 'Announcements Added to Favorites',
      favoritesDesc: 'Notify when someone adds your announcements to favorites',
      promotions: 'Promotions & News',
      promotionsDesc: 'Stay updated with the latest news',
      saveSuccess: 'Settings saved successfully',
      saveError: 'Could not save settings',
    }
  };

  const t = TRANSLATIONS[locale === 'en' ? 'en' : 'ro'];

  // Initialize settings from user context or fetch if not available
  useEffect(() => {
    if (user?.notificationSettings) {
      setSettings({
        email: user.notificationSettings.email ?? true,
        push: user.notificationSettings.push ?? true,
        messages: user.notificationSettings.messages ?? true,
        reviews: user.notificationSettings.reviews ?? true,
        favorites: true,
        promotions: user.notificationSettings.promotions ?? false
      });
      setLoading(false);
    } else {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users/profile');
      if (res.data && res.data.notificationSettings) {
        setSettings(res.data.notificationSettings);
      } else {
        // If no settings exist on backend, keep defaults
        console.log('No notification settings found, using defaults');
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      showToast(t.saveError, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof typeof settings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    
    // Auto-save on toggle
    try {
      setSaving(true);
      await api.put('/api/users/profile', { notificationSettings: newSettings });
      console.log('✓ Notification settings saved successfully');
      // Optionally show a subtle success indicator
      // showToast(t.saveSuccess, 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(t.saveError, 'error');
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: !newSettings[key] }));
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const renderSettingItem = (key: keyof typeof settings, label: string, description: string) => (
    <View style={[styles.settingRow, { borderBottomColor: tokens.colors.borderNeutral }]}>
      <View style={styles.settingInfo}>
        <ThemedText style={[styles.settingLabel, { color: tokens.colors.text }]}>{label}</ThemedText>
        <ThemedText style={[styles.settingDesc, { color: tokens.colors.muted }]}>{description}</ThemedText>
      </View>
      <Switch
        trackColor={{ false: tokens.colors.border, true: tokens.colors.primary }}
        thumbColor={Platform.OS === 'ios' ? '#fff' : (settings[key] ? '#fff' : '#f4f3f4')}
        ios_backgroundColor={tokens.colors.border}
        onValueChange={() => handleToggle(key)}
        value={settings[key]}
        disabled={loading}
      />
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top + 12 }]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.borderNeutral }]}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{t.title}</ThemedText>
        {saving && <ActivityIndicator size="small" color={tokens.colors.primary} style={{ marginLeft: 'auto' }} />}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, borderColor: tokens.colors.borderNeutral }]}>
          {renderSettingItem('push', t.push, t.pushDesc)}
          {renderSettingItem('email', t.email, t.emailDesc)}
          {renderSettingItem('messages', t.messages, t.messagesDesc)}
          {renderSettingItem('reviews', t.reviews, t.reviewsDesc)}
          {renderSettingItem('favorites', t.favorites, t.favoritesDesc)}
          {renderSettingItem('promotions', t.promotions, t.promotionsDesc)}
        </View>
      </ScrollView>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={3000}
        onHide={() => setToastVisible(false)}
      />
    </ThemedView>
  );
}

import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 20, fontWeight: '700' },
  content: { padding: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
  },
});