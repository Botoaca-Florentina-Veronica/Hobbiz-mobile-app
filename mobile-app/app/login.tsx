import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert, useWindowDimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import api from '../src/services/api';
import { saveToken } from '../src/services/auth';

WebBrowser.maybeCompleteAuthSession();

export const options = {
  headerShown: false,
};

export default function LoginScreen() {
  const { tokens } = useAppTheme();
  const { login, loading, isAuthenticated, restore } = useAuth();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState(false);

  // Calculează lățimea cardului în funcție de dimensiunea ecranului
  const getCardWidth = (): number | string => {
    if (width < 600) return '100%'; // mobil
    if (width < 900) return '80%'; // tabletă mică
    if (width < 1200) return '50%'; // tabletă mare
    return '40%'; // desktop
  };

  // Determină dimensiunile elementelor în funcție de mărimea ecranului
  const isSmallDevice = width < 600;
  const isMediumDevice = width >= 600 && width < 900;
  const isLargeDevice = width >= 900 && width < 1200;
  const isExtraLargeDevice = width >= 1200;

  // Calculează dimensiunile responsive
  const responsiveSizes = {
    titleSize: isSmallDevice ? 26 : isMediumDevice ? 30 : isLargeDevice ? 34 : 38,
    inputPadding: isSmallDevice ? 12 : isMediumDevice ? 16 : 16,
    inputFontSize: isSmallDevice ? 15 : isMediumDevice ? 18 : 17,
    buttonPadding: isSmallDevice ? 14 : isMediumDevice ? 18 : isLargeDevice ? 18 : 20,
    buttonFontSize: isSmallDevice ? 15 : isMediumDevice ? 18 : 17,
    cardPadding: isSmallDevice ? 24 : isMediumDevice ? 28 : isLargeDevice ? 32 : 36,
    cardGap: isSmallDevice ? 16 : isMediumDevice ? 18 : isLargeDevice ? 20 : 22,
    socialButtonGap: isSmallDevice ? 12 : isMediumDevice ? 16 : 18,
    iconSize: isSmallDevice ? 18 : isMediumDevice ? 20 : 22,
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
    try {
      const ok = await login(email.trim(), password);
      if (!ok) {
        setError('Date de autentificare invalide');
        return;
      }
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e?.message || 'Eroare la autentificare');
    }
  }

  if (isAuthenticated) {
    // Already logged; redirect silently
    setTimeout(() => router.replace('/(tabs)'), 0);
  }

  // Extract token from an oauth redirect URL and finalize login
  const handleOAuthRedirectUrl = async (url?: string) => {
    if (!url) return false;
    console.log('[OAuth] Handling redirect URL:', url);
    const parsed = Linking.parse(url);
    console.log('[OAuth] Parsed URL:', JSON.stringify(parsed));
    const token = (parsed?.queryParams as any)?.token as string | undefined;
    if (token) {
      console.log('[OAuth] Token extracted successfully:', token.slice(0, 20) + '...');
      await saveToken(token);
      // update axios header for subsequent requests in this session
      (api.defaults.headers as any).Authorization = `Bearer ${token}`;
      await restore();
      router.replace('/(tabs)');
      return true;
    }
    console.log('[OAuth] No token found in URL');
    return false;
  };

  // Handle OAuth redirect back into the app (custom scheme)
  useEffect(() => {
    const handler = async (event: { url: string }) => {
      try {
        const url = event.url || '';
        console.log('[OAuth] URL event received:', url);
        await handleOAuthRedirectUrl(url);
      } catch (e: any) {
        console.error('[OAuth] Error in URL handler:', e);
        Alert.alert('Autentificare', e?.message || 'Eroare la procesarea autentificării');
      } finally {
        setSocialLoading(false);
      }
    };
    const sub = Linking.addEventListener('url', handler);
    return () => {
      try { sub.remove(); } catch {}
    };
  }, [restore, router]);

  async function onGoogleLogin() {
    try {
      setError('');
      setSocialLoading(true);
  // Build backend URL for Google OAuth. Ensure no trailing slash on base.
  let rawBase = '';
  try {
    rawBase = String((api && (api.defaults as any) && (api.defaults as any).baseURL) || '');
  } catch (e) {
    rawBase = '';
  }
  // Ensure we always have a usable base URL. Prefer the configured base, else public Render backend.
  const baseURL = rawBase && typeof rawBase.replace === 'function'
    ? rawBase.replace(/\/+$/, '')
    : 'https://hobbiz-mui.onrender.com';

      // Prepare redirect handler for iOS (fallback to explicit scheme if createURL not available)
      const redirectUrl = (Linking.createURL && typeof Linking.createURL === 'function')
        ? Linking.createURL('oauth')
        : 'mobileapp://oauth'; // fallback
      console.log('[OAuth] Redirect URL:', redirectUrl);

  // Include the actual redirect URL when initiating the backend OAuth so the callback can redirect back to this app
  const authUrl = `${baseURL.replace(/\/+$/, '')}/auth/google?state=mobile&mobile=1&redirect=${encodeURIComponent(redirectUrl)}`;

      console.log('[OAuth] Starting Google login...');
      console.log('[OAuth] Base URL:', baseURL);
      console.log('[OAuth] Auth URL:', authUrl);

      // Open browser session (wrap to catch platform-specific errors)
      let result;
      try {
        result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl, { showInRecents: true, createTask: true });
      } catch (e) {
        console.error('[OAuth] openAuthSessionAsync failed:', e);
        throw e;
      }
      console.log('[OAuth] WebBrowser result:', JSON.stringify(result));
      
      // On some platforms, openAuthSessionAsync returns the redirected URL
      if (result && 'url' in result && result.url) {
        const finished = await handleOAuthRedirectUrl(result.url);
        if (finished) return;
      }
      // Note: On Android, the redirect event will be captured by the listener above
    } catch (e: any) {
      console.error('[OAuth] Error during Google login:', e);
      setError(e?.message || 'Eroare la autentificarea cu Google');
      setSocialLoading(false);
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
          <ThemedText style={[styles.title, { color: tokens.colors.text, fontSize: responsiveSizes.titleSize }]}>Intră în cont</ThemedText>
        <View style={[styles.socialGroup, { gap: responsiveSizes.socialButtonGap }]}>
          <TouchableOpacity 
            style={[
              styles.socialBtn, 
              styles.googleBtn, 
              { 
                backgroundColor: tokens.colors.surface, 
                borderColor: tokens.colors.border, 
                opacity: socialLoading ? 0.7 : 1,
                paddingVertical: responsiveSizes.buttonPadding,
              }
            ]} 
            activeOpacity={0.85} 
            onPress={socialLoading ? undefined : onGoogleLogin}
          >
            {socialLoading ? (
              <ActivityIndicator style={{ marginRight: 12 }} />
            ) : (
              <Image 
                source={{ uri: 'https://www.gstatic.com/images/branding/googleg/2x/googleg_standard_color_64dp.png' }} 
                style={[styles.googleImage, { width: responsiveSizes.iconSize + 2, height: responsiveSizes.iconSize + 2 }]} 
              />
            )}
            <ThemedText style={[styles.socialText, { color: tokens.colors.text, fontSize: responsiveSizes.buttonFontSize }]}>
              {socialLoading ? 'Se conectează...' : 'Continuă cu Google'}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.socialBtn, 
              styles.facebookBtn, 
              { 
                backgroundColor: '#1877f2',
                paddingVertical: responsiveSizes.buttonPadding,
              }
            ]} 
            activeOpacity={0.85} 
            onPress={() => {/* placeholder */}}
          >
            <Ionicons name="logo-facebook" size={responsiveSizes.iconSize} color={tokens.colors.primaryContrast} style={styles.socialIcon} />
            <ThemedText style={[styles.socialText, { color: tokens.colors.primaryContrast, fontSize: responsiveSizes.buttonFontSize }]}>
              Continuă cu Facebook
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.socialBtn, 
              styles.appleBtn, 
              { 
                backgroundColor: '#000000',
                paddingVertical: responsiveSizes.buttonPadding,
              }
            ]} 
            activeOpacity={0.85} 
            onPress={() => {/* placeholder */}}
          >
            <Ionicons name="logo-apple" size={responsiveSizes.iconSize} color={tokens.colors.primaryContrast} style={styles.socialIcon} />
            <ThemedText style={[styles.socialText, { color: tokens.colors.primaryContrast, fontSize: responsiveSizes.buttonFontSize }]}>
              Continuă cu Apple
            </ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.dividerWrap}>
          <View style={[styles.divider, { borderColor: tokens.colors.border }]} />
          <ThemedText style={[styles.dividerText, { color: tokens.colors.muted }]}>SAU</ThemedText>
          <View style={[styles.divider, { borderColor: tokens.colors.border }]} />
        </View>
        <TextInput
          style={[
            styles.input, 
            { 
              borderColor: tokens.colors.border, 
              color: tokens.colors.text,
              paddingHorizontal: 14,
              paddingVertical: responsiveSizes.inputPadding,
              fontSize: responsiveSizes.inputFontSize,
            }
          ]}
          placeholder="Adresa ta de email"
          placeholderTextColor={tokens.colors.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.passwordWrapper}>
          <TextInput
            style={[
              styles.input, 
              styles.passwordInput, 
              { 
                borderColor: tokens.colors.border, 
                color: tokens.colors.text,
                paddingHorizontal: 14,
                paddingVertical: responsiveSizes.inputPadding,
                fontSize: responsiveSizes.inputFontSize,
              }
            ]}
            placeholder="Parola"
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
        {error ? <ThemedText style={[styles.error, { color: tokens.colors.primary, fontSize: responsiveSizes.linkFontSize - 1 }]}>{error}</ThemedText> : null}
        <TouchableOpacity
          disabled={loading}
          style={[
            styles.loginBtn, 
            { 
              backgroundColor: tokens.colors.primary, 
              opacity: loading ? 0.7 : 1,
              paddingVertical: responsiveSizes.buttonPadding,
            }
          ]}
          onPress={onSubmit}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={tokens.colors.primaryContrast} /> 
          ) : (
            <ThemedText style={[styles.loginText, { color: tokens.colors.primaryContrast, fontSize: responsiveSizes.buttonFontSize }]}>
              Intră în cont
            </ThemedText>
          )}
        </TouchableOpacity>
        <View style={styles.linksRow}>
          <TouchableOpacity>
            <ThemedText style={[styles.link, { color: tokens.colors.primary, fontSize: responsiveSizes.linkFontSize }]}>
              Ai uitat parola?
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity>
            <ThemedText style={[styles.link, { color: tokens.colors.primary, fontSize: responsiveSizes.linkFontSize }]}>
              Creează cont
            </ThemedText>
          </TouchableOpacity>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
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
  title: { fontWeight: '700' },
  socialGroup: {},
  socialBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1 },
  socialIcon: { marginRight: 10 },
  socialText: { fontWeight: '600' },
  googleBtn: {  },
  googleImage: { marginRight: 12 },
  googleText: { color: '#000' },
  facebookBtn: { backgroundColor: '#1877F2', borderColor: '#1877F2' },
  appleBtn: { backgroundColor: '#000', borderColor: '#000' },
  dividerWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, borderBottomWidth: 1 },
  dividerText: { fontSize: 12, fontWeight: '600', letterSpacing: 1 },
  input: { borderWidth: 1, borderRadius: 8 },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 56 },
  eyeBtn: { position: 'absolute', right: 8, top: 0, bottom: 0, width: 40, alignItems: 'center', justifyContent: 'center', padding: 6 },
  error: { marginTop: -4 },
  loginBtn: { borderRadius: 8, alignItems: 'center' },
  loginText: { color: '#fff', fontWeight: '600' },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  link: { fontWeight: '500' },
});
