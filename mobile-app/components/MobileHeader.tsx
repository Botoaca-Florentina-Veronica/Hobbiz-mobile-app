import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedTextInput } from './themed-text-input';
import { ThemedText } from './themed-text';
import { useAppTheme } from '../src/context/ThemeContext';

interface SearchSuggestion {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  location?: string;
  price?: number;
  images?: string[];
}

interface MobileHeaderProps {
  notificationCount?: number;
  onSearchFocus?: () => void;
  onSearchSubmit?: (query: string) => void;
  onSearchChange?: (query: string) => void;
  onNotificationClick?: () => void;
  onSuggestionClick?: (id: string) => void;
  searchValue?: string;
  searchSuggestions?: SearchSuggestion[];
  showSuggestions?: boolean;
  isSearching?: boolean;
}

export default function MobileHeader({ 
  notificationCount = 0, 
  onSearchFocus, 
  onNotificationClick,
  onSearchSubmit,
  onSearchChange,
  onSuggestionClick,
  searchValue,
  searchSuggestions = [],
  showSuggestions = false,
  isSearching = false,
}: MobileHeaderProps) {
  const { tokens, isDark } = useAppTheme();
  const webBox = (tokens as any)?.shadow?.elev1?.boxShadow;
  const [query, setQuery] = React.useState('');
  const [searchContainerLayout, setSearchContainerLayout] = React.useState<{ x: number; width: number } | null>(null);
  
  // Sync with external value
  React.useEffect(() => {
    if (searchValue !== undefined && searchValue !== query) {
      setQuery(searchValue);
    }
  }, [searchValue]);

  return (
    <View style={[styles.headerContainer, { backgroundColor: tokens.colors.bg }]}>
    <View style={[styles.header, { backgroundColor: tokens.colors.bg }]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}
        onLayout={(event) => {
          const { x, width } = event.nativeEvent.layout;
          setSearchContainerLayout({ x, width });
        }}
      >
        <View style={[
          styles.searchBar, 
          { 
            backgroundColor: tokens.colors.surface,
            borderColor: tokens.colors.border,
          },
          // Use boxShadow on web to avoid deprecated RN shadow props being forwarded
          (typeof document !== 'undefined' && webBox) ? { boxShadow: webBox } : { shadowColor: tokens.colors.text }
        ]}>
          <ThemedTextInput
            style={[
              styles.searchInput,
              { color: tokens.colors.text }
            ]}
            placeholder="Ce anume cauți?"
            placeholderTextColor={tokens.colors.muted}
            onFocus={onSearchFocus}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              if (onSearchChange) onSearchChange(text);
            }}
            returnKeyType="search"
            onSubmitEditing={() => {
              const q = (query || '').trim();
              if (onSearchSubmit) onSearchSubmit(q);
            }}
          />
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: tokens.colors.primary }]}
            activeOpacity={0.85}
            onPress={() => {
              const q = (query || '').trim();
              if (onSearchSubmit) onSearchSubmit(q);
            }}
          >
            <Ionicons name="search" size={20} color={tokens.colors.primaryContrast} />
          </TouchableOpacity>
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
    
    {/* Search Suggestions Dropdown */}
    {showSuggestions && query.trim().length >= 2 && searchContainerLayout && (
      <View style={[
        styles.suggestionsDropdown,
        {
          left: searchContainerLayout.x,
          width: searchContainerLayout.width,
        },
        { 
          backgroundColor: tokens.colors.surface,
          borderColor: tokens.colors.border,
        }
      ]}>
        {isSearching ? (
          <View style={styles.suggestionItem}>
            <ThemedText style={{ color: tokens.colors.muted }}>Se caută...</ThemedText>
          </View>
        ) : searchSuggestions.length === 0 ? (
          <View style={styles.suggestionItem}>
            <ThemedText style={{ color: tokens.colors.muted }}>Nu am găsit rezultate</ThemedText>
          </View>
        ) : (
          <ScrollView 
            style={styles.suggestionsScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            {searchSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion._id}
                style={[styles.suggestionItem, { borderBottomColor: tokens.colors.border }]}
                onPress={() => {
                  if (onSuggestionClick) onSuggestionClick(suggestion._id);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionImageContainer}>
                  {suggestion.images && suggestion.images.length > 0 ? (
                    <Image 
                      source={{ uri: suggestion.images[0] }} 
                      style={styles.suggestionImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.noImagePlaceholder, { backgroundColor: tokens.colors.bg }]}>
                      <Ionicons name="image-outline" size={20} color={tokens.colors.muted} />
                    </View>
                  )}
                </View>
                <View style={styles.suggestionContent}>
                  <ThemedText 
                    style={styles.suggestionTitle} 
                    numberOfLines={1}
                  >
                    {suggestion.title || suggestion.description}
                  </ThemedText>
                  <View style={styles.suggestionMeta}>
                    {suggestion.category && (
                      <ThemedText style={[styles.suggestionMetaText, { color: tokens.colors.muted }]} numberOfLines={1}>
                        {suggestion.category}
                      </ThemedText>
                    )}
                    {suggestion.location && (
                      <>
                        <ThemedText style={{ color: tokens.colors.muted }}>•</ThemedText>
                        <ThemedText style={[styles.suggestionMetaText, { color: tokens.colors.muted }]} numberOfLines={1}>
                          {suggestion.location}
                        </ThemedText>
                      </>
                    )}
                  </View>
                </View>
                {suggestion.price !== undefined && (
                  <View style={styles.suggestionPriceContainer}>
                    <ThemedText style={[styles.suggestionPrice, { color: tokens.colors.primary }]}>
                      {suggestion.price === 0 ? 'Gratuit' : `${suggestion.price} RON`}
                    </ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 12,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 58,
    maxHeight: 400,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    zIndex: 1001,
  },
  suggestionsScroll: {
    maxHeight: 400,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  suggestionImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  suggestionImage: {
    width: '100%',
    height: '100%',
  },
  noImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
    gap: 4,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  suggestionMetaText: {
    fontSize: 12,
  },
  suggestionPriceContainer: {
    alignItems: 'flex-end',
  },
  suggestionPrice: {
    fontSize: 14,
    fontWeight: '700',
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