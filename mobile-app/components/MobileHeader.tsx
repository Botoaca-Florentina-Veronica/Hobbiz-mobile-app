import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';

interface MobileHeaderProps {
  notificationCount?: number;
  onSearchFocus?: () => void;
  onNotificationClick?: () => void;
}

export default function MobileHeader({ 
  notificationCount = 0, 
  onSearchFocus, 
  onNotificationClick 
}: MobileHeaderProps) {
  const { tokens } = useAppTheme();
  const webBox = (tokens as any)?.shadow?.elev1?.boxShadow;

  return (
    <View style={[styles.header, { backgroundColor: tokens.colors.bg }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchBar, 
          { 
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
          },
          // Use boxShadow on web to avoid deprecated RN shadow props being forwarded
          (typeof document !== 'undefined' && webBox) ? { boxShadow: webBox } : { shadowColor: tokens.colors.text }
        ]}>
          <TextInput
            style={[
              styles.searchInput,
              { color: tokens.colors.text }
            ]}
            placeholder="Ce anume cauți?"
            placeholderTextColor={tokens.colors.muted}
            onFocus={onSearchFocus}
          />
          <View style={[styles.searchButton, { backgroundColor: tokens.colors.primary }]}>
            <Ionicons name="search" size={20} color={tokens.colors.primaryContrast} />
          </View>
        </View>
      </View>

      {/* Notification Button */}
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={onNotificationClick}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="notifications-outline" 
          size={26} 
          color={tokens.colors.text} 
        />
        {notificationCount > 0 && (
          <View style={[styles.badge, { backgroundColor: tokens.colors.primary }]}>
            <View style={styles.badgeInner} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    maxWidth: '85%',
  },
  searchBar: {
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 44,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  searchButton: {
    paddingHorizontal: 16,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 22,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
