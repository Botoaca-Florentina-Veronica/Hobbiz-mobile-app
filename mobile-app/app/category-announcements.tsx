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
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
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
  
  // Filter states
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showPaid, setShowPaid] = useState(true);
  const [showFree, setShowFree] = useState(true);

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
      // Search filter
      const searchWords = searchTerm.toLowerCase().trim().split(/\s+/).filter((w) => w.length > 0);

      if (searchWords.length > 0) {
        const titleWords = a.title.toLowerCase().split(/\s+/);
        const descriptionWords = a.description?.toLowerCase().split(/\s+/) || [];
        const allTextWords = [...titleWords, ...descriptionWords];
        
        const matchesSearch = searchWords.every((searchWord) =>
          allTextWords.some((textWord) => textWord.includes(searchWord) || searchWord.includes(textWord))
        );
        
        if (!matchesSearch) return false;
      }
      
      // Price filter
      const price = parseFloat(a.price) || 0;
      const min = priceMin ? parseFloat(priceMin) : null;
      const max = priceMax ? parseFloat(priceMax) : null;
      
      if (min !== null && price < min) return false;
      if (max !== null && price > max) return false;
      
      // Price type filter (free vs paid)
      const isFree = price === 0;
      if (isFree && !showFree) return false;
      if (!isFree && !showPaid) return false;
      
      return true;
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
  }, [announcements, searchTerm, sortBy, priceMin, priceMax, showPaid, showFree]);

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
        <ThemedText style={[styles.headerTitle, { color: tokens.colors.text }]} numberOfLines={1}>
          {category}
        </ThemedText>
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
            <ThemedTextInput
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
              <ThemedText
                style={[
                  styles.filterButtonText,
                  { color: showFilters ? '#fff' : tokens.colors.text },
                ]}
              >
                FILTRE
              </ThemedText>
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
              <ThemedText
                style={[
                  styles.filterButtonText,
                  { color: activePicker === 'sort' ? '#fff' : tokens.colors.text },
                ]}
                numberOfLines={1}
              >
                Sortează după
              </ThemedText>
              <Ionicons
                name={activePicker === 'sort' ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={activePicker === 'sort' ? '#fff' : tokens.colors.text}
              />
            </TouchableOpacity>

            {/* Results Count (keep on a single line) */}
            <View style={[styles.resultsCount, { alignItems: 'center' }]}> 
              <ThemedText numberOfLines={1} ellipsizeMode="tail" style={[styles.resultsText, { color: tokens.colors.muted, flexShrink: 0 }]}>
                {filteredAndSortedAnnouncements.length} rezultate
              </ThemedText>
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
                  <ThemedText
                    style={[
                      styles.pickerOptionText,
                      { color: sortBy === option.value ? tokens.colors.primary : tokens.colors.text },
                    ]}
                  >
                    {option.label}
                  </ThemedText>
                  {sortBy === option.value && (
                    <Ionicons name="checkmark" size={18} color={tokens.colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Filters Panel */}
          {showFilters && (
            <View style={[styles.filtersPanel, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
              {/* Price Range */}
              <View style={styles.filterSection}>
                <ThemedText style={[styles.filterSectionTitle, { color: tokens.colors.text }]}>
                  Interval de preț
                </ThemedText>
                <View style={styles.priceRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.priceLabel, { color: tokens.colors.muted }]}>Min (RON)</ThemedText>
                    <ThemedTextInput
                      style={[styles.priceInput, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.border, color: tokens.colors.text }]}
                      placeholder="0"
                      placeholderTextColor={tokens.colors.placeholder}
                      keyboardType="numeric"
                      value={priceMin}
                      onChangeText={setPriceMin}
                    />
                  </View>
                  <ThemedText style={[styles.priceSeparator, { color: tokens.colors.muted }]}>-</ThemedText>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={[styles.priceLabel, { color: tokens.colors.muted }]}>Max (RON)</ThemedText>
                    <ThemedTextInput
                      style={[styles.priceInput, { backgroundColor: tokens.colors.bg, borderColor: tokens.colors.border, color: tokens.colors.text }]}
                      placeholder="∞"
                      placeholderTextColor={tokens.colors.placeholder}
                      keyboardType="numeric"
                      value={priceMax}
                      onChangeText={setPriceMax}
                    />
                  </View>
                </View>
              </View>
              
              {/* Type Filter */}
              <View style={styles.filterSection}>
                <ThemedText style={[styles.filterSectionTitle, { color: tokens.colors.text }]}>
                  Tip anunț
                </ThemedText>
                <View style={styles.checkboxRow}>
                  <TouchableOpacity
                    style={styles.checkboxItem}
                    onPress={() => setShowPaid(!showPaid)}
                  >
                    <View style={[styles.checkbox, { borderColor: tokens.colors.border }]}>
                      {showPaid && (
                        <Ionicons name="checkmark" size={18} color={tokens.colors.primary} />
                      )}
                    </View>
                    <ThemedText style={[styles.checkboxLabel, { color: tokens.colors.text }]}>
                      Cu preț
                    </ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.checkboxItem}
                    onPress={() => setShowFree(!showFree)}
                  >
                    <View style={[styles.checkbox, { borderColor: tokens.colors.border }]}>
                      {showFree && (
                        <Ionicons name="checkmark" size={18} color={tokens.colors.primary} />
                      )}
                    </View>
                    <ThemedText style={[styles.checkboxLabel, { color: tokens.colors.text }]}>
                      Gratuit
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Filter Actions */}
              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={[styles.filterActionButton, styles.clearButton, { borderColor: tokens.colors.border }]}
                  onPress={() => {
                    setPriceMin('');
                    setPriceMax('');
                    setShowPaid(true);
                    setShowFree(true);
                  }}
                >
                  <ThemedText style={[styles.clearButtonText, { color: tokens.colors.text }]}>
                    Resetează
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterActionButton, styles.applyButton, { backgroundColor: tokens.colors.primary }]}
                  onPress={() => setShowFilters(false)}
                >
                  <ThemedText style={styles.applyButtonText}>
                    Aplică
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Active Filters Chips */}
          {(searchTerm || priceMin || priceMax || !showPaid || !showFree) && (
            <View style={styles.activeFilters}>
              {searchTerm && (
                <View style={[styles.chip, { backgroundColor: `${tokens.colors.primary}15` }]}>
                  <ThemedText style={[styles.chipText, { color: tokens.colors.primary }]}>
                    Căutare: "{searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}"
                  </ThemedText>
                  <TouchableOpacity onPress={() => setSearchTerm('')}>
                    <Ionicons name="close-circle" size={16} color={tokens.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {priceMin && (
                <View style={[styles.chip, { backgroundColor: `${tokens.colors.primary}15` }]}>
                  <ThemedText style={[styles.chipText, { color: tokens.colors.primary }]}>
                    Min: {priceMin} RON
                  </ThemedText>
                  <TouchableOpacity onPress={() => setPriceMin('')}>
                    <Ionicons name="close-circle" size={16} color={tokens.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {priceMax && (
                <View style={[styles.chip, { backgroundColor: `${tokens.colors.primary}15` }]}>
                  <ThemedText style={[styles.chipText, { color: tokens.colors.primary }]}>
                    Max: {priceMax} RON
                  </ThemedText>
                  <TouchableOpacity onPress={() => setPriceMax('')}>
                    <Ionicons name="close-circle" size={16} color={tokens.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {!showPaid && (
                <View style={[styles.chip, { backgroundColor: `${tokens.colors.primary}15` }]}>
                  <ThemedText style={[styles.chipText, { color: tokens.colors.primary }]}>
                    Fără anunțuri cu preț
                  </ThemedText>
                  <TouchableOpacity onPress={() => setShowPaid(true)}>
                    <Ionicons name="close-circle" size={16} color={tokens.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
              {!showFree && (
                <View style={[styles.chip, { backgroundColor: `${tokens.colors.primary}15` }]}>
                  <ThemedText style={[styles.chipText, { color: tokens.colors.primary }]}>
                    Fără anunțuri gratuite
                  </ThemedText>
                  <TouchableOpacity onPress={() => setShowFree(true)}>
                    <Ionicons name="close-circle" size={16} color={tokens.colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
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
            <ThemedText style={[styles.emptyText, { color: tokens.colors.muted }]}>
              {announcements.length === 0
                ? 'Nu există anunțuri pentru această categorie.'
                : 'Nu s-au găsit anunțuri care să corespundă filtrelor.'}
            </ThemedText>
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
                      <ThemedText numberOfLines={2} style={[styles.gridTitle, { color: tokens.colors.text }]}>
                        {item.title}
                      </ThemedText>
                      <ThemedText numberOfLines={1} style={[styles.gridLocation, { color: tokens.colors.muted }]}>
                        {item.location || ''}
                      </ThemedText>
                      {item.price !== undefined && (
                        <ThemedText style={[styles.gridPrice, { color: tokens.colors.primary }]}>
                          {parseFloat(item.price) === 0 ? 'Gratuit' : `${item.price} RON`}
                        </ThemedText>
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
                      <ThemedText numberOfLines={2} style={[styles.listTitle, { color: tokens.colors.text }]}>
                        {item.title}
                      </ThemedText>
                      <ThemedText numberOfLines={1} style={[styles.listLocation, { color: tokens.colors.muted }]}>
                        {item.location || ''}
                      </ThemedText>
                      {item.price !== undefined && (
                        <ThemedText style={[styles.listPrice, { color: tokens.colors.primary }]}>
                          {parseFloat(item.price) === 0 ? 'Gratuit' : `${item.price} RON`}
                        </ThemedText>
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
  filtersPanel: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  priceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  priceInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  priceSeparator: {
    fontSize: 16,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  filterActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButton: {
    borderWidth: 1,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyButton: {},
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});