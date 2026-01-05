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

import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '../../components/themed-text-input';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { registerWithCredentials, saveToken } from '../../src/services/auth';

export const options = {
  headerShown: false,
};

export default function SignupScreen() {
  const { tokens } = useAppTheme();
  const { restore } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const locale = (Intl && Intl?.DateTimeFormat && (Intl.DateTimeFormat().resolvedOptions().locale || 'ro')) || 'ro';
  const copy = useMemo(() => {
    const isEn = locale === 'en';
    return {
      title: isEn ? 'Create account' : 'Creează cont',
      placeholders: {
        firstName: isEn ? 'First name' : 'Prenume',
        lastName: isEn ? 'Last name' : 'Nume',
        email: isEn ? 'Email address' : 'Adresa ta de email',
        password: isEn ? 'Password' : 'Parola',
        phone: isEn ? 'Phone (optional)' : 'Telefon (opțional)',
      },
      cta: isEn ? 'Create account' : 'Creează cont',
      successTitle: isEn ? 'Success' : 'Succes',
      successMsg: isEn
        ? 'Account created successfully! You can now sign in.'
        : 'Cont creat cu succes! Te poți autentifica.',
      haveAccount: isEn ? 'Already have an account?' : 'Ai deja cont?',
      login: isEn ? 'Sign in' : 'Intră în cont',
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
    titleSize: isSmallDevice ? 26 : isMediumDevice ? 30 : isLargeDevice ? 34 : 38,
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

  async function onSubmit() {
    setError('');
    setLoading(true);
    try {
      const res = await registerWithCredentials({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });

      const token = (res as any)?.token as string | undefined;
      if (token) {
        await saveToken(token);
        (api.defaults.headers as any).Authorization = `Bearer ${token}`;
        await restore();
        router.replace('/(tabs)');
        return;
      }

      // Fallback if backend didn't return token
      Alert.alert(copy.successTitle, copy.successMsg, [{ text: 'OK', onPress: () => router.replace('/login') }]);
    } catch (e: any) {
      setError(e?.message || 'Eroare la înregistrare');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: tokens.colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, cardStyle, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityLabel="Back"
              style={styles.backBtn}
            >
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
            placeholder={copy.placeholders.firstName}
            placeholderTextColor={tokens.colors.placeholder}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

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
            placeholder={copy.placeholders.lastName}
            placeholderTextColor={tokens.colors.placeholder}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />

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
            placeholder={copy.placeholders.email}
            placeholderTextColor={tokens.colors.placeholder}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
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
              placeholder={copy.placeholders.password}
              placeholderTextColor={tokens.colors.placeholder}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
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
            placeholder={copy.placeholders.phone}
            placeholderTextColor={tokens.colors.placeholder}
            keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'phone-pad'}
            value={phone}
            onChangeText={setPhone}
          />

          {error ? (
            <ThemedText style={[styles.error, { color: tokens.colors.primary, fontSize: responsiveSizes.linkFontSize - 1 }]}>
              {error}
            </ThemedText>
          ) : null}

          <TouchableOpacity
            disabled={loading || !firstName.trim() || !lastName.trim() || !email.trim() || !password}
            style={[
              styles.submitBtn,
              {
                backgroundColor: tokens.colors.primary,
                opacity: loading || !firstName.trim() || !lastName.trim() || !email.trim() || !password ? 0.7 : 1,
                paddingVertical: responsiveSizes.buttonPadding,
              },
            ]}
            onPress={onSubmit}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={tokens.colors.primaryContrast} />
            ) : (
              <ThemedText style={[styles.submitText, { color: tokens.colors.primaryContrast, fontSize: responsiveSizes.buttonFontSize }]}>
                {copy.cta}
              </ThemedText>
            )}
          </TouchableOpacity>

          <View style={styles.linksRow}>
            <ThemedText style={[styles.muted, { color: tokens.colors.muted, fontSize: responsiveSizes.linkFontSize }]}>
              {copy.haveAccount}
            </ThemedText>
            <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.85}>
              <ThemedText style={[styles.link, { color: tokens.colors.primary, fontSize: responsiveSizes.linkFontSize }]}>
                {copy.login}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  error: { marginTop: -4 },
  submitBtn: { borderRadius: 8, alignItems: 'center' },
  submitText: { fontWeight: '600' },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  link: { fontWeight: '500' },
  muted: { fontWeight: '500' },
});