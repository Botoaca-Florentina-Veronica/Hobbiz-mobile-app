import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { LinearGradient } from 'expo-linear-gradient';

interface Announcement {
  _id: string;
  title: string;
  category: string;
  location: string;
  images?: string[];
  createdAt: string;
  user?: { _id: string; firstName?: string; lastName?: string };
}

export default function FavoritesScreen() {
  const { tokens, isDark } = useAppTheme();
  // Dark-mode palette (from attachment): use only these surface tints + pink primary and white for contrast
  const darkPalette = {
    bg: '#121212', // a10
    surface: '#282828', // a20
    elev: '#3f3f3f', // a30 (elevated surface)
    border: '#575757', // a40
    placeholder: '#717171', // a50
    muted: '#8b8b8b', // a60
    text: '#FFFFFF',
    primary: '#f51866', // tint a10 (accent)
    // Pink tints for accents/gradients
    pink2: '#fa4875', // a20
    pink3: '#fe6585', // a30
    pink4: '#ff7e95', // a40
    pink5: '#ff96a6', // a50
    pink6: '#ffabb7', // a60
  } as const;
  const colors = isDark ? darkPalette : tokens.colors;
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [favorites, setFavorites] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/api/favorites');
      setFavorites(res.data?.favorites || []);
    } catch (e) {
      console.error('Error fetching favorites:', e);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, [fetchFavorites]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (id: string) => {
    try {
      await api.delete(`/api/favorites/${id}`);
      setFavorites(prev => prev.filter(f => f._id !== id));
    } catch (e) {
      console.error('Error removing favorite:', e);
    }
  };

  const getImageSrc = (img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    if (img.startsWith('uploads/')) return `${base}/${img}`;
    return `${base}/uploads/${img.replace(/^.*[\\\/]/, '')}`;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg, paddingTop: insets.top }]}> 
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.muted }]}>Se încarcă favorite...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
        <Ionicons name="heart-outline" size={64} color={colors.placeholder} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Autentifică-te</Text>
        <Text style={[styles.emptyMessage, { color: colors.muted }]}>Pentru a vedea anunțurile tale favorite</Text>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/login')}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600' }}>Mergi la autentificare</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.bg, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Favorite</Text>
        </View>
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={[styles.subtitle, { color: colors.text }]}>Anunțuri favorite ({favorites.length}/150)</Text>
      </View>

      {/* List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Image source={require('../../assets/images/gumballSiDarwin.png')} style={styles.emptyImage} resizeMode="contain" />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Niciun anunț favorit</Text>
            <Text style={[styles.emptyMessage, { color: colors.muted }]}>Știi ce înseamnă asta, e timpul să îți adaugi!</Text>
          </View>
        ) : (
          favorites.map((ann, index) => {
            const firstImage = ann.images?.[0] ? getImageSrc(ann.images[0]) : null;
            const sellerName = ann.user ? `${ann.user.firstName || ''} ${ann.user.lastName || ''}`.trim() : 'Anonim';
            const palettes = [
              { bg: '#FFE2D5', g1: '#FFB996', g2: '#FFCDB0', text: '#3A2E2A' },
              { bg: '#D9EEF2', g1: '#8AC6D1', g2: '#B5E4EB', text: '#15393F' },
              { bg: '#FFE8BC', g1: '#FFD079', g2: '#FFE1A3', text: '#563C05' },
              { bg: '#D8E0F5', g1: '#425D9E', g2: '#6E85C4', text: '#1C2844' },
              { bg: '#E9DCF6', g1: '#A678E0', g2: '#C2A3EE', text: '#35224B' },
              { bg: '#E4F7D9', g1: '#89C46C', g2: '#B3E29A', text: '#234314' },
            ];
            const palette = palettes[index % palettes.length];
            // For dark mode: all cards identical (same bg + pink gradient accent)
            const cardBg = isDark ? colors.surface : palette.bg;
            const gradientColors: [string, string] = isDark 
              ? [colors.primary as string, (colors as any).pink4 as string]  // pink gradient (#f51866 → #ff7e95)
              : [palette.g1, palette.g2];
            const textColor = isDark ? colors.text : palette.text;

            return (
              <Pressable
                key={ann._id}
                onPress={() => router.push(`/announcement-details?id=${ann._id}`)}
                style={({ pressed }) => [
                  styles.modernCard,
                  styles.modernRow,
                  {
                    backgroundColor: cardBg,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <LinearGradient
                  colors={gradientColors}
                  style={styles.leftAccent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
                <View style={styles.squareImageWrapper}>
                  {firstImage ? (
                    <Image source={{ uri: firstImage }} style={styles.squareImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.squareImagePlaceholder}>
                      <Ionicons name="image-outline" size={32} color={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.25)'} />
                    </View>
                  )}
                </View>
                <View style={styles.squareContent}>
                  <Text style={[styles.modernTitle, { color: textColor }]} numberOfLines={2}>{ann.title}</Text>
                  <View style={[styles.categoryBadgeModern, { 
                    backgroundColor: isDark ? 'rgba(245,24,102,0.15)' : 'rgba(255,255,255,0.55)',
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? (colors as any).pink5 : 'transparent'
                  }]}>
                    <Text style={[styles.categoryBadgeText, { color: isDark ? (colors as any).pink6 : textColor }]} numberOfLines={1}>{ann.category}</Text>
                  </View>
                  <Text style={[styles.modernSub, { color: textColor, opacity: 0.75 }]} numberOfLines={1}>{sellerName}</Text>
                  <Text style={[styles.modernDate, { color: textColor, opacity: 0.55 }]}>Postat {new Date(ann.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveFavorite(ann._id)}
                  style={[styles.modernFavBtn, { backgroundColor: isDark ? colors.elev : 'rgba(255,255,255,0.65)' }]}
                  activeOpacity={0.75}
                >
                  <Ionicons name="heart" size={20} color={isDark ? colors.primary : '#E0245E'} />
                </TouchableOpacity>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
  emptyImage: { width: 220, height: 180, marginTop: 28, marginBottom: -52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyMessage: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: '600' },
  subtitleContainer: { paddingHorizontal: 16, paddingVertical: 16, alignItems: 'center' },
  subtitle: { fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  /* Legacy card styles removed in favor of modern design */
  modernCard: {
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  modernRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 16,
    borderTopLeftRadius: 26,
    borderBottomLeftRadius: 26,
  },
  squareImageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    marginLeft: 22, // leave space for accent
    marginRight: 14,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  squareImage: { width: '100%', height: '100%' },
  squareImagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  squareContent: { flex: 1, gap: 6, paddingRight: 40 },
  modernTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  modernSub: {
    fontSize: 13,
    fontWeight: '600',
  },
  modernDate: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryBadgeModern: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600'
  },
  modernFavBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
});