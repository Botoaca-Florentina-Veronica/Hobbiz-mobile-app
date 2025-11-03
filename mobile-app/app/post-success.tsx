import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, TouchableOpacity, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const successAnimation = require('../assets/images/Create Post.json');

export default function PostSuccessScreen() {
  const { tokens, isDark } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ title?: string }>();
  const animationRef = useRef<LottieView | null>(null);
  const announcementTitle = typeof params.title === 'string' ? params.title : undefined;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(8)).current;
  const textScale = useRef(new Animated.Value(0.98)).current;
  const scheduledTimer = useRef<number | null>(null);
  const textAnimated = useRef(false);

  useEffect(() => {
    animationRef.current?.play();
  }, []);

  const onAnimationFinish = () => {
    if (textAnimated.current) return;
    textAnimated.current = true;
    // animate text: fade in, slide up, subtle scale
    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(textTranslate, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(textScale, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };

  // Compute animation duration from the JSON if available and schedule the text animation
  useEffect(() => {
    // successAnimation may be a module id (number) or the JSON object depending on bundler
    try {
      const anim = successAnimation as any;
      let durationMs: number | null = null;
      if (anim && typeof anim === 'object' && anim.fr && (anim.op || anim.op === 0)) {
        const ip = anim.ip || 0;
        const op = anim.op;
        const fr = anim.fr;
        const frames = Math.max(0, op - ip);
        durationMs = (frames / fr) * 1000;
      }

      if (durationMs && durationMs > 0) {
        const startDelay = Math.max(0, Math.round(durationMs - 1500));
        // schedule the text animation to start startDelay ms after animation start
        // use window.setTimeout signature to get a number id compatible with RN
        scheduledTimer.current = (setTimeout(() => {
          onAnimationFinish();
        }, startDelay) as unknown) as number;
      }
    } catch (e) {
      // ignore and fall back to onAnimationFinish via Lottie callback
    }

    return () => {
      if (scheduledTimer.current) {
        clearTimeout(scheduledTimer.current as any);
        scheduledTimer.current = null;
      }
    };
  }, []);

  const handleGoToAnnouncements = () => {
    router.replace('/my-announcements');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: tokens.colors.bg,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.stack}>
          <Animated.View
            style={{
              opacity: textOpacity,
              transform: [{ translateY: textTranslate }, { scale: textScale }],
            }}
          >
            <ThemedText style={[styles.title, { color: tokens.colors.text }]}>Anunțul tău a fost publicat cu succes!</ThemedText>
          </Animated.View>
          <LottieView
            ref={animationRef}
            source={successAnimation}
            autoPlay
            loop={false}
            onAnimationFinish={onAnimationFinish}
            style={[styles.animation, { alignSelf: 'center' }]}
          />
        </View>
      </View>
      <View style={[styles.actionsSingle, { paddingBottom: insets.bottom + 24 }]}> 
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleGoToAnnouncements}
          style={[
            styles.primaryActionSingle,
            {
              backgroundColor: tokens.colors.primary,
              borderColor: tokens.colors.primary,
            },
          ]}
        >
          <Ionicons name="megaphone" size={18} color={tokens.colors.primaryContrast} style={styles.actionIcon} />
          <ThemedText style={[styles.primaryText, { color: tokens.colors.primaryContrast }]}>
            Vezi anunțurile mele
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 0,
  },
  stack: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  animation: {
    width: 280,
    height: 280,
    marginTop: 0,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 0,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 32,
  },
  actions: {
    paddingHorizontal: 24,
    gap: 12,
  },
  actionsSingle: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionSingle: {
    width: '100%',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionIcon: {
    marginRight: 8,
  },
  secondaryAction: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
