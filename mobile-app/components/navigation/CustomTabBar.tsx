import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../../src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTabBar } from '../../src/context/TabBarContext';
import { useChatNotifications } from '../../src/context/ChatNotificationContext';

// Map route name -> icon + label (adjust later as you add screens)
const TAB_CONFIG: Record<string, { icon: string; label: string; special?: boolean }> = {
  index: { icon: 'search', label: 'Explorează' },
  favorites: { icon: 'heart-outline', label: 'Favorite' },
  sell: { icon: 'pricetag', label: 'Vinde', special: true },
  chat: { icon: 'chatbubble-ellipses-outline', label: 'Chat' },
  account: { icon: 'person-circle-outline', label: 'Cont' },
};

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { tokens, isDark } = useAppTheme();
  const webBox = (tokens as any)?.shadow?.elev2?.boxShadow;
  const { isAuthenticated, loading, user } = useAuth();
  const { hidden } = useTabBar();
  const { unreadCount } = useChatNotifications();
  const insets = useSafeAreaInsets();
  // Accent adapts to theme: dark uses brand pink, light keeps existing blue tone
  const activeColor = isDark ? tokens.colors.primary : '#355070';
  const inactiveColor = tokens.colors.muted;

  // Indicator bazat pe măsurători reale
  const [layouts, setLayouts] = useState<{ x: number; width: number }[]>([]);
  const indicatorLeft = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  const onLayoutTab = (event: any, index: number) => {
    const { x, width } = event.nativeEvent.layout;
    setLayouts(prev => {
      const clone = [...prev];
      clone[index] = { x, width };
      return clone;
    });
  };

  useEffect(() => {
    const l = layouts[state.index];
    if (l) {
      Animated.parallel([
        Animated.timing(indicatorLeft, { toValue: l.x, duration: 260, useNativeDriver: false }),
        Animated.timing(indicatorWidth, { toValue: l.width, duration: 260, useNativeDriver: false }),
      ]).start();
    }
  }, [state.index, layouts]);

  if (hidden) return null;

  // On iPhones with the home indicator, ensure extra bottom padding so the bar is not obscured
  const baselinePad = Platform.select({ ios: 12, default: 6 }) || 6;
  const extraForIos = Platform.OS === 'ios' ? 8 : 0; // a bit more space above the home pill
  const bottomPad = Math.max(insets.bottom, baselinePad) + extraForIos;
  // Increase baseHeight so icons/labels are more visible on devices with home indicator
  const baseHeight = 78;
  const barHeight = baseHeight + (bottomPad - baselinePad);

  return (
    <View style={[styles.wrapper, { backgroundColor: tokens.colors.surface, borderTopColor: tokens.colors.border, paddingBottom: bottomPad, height: barHeight }]}>      
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name] || { icon: 'ellipse', label: route.name };
          const onPress = () => {
            // Dacă nu e autentificat și nu este tab-ul Explorează (index), redirecționează la login
            if (!loading && !isAuthenticated && route.name !== 'index') {
              navigation.navigate('login' as any);
              return;
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              android_ripple={{ color: isDark ? 'rgba(245, 24, 102, 0.2)' : 'rgba(53, 80, 112, 0.12)', radius: 28 }}
              style={({ pressed }) => [
                styles.tab,
                pressed && !config.special && { opacity: 0.6 },
              ]}
              onLayout={(e) => onLayoutTab(e, index)}
            >
              <View style={config.special ? [styles.publishWrapper] : undefined}>
                <View
                  style={config.special ? [
                    styles.publishCircle,
                    { backgroundColor: activeColor },
                    // apply boxShadow on web
                    (typeof document !== 'undefined' && webBox) ? { boxShadow: webBox } : undefined,
                  ] : undefined}
                >
                  {route.name === 'account' && user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={{ width: config.special ? 28 : 24, height: config.special ? 28 : 24, borderRadius: 999 }} />
                  ) : (
                    <Ionicons
                      name={config.icon as any}
                      size={config.special ? 26 : 26}
                      color={config.special ? tokens.colors.primaryContrast : isFocused ? activeColor : inactiveColor}
                    />
                  )}
                </View>
                {/* Badge pentru mesaje necitite pe tab-ul chat */}
                {route.name === 'chat' && unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: tokens.colors.primary }, (typeof document !== 'undefined' && webBox) ? { boxShadow: webBox } : undefined]}>
                    <Text style={[styles.badgeText, { color: tokens.colors.primaryContrast }]}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  config.special ? styles.labelSpecial : undefined,
                  { color: isFocused ? activeColor : inactiveColor, fontWeight: isFocused ? '600' : '500' },
                ]}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {/* Active indicator line (simple implementation) */}
      <Animated.View style={[styles.indicator, { backgroundColor: activeColor, transform: [{ translateX: indicatorLeft }], width: indicatorWidth }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingBottom: Platform.select({ ios: 10, default: 6 }),
    paddingTop: 2,
    height: 65,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  labelSpecial: {
    marginTop: -6,
  },
  indicator: {
    position: 'absolute',
    height: 3,
    top: 0,
    left: 0,
    borderRadius: 0,
  },
  publishWrapper: {
    marginBottom: 2,
  },
  publishCircle: {
    width: 40,
    height: 40,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});

export default CustomTabBar;
