import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { saveToken } from '../src/services/auth';
import api from '../src/services/api';
import { useAppTheme } from '../src/context/ThemeContext';

/**
 * Lightweight deep-link landing route for mobile OAuth redirection.
 * This prevents the temporary "Unmatched Route" screen flash because the path /oauth now exists.
 * It silently stores the token, refreshes profile and redirects to the main tabs.
 */
export default function OAuthLandingScreen() {
  const params = useLocalSearchParams();
  const token = typeof params.token === 'string' ? params.token : undefined;
  const router = useRouter();
  const { restore } = useAuth();
  const { tokens } = useAppTheme();

  useEffect(() => {
    (async () => {
      try {
        if (token) {
          await saveToken(token);
          (api.defaults.headers as any).Authorization = `Bearer ${token}`;
          await restore();
          router.replace('/(tabs)');
        } else {
          // No token present – send user to login
          router.replace('/login');
        }
      } catch (e) {
        router.replace('/login');
      }
    })();
  }, [token, restore, router]);

  // Minimal invisible / spinner screen while processing
  return (
    <View style={{ flex: 1, backgroundColor: tokens.colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={tokens.colors.primary} />
    </View>
  );
}