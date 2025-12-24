import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../components/themed-text';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../src/context/ThemeContext';
import api from '../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';

const TRANSLATIONS = {
  ro: {
    title: 'Toate anunțurile',
    loading: 'Se încarcă anunțurile...',
    noAnnouncements: 'Nu există anunțuri',
  },
  en: {
    title: 'All announcements',
    loading: 'Loading announcements...',
    noAnnouncements: 'No announcements found',
  }
};

export default function AllAnnouncements() {
  const { tokens, isDark } = useAppTheme();
  const colors = isDark ? {
    bg: '#121212', surface: '#282828', elev: '#3f3f3f', border: '#575757', placeholder: '#717171', muted: '#8b8b8b', text: '#FFFFFF', primary: '#f51866'
  } : tokens.colors;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const params = useLocalSearchParams();
  const qParam = (params.q as string) || '';
  const [searchTerm, setSearchTerm] = useState(qParam || '');
  const locale = (Intl && Intl?.DateTimeFormat && (Intl.DateTimeFormat().resolvedOptions().locale || 'ro')) || 'ro';
  const t = TRANSLATIONS[locale === 'en' ? 'en' : 'ro'];

  const getImageSrc = (img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    if (img.startsWith('uploads/')) return `${base}/${img}`;
    return `${base}/uploads/${img.replace(/^.*[\\\/]/, '')}`;
  };

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/announcements');
      const data = Array.isArray(res.data) ? res.data : [];
      // sort by views (desc) then createdAt desc
      data.sort((a: any, b: any) => {
        const av = (a.views || a.viewsCount || 0);
        const bv = (b.views || b.viewsCount || 0);
        if (bv !== av) return bv - av;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setAnnouncements(data);
    } catch (e) {
      console.error('Error loading announcements:', e);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  useEffect(() => {
    if (qParam && qParam !== searchTerm) setSearchTerm(qParam);
  }, [qParam]);

  const filteredAnnouncements = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length === 0) return announcements;
    const words = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return announcements.filter((a) => {
      const title = (a.title || '').toLowerCase();
      const desc = (a.description || '').toLowerCase();
      const hay = `${title} ${desc}`;
      return words.every(w => hay.includes(w));
    });
  }, [announcements, searchTerm]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnnouncements();
    setRefreshing(false);
  }, [fetchAnnouncements]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={[styles.loadingText, { color: colors.muted }]}>{t.loading}</ThemedText>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.container, { backgroundColor: tokens.colors.bg || colors.bg }]}> 
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: colors.text }]}>{t.title}</ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filteredAnnouncements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={64} color={colors.placeholder} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>{t.noAnnouncements}</ThemedText>
          </View>
        ) : (
          filteredAnnouncements.map((ann, index) => {
            const firstImage = ann.images?.[0] ? getImageSrc(ann.images[0]) : null;
            const sellerName = ann.user ? `${ann.user.firstName || ''} ${ann.user.lastName || ''}`.trim() : 'Anonim';
            const isDarkMode = isDark;
            const cardBg = isDarkMode ? '#121212' : '#fff';
            return (
              <Pressable
                key={ann._id}
                onPress={() => router.push(`/announcement-details?id=${ann._id}`)}
                style={({ pressed }) => [
                  styles.modernCard,
                  styles.modernRow,
                  {
                    backgroundColor: cardBg,
                    opacity: pressed ? 0.96 : 1,
                    borderWidth: isDarkMode ? 1 : 0,
                    borderColor: isDarkMode ? '#575757' : 'transparent',
                  },
                ]}
              >
                {!isDarkMode && (
                  <LinearGradient colors={[tokens.colors.primary || '#355070', '#ffd']} style={styles.leftAccent} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
                )}
                <View style={[styles.squareImageWrapper, { marginLeft: isDarkMode ? 0 : 22 }]}>
                  {firstImage ? (
                    <Image source={{ uri: firstImage }} style={styles.squareImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.squareImagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color={isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.25)'} />
                    </View>
                  )}
                </View>
                <View style={styles.squareContent}>
                  <ThemedText style={[styles.modernTitle, { color: isDarkMode ? '#fff' : '#111' }]} numberOfLines={2}>{ann.title}</ThemedText>
                  <View style={[styles.categoryBadgeModern, { backgroundColor: isDarkMode ? 'rgba(245,24,102,0.15)' : 'rgba(255,255,255,0.55)', borderWidth: isDarkMode ? 1 : 0, borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'transparent' }]}>
                    <ThemedText style={[styles.categoryBadgeText, { color: isDarkMode ? '#ffabb7' : '#222' }]} numberOfLines={1}>{ann.category}</ThemedText>
                  </View>
                  <ThemedText style={[styles.modernSub, { color: isDarkMode ? '#fff' : '#333', opacity: 0.75 }]} numberOfLines={1}>{sellerName}</ThemedText>
                  <ThemedText style={[styles.modernDate, { color: isDarkMode ? '#fff' : '#666', opacity: 0.55 }]}>Postat {ann.createdAt ? new Date(ann.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</ThemedText>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  modernCard: { borderRadius: 26, paddingVertical: 16, paddingHorizontal: 16, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  modernRow: { flexDirection: 'row', alignItems: 'center' },
  leftAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 16, borderTopLeftRadius: 26, borderBottomLeftRadius: 26 },
  squareImageWrapper: { width: 100, height: 100, borderRadius: 16, overflow: 'hidden', marginLeft: 22, marginRight: 14, backgroundColor: 'rgba(0,0,0,0.05)' },
  squareImage: { width: '100%', height: '100%' },
  squareImagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  squareContent: { flex: 1, gap: 6, paddingRight: 40 },
  modernTitle: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  modernSub: { fontSize: 13, fontWeight: '600' },
  modernDate: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  categoryBadgeModern: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.55)' },
  categoryBadgeText: { fontSize: 12, fontWeight: '600' },
});