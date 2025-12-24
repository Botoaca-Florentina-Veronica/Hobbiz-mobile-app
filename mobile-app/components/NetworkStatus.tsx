import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, Animated, Platform } from 'react-native';
// @ts-ignore - type declarations for this React Native library can be noisy in TS
import { useNetInfo } from '@react-native-community/netinfo';
import { ThemedText } from './themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/context/ThemeContext';

export const NetworkStatus = () => {
  const netInfo = useNetInfo();
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(-100)); // Start hidden above

  const isOffline = netInfo.isConnected === false;

  useEffect(() => {
    if (isOffline) {
      // Slide down
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOffline, slideAnim]);

  if (netInfo.isConnected === null) return null; // Initial state

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.danger,
          paddingTop: insets.top + (Platform.OS === 'ios' ? 0 : 10),
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ThemedText style={[styles.text, { color: '#FFFFFF' }]}>
        Nu există conexiune la internet
      </ThemedText>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingBottom: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
  },
});