import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet,
  useWindowDimensions,
  Platform,
  Alert,
  View,
  Text,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedTextInput } from '@/components/themed-text-input';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useAppTheme } from '../src/context/ThemeContext';
import { useLocale } from '../src/context/LocaleContext';
import api from '../src/services/api';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { findCategoryByLabel } from '../src/constants/categories';
import { Toast } from '../components/ui/Toast';
import { ProtectedRoute } from '@/src/components/ProtectedRoute';

// useWindowDimensions will be read inside the component to handle orientation/responsive layout

interface Announcement {
  _id: string;
  title: string;
  category: string;
  location: string;
  description?: string;
  images?: string[];
  createdAt: string;
}

const TRANSLATIONS = {
  ro: {
    title: 'Anunțurile mele',
    loading: 'Se încarcă anunțurile...',
    searchPlaceholder: 'Caută după titlu, ID sau locație...',
    category: 'Categorie',
    sort: 'Sortare',
    results: 'rezultate',
    searchLabel: 'Căutare',
    categoryLabel: 'Categorie',
    all: 'Toate',
    selectCategory: 'Selectează categoria',
    sortBy: 'Sortează după',
    mostRecent: 'Cele mai recente',
    oldest: 'Cele mai vechi',
    titleAZ: 'Titlu A-Z',
    titleZA: 'Titlu Z-A',
    noResults: 'Nu au fost găsite anunțuri cu criteriile selectate',
    noAnnouncements: 'Nu ai încă niciun anunț publicat',
    edit: 'Editează',
    archive: 'Arhivează',
    delete: 'Șterge',
    refresh: 'Reactualizează',
    archiveTitle: 'Arhivează anunț',
    archiveMessage: "Ești sigur(ă) că vrei să arhivezi acest anunț? Nimeni nu îl va mai putea accesa. Îl poți găsi în pagina 'Anunțuri arhivate'.",
    yes: 'Da',
    no: 'Nu',
    deleteTitle: 'Șterge anunț',
    deleteMessage: 'Sigur vrei să ștergi acest anunț? Această acțiune nu poate fi anulată.',
    deleteBtn: 'Șterge',
    cancel: 'Anulează',
    deleteSuccess: 'Anunțul a fost șters cu succes',
    deleteError: 'Nu s-a putut șterge anunțul. Încearcă din nou',
    archiveSuccess: 'Anunțul a fost arhivat cu succes',
    archiveError: 'Nu s-a putut arhiva anunțul. Încearcă din nou',
    navigationError: 'Nu s-a putut naviga la pagina de editare.',
    errorTitle: 'Eroare',
  },
  en: {
    title: 'My Announcements',
    loading: 'Loading announcements...',
    searchPlaceholder: 'Search by title, ID, or location...',
    category: 'Category',
    sort: 'Sort',
    results: 'results',
    searchLabel: 'Search',
    categoryLabel: 'Category',
    all: 'All',
    selectCategory: 'Select category',
    sortBy: 'Sort by',
    mostRecent: 'Most Recent',
    oldest: 'Oldest',
    titleAZ: 'Title A-Z',
    titleZA: 'Title Z-A',
    noResults: 'No announcements found with the selected criteria',
    noAnnouncements: "You don't have any published announcements yet",
    edit: 'Edit',
    archive: 'Archive',
    delete: 'Delete',
    refresh: 'Refresh',
    archiveTitle: 'Archive Announcement',
    archiveMessage: "Are you sure you want to archive this announcement? No one will be able to access it. You can find it in the 'Archived Announcements' page.",
    yes: 'Yes',
    no: 'No',
    deleteTitle: 'Delete Announcement',
    deleteMessage: 'Are you sure you want to delete this announcement? This action cannot be undone.',
    deleteBtn: 'Delete',
    cancel: 'Cancel',
    deleteSuccess: 'Announcement deleted successfully',
    deleteError: 'Could not delete the announcement. Please try again',
    archiveSuccess: 'Announcement archived successfully',
    archiveError: 'Could not archive the announcement. Please try again',
    navigationError: 'Could not navigate to the edit page.',
    errorTitle: 'Error',
  },
};

export default function MyAnnouncementsScreen() {
  const { width, height } = useWindowDimensions();
  // Consider a device "large" (tablet / landscape) if the shortest side is >= 600
  // This catches portrait tablets that have width < 768 but are still large screens.
  const shortestSide = Math.min(width, height);
  const isLarge = shortestSide >= 600;
  // Detect narrow tablets (600-750px width) to use smaller image and adjust layout
  const isNarrowTablet = isLarge && width >= 600 && width < 750;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { isDark, tokens } = useAppTheme();
  const { locale } = useLocale();
  const t = TRANSLATIONS[locale] || TRANSLATIONS.ro;
  
  // English labels for categories keyed by category key from CATEGORY_DEFS
  const CATEGORY_LABELS_EN: Record<string, string> = {
    fotografie: 'Photography',
    prajituri: 'Cakes',
    muzica: 'Music',
    reparatii: 'Repairs',
    dans: 'Dance',
    curatenie: 'Cleaning',
    gradinarit: 'Gardening',
    sport: 'Sports',
    arta: 'Art',
    tehnologie: 'Technology',
    auto: 'Auto',
    meditatii: 'Tutoring',
  };

  const getCategoryLabel = (label?: string) => {
    if (!label) return '';
    if (label === t.all) return t.all;
    const def = findCategoryByLabel(label);
    if (!def) return label;
    return locale === 'en' ? (CATEGORY_LABELS_EN[def.key] || def.label) : def.label;
  };
  
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  // shared border style for container-like elements to match other pages
  const containerBorderStyle = { borderWidth: isDark ? 1 : 0, borderColor: tokens.colors.borderNeutral } as const;
  const insets = useSafeAreaInsets();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(locale === 'en' ? 'All' : 'Toate');
  const [sortFilter, setSortFilter] = useState(locale === 'en' ? 'mostRecent' : 'cea mai recenta');
  const [activePickerType, setActivePickerType] = useState<'category' | 'sort' | null>(null);
  // Track per-card content heights so the left image can match the card height exactly
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const [rowWidths, setRowWidths] = useState<Record<string, number>>({});

  // Confirm dialog state for delete
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  // Confirm dialog state for archive
  const [hideDialogVisible, setHideDialogVisible] = useState(false);
  const [announcementToHide, setAnnouncementToHide] = useState<string | null>(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (isAuthenticated) {
      fetchAnnouncements();
    }
  }, [authLoading, isAuthenticated]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/users/my-announcements');
      setAnnouncements(res.data || []);
    } catch (e) {
      console.error('Error fetching announcements:', e);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const uniqueCategories = useMemo(() => {
    const categories = announcements.map((a) => a.category).filter(Boolean);
    return [t.all, ...Array.from(new Set(categories))];
  }, [announcements]);

  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements.filter((a) => {
      const searchWords = searchTerm.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
      let matchesSearch = true;

      if (searchWords.length > 0) {
        const titleWords = a.title.toLowerCase();
        const idText = a._id?.toLowerCase() || '';
        const locationText = a.location?.toLowerCase() || '';

        matchesSearch = searchWords.every((sw) =>
          titleWords.includes(sw) || idText.includes(sw) || locationText.includes(sw)
        );
      }

      const matchesCategory = categoryFilter === t.all || a.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    filtered.sort((a, b) => {
      switch (sortFilter) {
        case 'oldest':
        case 'cea mai veche':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'mostRecent':
        case 'cea mai recenta':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'titleAZ':
        case 'titlu_a_z':
          return a.title.localeCompare(b.title, locale === 'en' ? 'en' : 'ro');
        case 'titleZA':
        case 'titlu_z_a':
          return b.title.localeCompare(a.title, locale === 'en' ? 'en' : 'ro');
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [announcements, searchTerm, categoryFilter, sortFilter]);

  const handleDelete = (id: string) => {
    setAnnouncementToDelete(id);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (!announcementToDelete) return;

    try {
      await api.delete(`/api/users/my-announcements/${announcementToDelete}`);
      setAnnouncements(announcements.filter((a) => a._id !== announcementToDelete));
      setDeleteDialogVisible(false);
      setAnnouncementToDelete(null);
      showToast(t.deleteSuccess, 'success');
    } catch (e) {
      console.error('Delete error:', e);
      setDeleteDialogVisible(false);
      setAnnouncementToDelete(null);
      showToast(t.deleteError, 'error');
    }
  };

  const cancelDelete = () => {
    setDeleteDialogVisible(false);
    setAnnouncementToDelete(null);
  };

  const handleEdit = (announcement: Announcement) => {
    console.log('Editing announcement:', announcement._id);
    try {
      router.push(`/edit-announcement?id=${announcement._id}`);
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(t.errorTitle, t.navigationError);
    }
  };

  const handleReactivate = (announcement: Announcement) => {
    Alert.alert('Reactualizează', `Reactualizare anunț: ${announcement.title}`);
  };

  const handleDeactivate = (announcement: Announcement) => {
    // Open the hide/ascunde confirmation dialog
    setAnnouncementToHide(announcement._id);
    setHideDialogVisible(true);
  };

  const confirmHide = async () => {
    if (!announcementToHide) return;

    try {
      await api.put(`/api/users/my-announcements/${announcementToHide}/archive`);
      // Remove from the current list since it's now archived
      setAnnouncements(announcements.filter((a) => a._id !== announcementToHide));
      setHideDialogVisible(false);
      setAnnouncementToHide(null);
      showToast(t.archiveSuccess, 'success');
      // Navigate to archived announcements page after toast is visible
      setTimeout(() => {
        router.push('/archived-announcements');
      }, 1800);
    } catch (e) {
      console.error('Archive error:', e);
      setHideDialogVisible(false);
      setAnnouncementToHide(null);
      showToast(t.archiveError, 'error');
    }
  };

  const cancelHide = () => {
    setHideDialogVisible(false);
    setAnnouncementToHide(null);
  };

  const getImageSrc = (img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    if (img.startsWith('uploads/')) return `${base}/${img}`;
    return `${base}/uploads/${img.replace(/^.*[\\/]/, '')}`;
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={tokens.colors.primary} />
        <ThemedText style={styles.loadingText}>{t.loading}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header (match 'Contul tău' layout: back button + title) -- placed inside ScrollView so it scrolls */}
  {/* Remove default header bottom border on this screen to avoid a visible line above the search container */}
  <View style={[styles.header, { paddingTop: insets.top, borderBottomWidth: 0, borderBottomColor: 'transparent' }]}> 
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
              <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.headerTitle, { color: tokens.colors.text }]}>{t.title}</ThemedText>
          </View>
        </View>

        {/* Search and Filter Section */}
        {announcements.length > 0 && (
          <View style={[
            styles.searchSection, 
            { 
              backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface,
              borderWidth: isDark ? 1 : 0,
              borderColor: isDark ? tokens.colors.borderNeutral : 'transparent',
              borderRadius: 12,
              overflow: 'hidden',
            }
          ]}> 
            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: isDark ? '#121212' : tokens.colors.bg, borderWidth: isDark ? 1 : 0, borderColor: isDark ? tokens.colors.borderNeutral : 'transparent' }]}>
              <Ionicons name="search" size={20} color={tokens.colors.muted} style={styles.searchIcon} />
              <ThemedTextInput
                style={styles.searchInput}
                placeholder={t.searchPlaceholder}
                placeholderTextColor={tokens.colors.placeholder}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>

            {/* Filter Row */}
            <View style={styles.filterRow}>
              {/* Category Filter */}
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  { backgroundColor: isDark ? '#121212' : tokens.colors.bg, borderColor: isDark ? tokens.colors.borderNeutral : 'transparent' },
                  activePickerType === 'category' && styles.filterButtonActive,
                ]}
                onPress={() => setActivePickerType(activePickerType === 'category' ? null : 'category')}
              >
                <Ionicons name="apps-outline" size={16} color={activePickerType === 'category' ? '#fff' : (isDark ? tokens.colors.primary : '#355070')} />
                <ThemedText style={[
                  styles.filterButtonText,
                  activePickerType === 'category' && styles.filterButtonTextActive,
                ]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  {categoryFilter === t.all ? t.category : getCategoryLabel(categoryFilter)}
                </ThemedText>
                <Ionicons 
                  name={activePickerType === 'category' ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={activePickerType === 'category' ? '#fff' : (isDark ? tokens.colors.primary : '#355070')} 
                />
              </TouchableOpacity>

              {/* Sort Filter */}
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  { backgroundColor: isDark ? '#121212' : tokens.colors.bg, borderColor: isDark ? tokens.colors.borderNeutral : 'transparent' },
                  activePickerType === 'sort' && styles.filterButtonActive,
                ]}
                onPress={() => setActivePickerType(activePickerType === 'sort' ? null : 'sort')}
              >
                <Ionicons name="swap-vertical" size={16} color={activePickerType === 'sort' ? '#fff' : (isDark ? tokens.colors.primary : '#355070')} />
                <ThemedText style={[
                  styles.filterButtonText,
                  activePickerType === 'sort' && styles.filterButtonTextActive,
                ]} numberOfLines={1}>
                  {t.sort}
                </ThemedText>
                <Ionicons 
                  name={activePickerType === 'sort' ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color={activePickerType === 'sort' ? '#fff' : (isDark ? tokens.colors.primary : '#355070')} 
                />
              </TouchableOpacity>

              {/* Results Count */}
              <View style={styles.resultsCount}>
                <ThemedText style={styles.resultsText}>{filteredAndSortedAnnouncements.length} {t.results}</ThemedText>
              </View>
            </View>



            {/* Active Filters */}
            {(searchTerm || categoryFilter !== t.all) && (
              <View style={styles.activeFilters}>
                {searchTerm && (
                  <View style={styles.chip}>
                    <ThemedText style={styles.chipText}>
                      {t.searchLabel}: "{searchTerm.length > 15 ? searchTerm.substring(0, 15) + '...' : searchTerm}"
                    </ThemedText>
                    <TouchableOpacity onPress={() => setSearchTerm('')}>
                      <Ionicons name="close-circle" size={16} color={tokens.colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                {categoryFilter !== t.all && (
                  <View style={styles.chip}>
                    <ThemedText style={styles.chipText}>{t.categoryLabel}: {getCategoryLabel(categoryFilter)}</ThemedText>
                    <TouchableOpacity onPress={() => setCategoryFilter(t.all)}>
                      <Ionicons name="close-circle" size={16} color={tokens.colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Announcements List */}
        {filteredAndSortedAnnouncements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={64} color={tokens.colors.placeholder} />
            <ThemedText style={styles.emptyText}>
              {searchTerm || categoryFilter !== t.all
                ? t.noResults
                : t.noAnnouncements}
            </ThemedText>
          </View>
        ) : (
          filteredAndSortedAnnouncements.map((announcement) => {
            const imageUri = announcement.images?.[0]
              ? getImageSrc(announcement.images[0])
              : null;
            const measuredContentHeight = rowHeights[announcement._id];
            const baseMobileHeight = 170;
            const imageTargetHeight = isLarge
              ? undefined
              : Math.max(baseMobileHeight, measuredContentHeight || 0);

            return (
              <View
                key={announcement._id}
                style={[styles.card, isLarge && styles.cardLarge, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}
              >
                {/* Image - Left side */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push(`/announcement-details?id=${announcement._id}`)}
                  style={[
                    styles.cardImage,
                    isLarge ? (isNarrowTablet ? styles.cardImageNarrowTablet : styles.cardImageLarge) : null,
                    !isLarge && imageTargetHeight ? { height: imageTargetHeight } : null,
                  ]}
                >
                  {imageUri ? (
                    <Image
                      source={{ uri: imageUri }}
                      style={[styles.image, isLarge ? styles.imageLarge : null]}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.image, styles.placeholderImage]}>
                      <Ionicons name="image-outline" size={40} color={tokens.colors.placeholder} />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Content - Right side */}
                <View
                  style={[
                    styles.cardContent,
                    isLarge ? (isNarrowTablet ? styles.cardContentNarrowTablet : styles.cardContentLarge) : null,
                  ]}
                  onLayout={(e) => {
                    const h = e.nativeEvent.layout.height;
                    const w = e.nativeEvent.layout.width;
                    setRowHeights((prev) => {
                      const curr = prev[announcement._id];
                      // Avoid unnecessary re-renders
                      if (curr && Math.abs(curr - h) < 1) return prev;
                      return { ...prev, [announcement._id]: h };
                    });
                    setRowWidths((prev) => {
                      const currW = prev[announcement._id];
                      if (currW && Math.abs(currW - w) < 1) return prev;
                      return { ...prev, [announcement._id]: w };
                    });
                  }}
                >
                  {/* Top section: Title + ID */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push(`/announcement-details?id=${announcement._id}`)}
                  >
                    <View style={styles.cardTopRow}>
                      <ThemedText style={styles.cardTitle}>
                        {announcement.title}
                      </ThemedText>
                      <View style={styles.idBadge}>
                        <ThemedText style={styles.idText}>ID: {announcement._id?.slice(-8) || ''}</ThemedText>
                      </View>
                    </View>

                    {/* Category badge */}
                    <View style={styles.categoryBadge}>
                      <ThemedText style={styles.categoryText}>{getCategoryLabel(announcement.category)}</ThemedText>
                    </View>

                    {/* Location removed as requested - keep placeholder spacing so buttons stay at bottom */}
                    <View style={styles.locationPlaceholder} />
                  </TouchableOpacity>

                  {/* Action buttons - Always 2x2 layout on large screens */}
                  <View style={styles.actionsGrid}>
                    {isLarge ? (
                      // For tablets/large screens: Always use 2x2 grid with equal-width buttons
                      <>
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.equalButtonTwo, styles.primaryButton, isDark ? { backgroundColor: '#121212' } : {}]}
                            onPress={() => handleEdit(announcement)}
                          >
                            <ThemedText numberOfLines={1} style={styles.primaryButtonText}>{t.edit}</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.equalButtonTwo, styles.secondaryButton, isDark ? { backgroundColor: '#121212' } : {}]}
                            onPress={() => handleDeactivate(announcement)}
                          >
                            <ThemedText numberOfLines={1} style={styles.secondaryButtonText}>{t.archive}</ThemedText>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.equalButtonTwo, styles.dangerButton, isDark ? { backgroundColor: '#121212' } : {}]}
                            onPress={() => handleDelete(announcement._id)}
                          >
                            <ThemedText numberOfLines={1} style={styles.dangerButtonText}>{t.delete}</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              styles.equalButtonTwo,
                              styles.secondaryButton,
                              isDark ? { backgroundColor: '#121212', borderColor: tokens.colors.turquoise, borderWidth: 1 } : {},
                            ]}
                            onPress={() => handleReactivate(announcement)}
                          >
                            <ThemedText numberOfLines={1} style={[styles.secondaryButtonText, isDark ? { color: tokens.colors.turquoise } : {}]}>{t.refresh}</ThemedText>
                          </TouchableOpacity>
                        </View>
                      </>
                    ) : (
                      // For mobile: Keep original adaptive layout
                      <>
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.fillButton, styles.primaryButton, isDark ? { backgroundColor: '#121212' } : {}]}
                            onPress={() => handleEdit(announcement)}
                          >
                            <ThemedText numberOfLines={1} style={styles.primaryButtonText}>{t.edit}</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.secondaryButton, styles.compactButton, isDark ? { backgroundColor: '#121212' } : {}]}
                            onPress={() => handleDeactivate(announcement)}
                          >
                            <ThemedText numberOfLines={1} style={styles.secondaryButtonText}>{t.archive}</ThemedText>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.fillButton, styles.dangerButton, isDark ? { backgroundColor: '#121212' } : {}]}
                            onPress={() => handleDelete(announcement._id)}
                          >
                            <ThemedText numberOfLines={1} style={styles.dangerButtonText}>{t.delete}</ThemedText>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              styles.secondaryButton,
                              styles.compactButton,
                              isDark ? { backgroundColor: '#121212', borderColor: tokens.colors.turquoise, borderWidth: 1 } : {},
                            ]}
                            onPress={() => handleReactivate(announcement)}
                          >
                            <ThemedText numberOfLines={1} style={[styles.secondaryButtonText, isDark ? { color: tokens.colors.turquoise } : {}]}>{t.refresh}</ThemedText>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Archive confirmation dialog */}
      <ConfirmDialog
        visible={hideDialogVisible}
        title={t.archiveTitle}
        message={t.archiveMessage}
        confirmText={t.yes}
        cancelText={t.no}
        icon="archive-outline"
        onConfirm={confirmHide}
        onCancel={cancelHide}
      />

      {/* Picker Modal Overlay */}
      {activePickerType && (
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setActivePickerType(null)}
        >
          <TouchableOpacity 
            style={[styles.modalContent, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]} 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {activePickerType === 'category' ? t.selectCategory : t.sortBy}
              </ThemedText>
              <TouchableOpacity onPress={() => setActivePickerType(null)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={tokens.colors.muted} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {activePickerType === 'category' ? (
                // Category options
                uniqueCategories.map((cat) => {
                  const catDef = cat === t.all ? undefined : findCategoryByLabel(cat);
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.modalOption,
                        { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.bg, borderColor: isDark ? tokens.colors.borderNeutral : 'transparent' },
                        categoryFilter === cat && styles.modalOptionSelected,
                      ]}
                      onPress={() => {
                        setCategoryFilter(cat);
                        setActivePickerType(null);
                      }}
                    >
                      <View style={styles.modalOptionLeft}>
                        {cat === t.all ? (
                          <Ionicons name="apps" size={20} color={categoryFilter === cat ? tokens.colors.primary : tokens.colors.muted} />
                        ) : catDef?.image ? (
                          <Image source={catDef.image} style={{ width: 20, height: 20, borderRadius: 4 }} resizeMode="contain" />
                        ) : (
                          <Ionicons name={(catDef && (catDef.icon as any)) || 'pricetag'} size={20} color={categoryFilter === cat ? tokens.colors.primary : (catDef?.color || tokens.colors.muted)} />
                        )}
                        <ThemedText
                          style={[
                            styles.modalOptionText,
                            categoryFilter === cat && styles.modalOptionTextSelected,
                          ]}
                        >
                          {getCategoryLabel(cat)}
                        </ThemedText>
                      </View>
                      {categoryFilter === cat && (
                        <Ionicons name="checkmark-circle" size={22} color={tokens.colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                // Sort options
                [
                  { value: locale === 'en' ? 'mostRecent' : 'cea mai recenta', label: t.mostRecent, icon: 'arrow-down' },
                  { value: locale === 'en' ? 'oldest' : 'cea mai veche', label: t.oldest, icon: 'arrow-up' },
                  { value: locale === 'en' ? 'titleAZ' : 'titlu_a_z', label: t.titleAZ, icon: 'text' },
                  { value: locale === 'en' ? 'titleZA' : 'titlu_z_a', label: t.titleZA, icon: 'text' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalOption,
                      sortFilter === option.value && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      setSortFilter(option.value);
                      setActivePickerType(null);
                    }}
                  >
                    <View style={styles.modalOptionLeft}>
                      <Ionicons 
                        name={option.icon as any} 
                        size={20} 
                        color={sortFilter === option.value ? tokens.colors.primary : tokens.colors.muted} 
                      />
                      <ThemedText
                        style={[
                          styles.modalOptionText,
                          sortFilter === option.value && styles.modalOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </View>
                    {sortFilter === option.value && (
                      <Ionicons name="checkmark-circle" size={22} color={tokens.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title={t.deleteTitle}
        message={t.deleteMessage}
        confirmText={t.deleteBtn}
        cancelText={t.cancel}
        icon="trash-outline"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={3000}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

const createStyles = (tokens: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: tokens.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.bg,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: tokens.colors.muted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 12,
  },
  searchSection: {
    // Base styles; border, borderRadius, overflow applied inline for precise control in dark mode
    padding: 12,
    marginBottom: 16,
    // Minimal shadow to avoid artifacts with overflow:hidden
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: tokens.colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.bg,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    flex: 1,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 36,
  },
  filterButtonActive: {
    backgroundColor: tokens.colors.primary,
    borderColor: tokens.colors.primary,
  },
  filterButtonText: {
    fontSize: 11,
    color: tokens.colors.primary,
    fontWeight: '600',
    flex: 1,
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  resultsCount: {
    paddingHorizontal: 8,
  },
  resultsText: {
    fontSize: 12,
    color: tokens.colors.muted,
  },
  // Modal Overlay & Content
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: tokens.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: tokens.colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: tokens.colors.bg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalOptionSelected: {
    backgroundColor: tokens.colors.elev,
    borderColor: tokens.colors.primary,
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalOptionText: {
    fontSize: 15,
    color: tokens.colors.text,
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: tokens.colors.primary,
    fontWeight: '600',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.elev,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  chipText: {
    fontSize: 12,
    color: tokens.colors.primary,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: tokens.colors.muted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: tokens.colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  // Large screen variants (tablet / desktop)
  cardLarge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // Remove forced minHeight & stretch so card wraps its content naturally on tablets
  },
  cardImageLarge: {
    width: 300,
    minWidth: 300,
    height: 180, // fixed height so it doesn't stretch full screen
  },
  cardImageNarrowTablet: {
    width: 180,
    minWidth: 180,
    height: 160,
  },
  imageLarge: {
    width: '100%',
    height: '100%', // matches fixed parent height (180)
  },
  cardContentLarge: {
    padding: 20,
    flex: 1,
    justifyContent: 'space-between',
    // Remove height: '100%' to prevent card from expanding to viewport height
  },
  cardContentNarrowTablet: {
    padding: 14,
    flex: 1,
    justifyContent: 'space-between',
  },
  cardImage: {
    width: '42%',
    height: 170,
    backgroundColor: tokens.colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.colors.elev,
  },
  cardContent: {
    flex: 1,
    padding: 8,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: tokens.colors.text,
    marginBottom: 0,
    marginRight: 8,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: tokens.colors.elev,
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginBottom: 4,
    marginTop: 2,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.primary,
  },
  // locationRow and locationText removed — location not shown in list cards anymore
  locationPlaceholder: {
    height: 18,
    marginBottom: 6,
  },
  idBadge: {
    backgroundColor: tokens.colors.bg,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
    alignSelf: 'flex-start',
  },
  idText: {
    fontSize: 10,
    color: tokens.colors.placeholder,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionsLarge: {
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    width: '100%',
  },
  actionsRowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    width: '100%',
    flexWrap: 'nowrap',
  },
  fillButton: {
    flex: 1,
    marginRight: 6,
  },
  equalButton: {
    flex: 1,
    minWidth: 0,
    marginRight: 6,
  },
  equalButtonTwo: {
    flex: 1,
    minWidth: 0,
  },
  equalButtonFour: {
    flex: 1,
    minWidth: 0,
  },
  compactButton: {
    flexShrink: 0,
    // minWidth removed to allow button to shrink to content size (strictly necessary width)
    // minWidth: 100, 
  },
  actionButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 2,
    // Let each button size to its content; rows will manage spacing
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    borderColor: tokens.colors.primary,
    backgroundColor: tokens.colors.surface,
  },
  primaryButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.primary,
    textAlign: 'center',
    includeFontPadding: false,
  },
  secondaryButton: {
    borderColor: tokens.colors.muted,
    backgroundColor: tokens.colors.surface,
  },
  secondaryButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.colors.muted,
    textAlign: 'center',
    includeFontPadding: false,
  },
  dangerButton: {
    borderColor: '#dc3545',
    backgroundColor: tokens.colors.surface,
  },
  dangerButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc3545',
    textAlign: 'center',
    includeFontPadding: false,
  },
});