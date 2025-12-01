import React, { useState, useEffect } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Platform } from 'react-native';
import { Toast } from '../components/ui/Toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import storage from '../src/services/storage';
import { router } from 'expo-router';
import { updateEmail, updatePassword, deleteAccount } from '../src/services/auth';
import { useAuth } from '../src/context/AuthContext';
import { useLocale } from '../src/context/LocaleContext';
import * as FileSystem from 'expo-file-system';

type SettingRow = { key: string; label: string; icon?: string; expandable?: boolean };

export default function SettingsScreen() {
  const { tokens, isDark } = useAppTheme();
  const { logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Toast state for notifications
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const { locale } = useLocale();

  const TRANSLATIONS: Record<string, any> = {
    ro: {
      title: 'Setări',
      settings: {
        'change-password': 'Schimbă parola',
        'change-email': 'Schimbă email-ul',
        'archived-announcements': 'Anunțuri arhivate',
        notifications: 'Setează notificările',
        billing: 'Descarcă datele mele',
        'logout-devices': 'Ieși din cont de pe toate dispozitivele',
        'delete-account': 'Șterge contul',
      },
      allFieldsRequired: 'Toate câmpurile sunt obligatorii',
      passwordMinLength: 'Parola nouă trebuie să aibă cel puțin 6 caractere',
      passwordChangedSuccess: 'Parola a fost schimbată cu succes!',
      cannotChangePassword: 'Nu s-a putut schimba parola',
      emailInvalid: 'Format email invalid',
      emailUpdatedSuccess: 'Email-ul a fost actualizat cu succes!',
      cannotUpdateEmail: 'Nu s-a putut actualiza email-ul',
      currentPasswordLabel: 'Parola curentă',
      newPasswordLabel: 'Parola nouă',
      currentPasswordPlaceholder: 'Introduceți parola curentă',
      newPasswordPlaceholder: 'Introduceți noua parolă',
      saving: 'Se salvează...',
      save: 'Salvează',
      newEmailLabel: 'Email nou',
      newEmailPlaceholder: 'Introduceți noul email',
      confirmPasswordLabel: 'Confirmă parola',
      confirmPasswordPlaceholder: 'Introduceți parola pentru confirmare',
      deleteAccountTitle: 'Ștergere cont',
      deleteAccountMessage: 'Această acțiune este permanentă. Ești sigur(ă) că vrei să-ți ștergi contul și toate anunțurile asociate?',
      cancel: 'Anulează',
      delete: 'Șterge',
      accountDeletedTitle: 'Cont șters',
      accountDeletedMessage: 'Contul tău a fost șters cu succes.',
      error: 'Eroare',
      downloadingData: 'Se descarcă datele...',
      dataDownloadSuccess: 'Datele tale au fost descărcate cu succes!',
      dataDownloadError: 'Nu s-a putut descărca datele. Încearcă din nou.',
      sharingNotAvailable: 'Partajarea nu este disponibilă pe acest dispozitiv.',
    },
    en: {
      title: 'Settings',
      settings: {
        'change-password': 'Change password',
        'change-email': 'Change email',
        'archived-announcements': 'Archived announcements',
        notifications: 'Notifications',
        billing: 'Download my data',
        'logout-devices': 'Log out from all devices',
        'delete-account': 'Delete account',
      },
      allFieldsRequired: 'All fields are required',
      passwordMinLength: 'New password must be at least 6 characters',
      passwordChangedSuccess: 'Password changed successfully!',
      cannotChangePassword: 'Could not change password',
      emailInvalid: 'Invalid email format',
      emailUpdatedSuccess: 'Email updated successfully!',
      cannotUpdateEmail: 'Could not update email',
      currentPasswordLabel: 'Current password',
      newPasswordLabel: 'New password',
      currentPasswordPlaceholder: 'Enter current password',
      newPasswordPlaceholder: 'Enter new password',
      saving: 'Saving...',
      save: 'Save',
      newEmailLabel: 'New email',
      newEmailPlaceholder: 'Enter new email',
      confirmPasswordLabel: 'Confirm password',
      confirmPasswordPlaceholder: 'Enter password to confirm',
      deleteAccountTitle: 'Delete account',
      deleteAccountMessage: 'This action is permanent. Are you sure you want to delete your account and all associated announcements?',
      cancel: 'Cancel',
      delete: 'Delete',
      accountDeletedTitle: 'Account deleted',
      accountDeletedMessage: 'Your account has been deleted successfully.',
      error: 'Error',
      downloadingData: 'Downloading data...',
      dataDownloadSuccess: 'Your data has been downloaded successfully!',
      dataDownloadError: 'Could not download data. Please try again.',
      sharingNotAvailable: 'Sharing is not available on this device.',
    }
  };

  const t = TRANSLATIONS[locale === 'en' ? 'en' : 'ro'];

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast(t.allFieldsRequired, 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast(t.passwordMinLength, 'error');
      return;
    }

    setIsLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      showToast(t.passwordChangedSuccess, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setExpandedSection(null);
    } catch (error: any) {
      showToast(error?.message || t.cannotChangePassword, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail || !confirmPassword) {
      showToast(t.allFieldsRequired, 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showToast(t.emailInvalid, 'error');
      return;
    }

    setIsLoading(true);
    try {
      await updateEmail(newEmail, confirmPassword);
      showToast(t.emailUpdatedSuccess, 'success');
      setNewEmail('');
      setConfirmPassword('');
      setExpandedSection(null);
    } catch (error: any) {
      showToast(error?.message || t.cannotUpdateEmail, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const settings: SettingRow[] = [
    { key: 'change-password', label: 'Schimbă parola', icon: 'key-outline', expandable: true },
    { key: 'change-email', label: 'Schimbă email-ul', icon: 'mail-outline', expandable: true },
    { key: 'archived-announcements', label: 'Anunțuri arhivate', icon: 'archive-outline' },
    { key: 'notifications', label: 'Setează notificările', icon: 'notifications-outline' },
    { key: 'billing', label: 'Descarcă datele mele', icon: 'download-outline' },
    { key: 'logout-devices', label: 'Ieși din cont de pe toate dispozitivele', icon: 'phone-portrait-outline' },
    { key: 'delete-account', label: 'Șterge contul', icon: 'trash-outline' },
  ];

  const getSettingLabel = (key: string, defaultLabel: string) => {
    return (t && t.settings && t.settings[key]) ? t.settings[key] : defaultLabel;
  };

  const toggleSection = (key: string) => {
    setExpandedSection(expandedSection === key ? null : key);
  };

  const handleLogoutAllDevices = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogoutAllDevices = async () => {
    setLogoutModalVisible(false);
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/logout-all-devices`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${await storage.getItemAsync('userToken')}`,
                },
              });

      if (!response.ok) {
        throw new Error('Failed to logout from all devices');
      }

      await logout();
      showToast(
        locale === 'ro' ? 'Ai fost deconectat de pe toate dispozitivele' : 'Logged out from all devices successfully',
        'success'
      );
      router.replace('/login');
    } catch (e: any) {
      showToast(
        e?.message || (locale === 'ro' ? 'Nu s-a putut efectua deconectarea' : 'Could not logout'),
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t.deleteAccountTitle,
      t.deleteAccountMessage,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await deleteAccount();
              await logout();
              Alert.alert(t.accountDeletedTitle, t.accountDeletedMessage);
              router.replace('/login');
            } catch (e: any) {
              Alert.alert(t.error, e?.message || t.error);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleDownloadData = async () => {
    setIsLoading(true);
    try {
      // Fetch user data from API
      const token = await storage.getItemAsync('userToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();

      // Create the JSON object with required fields
      const exportData = {
        nume: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'N/A',
        email: userData.email || 'N/A',
        telefon: userData.phone || 'N/A',
        locatie: userData.localitate || 'N/A',
        dataInregistrarii: userData.createdAt 
          ? new Date(userData.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'ro-RO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : 'N/A',
        exportatLa: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `datele_mele_${new Date().toISOString().split('T')[0]}.json`;
      
      // Write file to cache. Sharing may not be available in all environments,
      // so we simply persist the JSON to cache and notify the user where it is saved.
      const cacheDir = (FileSystem as any).cacheDirectory || '';
      const fileUri = cacheDir + fileName;
      await (FileSystem as any).writeAsStringAsync(fileUri, jsonString);
      console.log('Exported user data to', fileUri);
      showToast(t.dataDownloadSuccess, 'success');
    } catch (e: any) {
      console.error('Download data error:', e);
      showToast(t.dataDownloadError, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{t.title}</ThemedText>
        </View>

        {/* Settings List */}
        <View style={[styles.card, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, borderColor: tokens.colors.borderNeutral }]}>
          {settings.map((item, index) => (
            <View key={item.key}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.row,
                  { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, borderBottomColor: tokens.colors.borderNeutral },
                  index === settings.length - 1 && !expandedSection && styles.lastRow,
                ]}
                onPress={() => {
                  if (item.expandable) return toggleSection(item.key);
                  if (item.key === 'delete-account') return handleDeleteAccount();
                  if (item.key === 'archived-announcements') return router.push('/archived-announcements' as any);
                  if (item.key === 'logout-devices') return handleLogoutAllDevices();
                  if (item.key === 'notifications') return router.push('/notification-settings' as any);
                  if (item.key === 'billing') return handleDownloadData();
                  // Aici poți adăuga alte acțiuni simple non-expandable
                  return null;
                }}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: tokens.colors.elev }]}> 
                    <Ionicons name={item.icon as any} size={20} color={tokens.colors.text} />
                  </View>
                  <ThemedText style={[styles.rowLabel, { color: tokens.colors.text }]}>{getSettingLabel(item.key, item.label)}</ThemedText>
                </View>
              </TouchableOpacity>

              {/* Expanded content for Change Password */}
              {expandedSection === 'change-password' && item.key === 'change-password' && (
                <View style={[styles.expandedContent, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.bg, borderColor: tokens.colors.borderNeutral }]}> 
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: tokens.colors.text }]}>{t.currentPasswordLabel}</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
                      placeholder={t.currentPasswordPlaceholder}
                      placeholderTextColor={tokens.colors.muted}
                      secureTextEntry
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: tokens.colors.text }]}>{t.newPasswordLabel}</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
                      placeholder={t.newPasswordPlaceholder}
                      placeholderTextColor={tokens.colors.muted}
                      secureTextEntry
                      value={newPassword}
                      onChangeText={setNewPassword}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: tokens.colors.primary }]}
                    activeOpacity={0.8}
                    onPress={handleChangePassword}
                    disabled={isLoading}
                  >
                    <ThemedText style={[styles.saveButtonText, { color: tokens.colors.primaryContrast }]}> {isLoading ? t.saving : t.save}</ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Expanded content for Change Email */}
              {expandedSection === 'change-email' && item.key === 'change-email' && (
                <View style={[styles.expandedContent, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.bg, borderColor: tokens.colors.borderNeutral }]}> 
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: tokens.colors.text }]}>{t.newEmailLabel}</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
                      placeholder={t.newEmailPlaceholder}
                      placeholderTextColor={tokens.colors.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={newEmail}
                      onChangeText={setNewEmail}
                    />
                  </View>
                  <View style={styles.formGroup}>
                    <ThemedText style={[styles.label, { color: tokens.colors.text }]}>{t.confirmPasswordLabel}</ThemedText>
                    <TextInput
                      style={[styles.input, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border, color: tokens.colors.text }]}
                      placeholder={t.confirmPasswordPlaceholder}
                      placeholderTextColor={tokens.colors.muted}
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: tokens.colors.primary }]}
                    activeOpacity={0.8}
                    onPress={handleChangeEmail}
                    disabled={isLoading}
                  >
                    <ThemedText style={[styles.saveButtonText, { color: tokens.colors.primaryContrast }]}>{isLoading ? t.saving : t.save}</ThemedText>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      {/* Custom Toast Notification for this screen */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={3000}
        onHide={() => setToastVisible(false)}
      />

      {/* Custom Logout All Devices Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.logoutModalCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            {/* Icon and Title */}
            <View style={[styles.modalIconContainer, { backgroundColor: isDark ? 'rgba(245, 24, 102, 0.15)' : 'rgba(245, 24, 102, 0.1)' }]}>
              <Ionicons name="phone-portrait-outline" size={32} color="#F51866" />
            </View>
            
            <ThemedText style={[styles.modalTitle, { color: tokens.colors.text }]}>
              {locale === 'ro' ? 'Ieși de pe toate dispozitivele' : 'Logout from all devices'}
            </ThemedText>
            
            <ThemedText style={[styles.modalMessage, { color: tokens.colors.muted }]}>
              {locale === 'ro' 
                ? 'Această acțiune va deconecta contul tău de pe toate dispozitivele pe care ești autentificat. Continui?' 
                : 'This action will log out your account from all devices where you are logged in. Continue?'}
            </ThemedText>

            {/* Action Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: isDark ? tokens.colors.elev : tokens.colors.bg, borderColor: tokens.colors.border }]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.8}
              >
                <ThemedText style={[styles.modalButtonText, { color: tokens.colors.text }]}>{t.cancel}</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm, { backgroundColor: '#F51866' }]}
                onPress={confirmLogoutAllDevices}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <ThemedText style={[styles.modalButtonText, { color: '#ffffff', fontWeight: '700' }]}>
                  {isLoading ? (locale === 'ro' ? 'Se procesează...' : 'Processing...') : (locale === 'ro' ? 'Ieși' : 'Logout')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 24, fontWeight: '600' },
  card: {
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // when lastRow is used we also hide the bottom separator so it doesn't show
  // as an extra line beneath the last item (card already has an outer border)
  lastRow: { marginBottom: 0, borderBottomWidth: 0, borderBottomColor: 'transparent' },
  rowLabel: { fontSize: 15, fontWeight: '500', flexShrink: 1 },
  expandedContent: {
    marginTop: 12,
    padding: 18,
    borderRadius: 8,
    borderWidth: 1,
    gap: 16,
  },
  formGroup: {
    gap: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 15,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Custom Logout Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoutModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1.5,
  },
  modalButtonConfirm: {
    shadowColor: '#F51866',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});