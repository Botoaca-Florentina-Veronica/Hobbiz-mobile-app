import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  Text,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '../src/context/ThemeContext';
import api from '../src/services/api';
import { useFocusEffect } from '@react-navigation/native';

export default function CategoryAnnouncementsScreen() {
  const { tokens } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const category = params.category as string;
  const navigation = useNavigation();

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [activePicker, setActivePicker] = useState<'sort' | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchAnnouncements();
    }, [category])
  );

  // Hide the native header added by the stack navigator (prevents duplicate header)
  useEffect(() => {
    try {
      // @ts-ignore
      navigation.setOptions?.({ headerShown: false });
    } catch (e) {
      // ignore if navigation not available
    }
  }, [navigation]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/announcements?category=${encodeURIComponent(category)}`);
      setAnnouncements(res.data || []);
    } catch (e) {
      console.error('Error fetching category announcements:', e);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements.filter((a) => {
      const searchWords = searchTerm.toLowerCase().trim().split(/\s+/).filter((w) => w.length > 0);

      if (searchWords.length === 0) {
        return true;
      }

      const titleWords = a.title.toLowerCase().split(/\s+/);
      const descriptionWords = a.description?.toLowerCase().split(/\s+/) || [];
      const allTextWords = [...titleWords, ...descriptionWords];

      return searchWords.every((searchWord) =>
        allTextWords.some((textWord) => textWord.includes(searchWord) || searchWord.includes(textWord))
      );
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
        case 'price-desc':
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [announcements, searchTerm, sortBy]);

  const sortOptions = [
    { label: 'Cele mai recente', value: 'recent' },
    { label: 'Preț crescător', value: 'price-asc' },
    { label: 'Preț descrescător', value: 'price-desc' },
    { label: 'Nume (A-Z)', value: 'title' },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tokens.colors.surface, borderBottomColor: tokens.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tokens.colors.text }]} numberOfLines={1}>
          {category}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: tokens.colors.surface }]}>
          <View style={[styles.searchBar, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.border }]}>
            <Ionicons name="search" size={20} color={tokens.colors.muted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: tokens.colors.text }]}
              placeholder="Caută anunturi..."
              placeholderTextColor={tokens.colors.placeholder}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          {/* Filters and Sort Row */}
          <View style={styles.filterRow}>
            {/* Filters Button */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                showFilters && { backgroundColor: tokens.colors.primary },
                { borderColor: tokens.colors.border },
              ]}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons name="filter" size={16} color={showFilters ? '#fff' : tokens.colors.text} />
              <Text
                style={[
                  styles.filterButtonText,
                  { color: showFilters ? '#fff' : tokens.colors.text },
                ]}
              >
                FILTRE
              </Text>
            </TouchableOpacity>

            {/* Sort Dropdown */}
            <TouchableOpacity
              style={[
                styles.filterButton,
                activePicker === 'sort' && { backgroundColor: tokens.colors.primary },
                { borderColor: tokens.colors.border },
              ]}
              onPress={() => setActivePicker(activePicker === 'sort' ? null : 'sort')}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  { color: activePicker === 'sort' ? '#fff' : tokens.colors.text },
                ]}
                numberOfLines={1}
              >
                Sortează după
              </Text>
              <Ionicons
                name={activePicker === 'sort' ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={activePicker === 'sort' ? '#fff' : tokens.colors.text}
              />
            </TouchableOpacity>

            {/* Results Count (keep on a single line) */}
            <View style={[styles.resultsCount, { alignItems: 'center' }]}> 
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.resultsText, { color: tokens.colors.muted, flexShrink: 0 }]}>
                {filteredAndSortedAnnouncements.length} rezultate
              </Text>
            </View>

            {/* View Mode Toggle */}
            <View style={styles.viewToggle}>
              <TouchableOpacity onPress={() => setViewMode('grid')} style={styles.viewButton}>
                <Ionicons name="apps" size={20} color={viewMode === 'grid' ? tokens.colors.primary : tokens.colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setViewMode('list')} style={styles.viewButton}>
                <Ionicons name="list" size={20} color={viewMode === 'list' ? tokens.colors.primary : tokens.colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sort Picker */}
          {activePicker === 'sort' && (
            <View style={[styles.pickerContainer, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOption,
                    sortBy === option.value && { backgroundColor: `${tokens.colors.primary}15` },
                  ]}
                  onPress={() => {
                    setSortBy(option.value);
                    setActivePicker(null);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      { color: sortBy === option.value ? tokens.colors.primary : tokens.colors.text },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Ionicons name="checkmark" size={18} color={tokens.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Active Filters Chips */}
          {searchTerm && (
            <View style={styles.activeFilters}>
              <View style={[styles.chip, { backgroundColor: `${tokens.colors.primary}15` }]}>
                <Text style={[styles.chipText, { color: tokens.colors.primary }]}>
                  Căutare: "{searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}"
                </Text>
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={16} color={tokens.colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Announcements List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
        ) : filteredAndSortedAnnouncements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={tokens.colors.muted} />
            <Text style={[styles.emptyText, { color: tokens.colors.muted }]}>
              {announcements.length === 0
                ? 'Nu există anunțuri pentru această categorie.'
                : 'Nu s-au găsit anunțuri care să corespundă filtrelor.'}
            </Text>
          </View>
        ) : (
          <View style={styles.announcementsContainer}>
            {viewMode === 'grid' ? (
              <View style={styles.gridContainer}>
                {filteredAndSortedAnnouncements.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.gridCard,
                      { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border },
                    ]}
                    onPress={() => router.push(`/announcement-details?id=${item._id}`)}
                  >
                    <Image
                      source={{
                        uri:
                          item.images && item.images[0]
                            ? item.images[0]
                            : 'https://via.placeholder.com/300x200?text=No+Image',
                      }}
                      style={styles.gridImage}
                    />
                    <View style={styles.gridInfo}>
                      <Text numberOfLines={2} style={[styles.gridTitle, { color: tokens.colors.text }]}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={[styles.gridLocation, { color: tokens.colors.muted }]}>
                        {item.location || ''}
                      </Text>
                      {item.price !== undefined && (
                        <Text style={[styles.gridPrice, { color: tokens.colors.primary }]}>
                          {parseFloat(item.price) === 0 ? 'Gratuit' : `${item.price} RON`}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.listContainer}>
                {filteredAndSortedAnnouncements.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.listCard,
                      { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border },
                    ]}
                    onPress={() => router.push(`/announcement-details?id=${item._id}`)}
                  >
                    <Image
                      source={{
                        uri:
                          item.images && item.images[0]
                            ? item.images[0]
                            : 'https://via.placeholder.com/300x200?text=No+Image',
                      }}
                      style={styles.listImage}
                    />
                    <View style={styles.listInfo}>
                      <Text numberOfLines={2} style={[styles.listTitle, { color: tokens.colors.text }]}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={[styles.listLocation, { color: tokens.colors.muted }]}>
                        {item.location || ''}
                      </Text>
                      {item.price !== undefined && (
                        <Text style={[styles.listPrice, { color: tokens.colors.primary }]}>
                          {parseFloat(item.price) === 0 ? 'Gratuit' : `${item.price} RON`}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginRight: 12 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  searchContainer: {
    padding: 16,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsCount: {
    paddingHorizontal: 8,
    minWidth: 72,
    flexShrink: 0,
  },
  resultsText: {
    fontSize: 13,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    padding: 6,
  },
  pickerContainer: {
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerOptionText: {
    fontSize: 14,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  announcementsContainer: {
    paddingHorizontal: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  gridCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  gridImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#eee',
  },
  gridInfo: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridLocation: {
    fontSize: 12,
    marginBottom: 6,
  },
  gridPrice: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContainer: {
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  listImage: {
    width: 120,
    height: 120,
    backgroundColor: '#eee',
  },
  listInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  listTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  listLocation: {
    fontSize: 13,
    marginBottom: 6,
  },
  listPrice: {
    fontSize: 15,
    fontWeight: '700',
  },
});
