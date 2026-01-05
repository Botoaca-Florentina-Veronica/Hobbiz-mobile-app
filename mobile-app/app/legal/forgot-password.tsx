import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import api from '../../src/services/api';
import { useAppTheme } from '../../src/context/ThemeContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '../../components/themed-text-input';
import { Toast } from '../../components/ui/Toast';

export const options = {
  headerShown: false,
};

export default function ForgotPasswordScreen() {
  const { tokens } = useAppTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const locale = (Intl && Intl?.DateTimeFormat && (Intl.DateTimeFormat().resolvedOptions().locale || 'ro')) || 'ro';
  const copy = useMemo(() => {
    const isEn = locale === 'en';
    return {
      title: isEn ? 'Reset password' : 'Resetare parolă',
      email: isEn ? 'Email address' : 'Adresa ta de email',
      code: isEn ? 'Reset code' : 'Cod de resetare',
      newPassword: isEn ? 'New password' : 'Parola nouă',
      request: isEn ? 'Send code' : 'Trimite cod',
      confirm: isEn ? 'Reset password' : 'Resetează parola',
      sent: isEn ? 'If an account exists, a code was sent.' : 'Dacă există un cont, a fost trimis un cod.',
      doneTitle: isEn ? 'Success' : 'Succes',
      doneMsg: isEn ? 'Password reset successfully. You can sign in.' : 'Parola a fost resetată. Te poți autentifica.',
      back: isEn ? 'Back to login' : 'Înapoi la login',
    };
  }, [locale]);

  const getCardWidth = (): number | string => {
    if (width < 600) return '100%';
    if (width < 900) return '80%';
    if (width < 1200) return '50%';
    return '40%';
  };

  const isSmallDevice = width < 600;
  const isMediumDevice = width >= 600 && width < 900;
  const isLargeDevice = width >= 900 && width < 1200;

  const responsiveSizes = {
    titleSize: isSmallDevice ? 24 : isMediumDevice ? 28 : isLargeDevice ? 32 : 36,
    inputPadding: isSmallDevice ? 12 : isMediumDevice ? 16 : 16,
    inputFontSize: isSmallDevice ? 15 : isMediumDevice ? 18 : 17,
    buttonPadding: isSmallDevice ? 14 : isMediumDevice ? 18 : 18,
    buttonFontSize: isSmallDevice ? 15 : isMediumDevice ? 18 : 17,
    cardPadding: isSmallDevice ? 24 : isMediumDevice ? 28 : isLargeDevice ? 32 : 36,
    cardGap: isSmallDevice ? 16 : isMediumDevice ? 18 : isLargeDevice ? 20 : 22,
    linkFontSize: isSmallDevice ? 13 : isMediumDevice ? 16 : 15,
  };

  const cardStyle = {
    width: getCardWidth() as any,
    maxWidth: 650,
    alignSelf: 'center' as const,
    padding: responsiveSizes.cardPadding,
    gap: responsiveSizes.cardGap,
  };

  const requestCode = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await api.post('/api/users/password-reset/request', { email: email.trim() });
      setInfo(copy.sent);
      setStep(2);
      setToastMessage(copy.sent);
      setToastType('success');
      setToastVisible(true);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.error || e?.message || 'Eroare';
      setError(errorMsg);
      setToastMessage(errorMsg);
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      await api.post('/api/users/password-reset/confirm', {
        email: email.trim(),
        code: code.trim(),
        newPassword,
      });
      setToastMessage(copy.doneMsg);
      setToastType('success');
      setToastVisible(true);
      setTimeout(() => {
        router.replace('/legal/login');
      }, 1500);
    } catch (e: any) {
      const errorMsg = e?.response?.data?.error || e?.message || 'Eroare';
      setError(errorMsg);
      setToastMessage(errorMsg);
      setToastType('error');
      setToastVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tokens.colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, cardStyle, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}> 
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} accessibilityLabel="Back" style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={tokens.colors.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.title, { color: tokens.colors.text, fontSize: responsiveSizes.titleSize }]}>
              {copy.title}
            </ThemedText>
            <View style={styles.backBtn} />
          </View>

          <ThemedTextInput
            style={[
              styles.input,
              {
                borderColor: tokens.colors.border,
                color: tokens.colors.text,
                paddingHorizontal: 14,
                paddingVertical: responsiveSizes.inputPadding,
                fontSize: responsiveSizes.inputFontSize,
              },
            ]}
            placeholder={copy.email}
            placeholderTextColor={tokens.colors.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          {step === 2 ? (
            <>
              <ThemedTextInput
                style={[
                  styles.input,
                  {
                    borderColor: tokens.colors.border,
                    color: tokens.colors.text,
                    paddingHorizontal: 14,
                    paddingVertical: responsiveSizes.inputPadding,
                    fontSize: responsiveSizes.inputFontSize,
                  },
                ]}
                placeholder={copy.code}
                placeholderTextColor={tokens.colors.placeholder}
                keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
                value={code}
                onChangeText={setCode}
                editable={!loading}
              />

              <View style={styles.passwordWrapper}>
                <ThemedTextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    {
                      borderColor: tokens.colors.border,
                      color: tokens.colors.text,
                      paddingHorizontal: 14,
                      paddingVertical: responsiveSizes.inputPadding,
                      fontSize: responsiveSizes.inputFontSize,
                    },
                  ]}
                  placeholder={copy.newPassword}
                  placeholderTextColor={tokens.colors.placeholder}
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((s) => !s)}
                  activeOpacity={0.7}
                  style={styles.eyeBtn}
                  accessibilityLabel={showPassword ? 'Ascunde parola' : 'Arată parola'}
                >
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={tokens.colors.muted || '#666'} />
                </TouchableOpacity>
              </View>
            </>
          ) : null}

          {info ? (
            <ThemedText style={[styles.info, { color: tokens.colors.muted, fontSize: responsiveSizes.linkFontSize }]}>{info}</ThemedText>
          ) : null}
          {error ? (
            <ThemedText style={[styles.error, { color: tokens.colors.primary, fontSize: responsiveSizes.linkFontSize }]}>{error}</ThemedText>
          ) : null}

          <TouchableOpacity
            disabled={loading || !email.trim() || (step === 2 && (!code.trim() || !newPassword))}
            style={[
              styles.submitBtn,
              {
                backgroundColor: tokens.colors.primary,
                opacity: loading || !email.trim() || (step === 2 && (!code.trim() || !newPassword)) ? 0.7 : 1,
                paddingVertical: responsiveSizes.buttonPadding,
              },
            ]}
            onPress={step === 1 ? requestCode : confirmReset}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={tokens.colors.primaryContrast} />
            ) : (
              <ThemedText style={[styles.submitText, { color: tokens.colors.primaryContrast, fontSize: responsiveSizes.buttonFontSize }]}>
                {step === 1 ? copy.request : copy.confirm}
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.85}>
            <ThemedText style={[styles.link, { color: tokens.colors.primary, fontSize: responsiveSizes.linkFontSize }]}>
              {copy.back}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={3000}
        onHide={() => setToastVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    minHeight: '100%',
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '700', flexShrink: 1, textAlign: 'center' },
  input: { borderWidth: 1, borderRadius: 8 },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 56 },
  eyeBtn: { position: 'absolute', right: 8, top: 0, bottom: 0, width: 40, alignItems: 'center', justifyContent: 'center', padding: 6 },
  submitBtn: { borderRadius: 8, alignItems: 'center' },
  submitText: { fontWeight: '600' },
  link: { fontWeight: '500', textAlign: 'center' },
  info: { marginTop: -6, textAlign: 'center' },
  error: { marginTop: -6, textAlign: 'center' },
});