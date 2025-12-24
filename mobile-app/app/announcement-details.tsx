import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions, Linking, Platform, Modal, Share, TextInput } from 'react-native';
import { ThemedText } from '../components/themed-text';
import { ThemedTextInput } from '../components/themed-text-input';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '../src/context/ThemeContext';
import api from '../src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ImageViewing from '../src/components/ImageViewer';
import Constants from 'expo-constants';

interface Announcement {
  _id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  contactPerson: string;
  contactEmail?: string;
  contactPhone?: string;
  images?: string[];
  views?: number;
  favoritesCount?: number;
  createdAt: string;
  user?: { _id: string; firstName?: string; lastName?: string; avatar?: string };
}

export default function AnnouncementDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tokens, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  // Use the shared ImageViewer component to handle native pinch/zoom and swiping.
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  const [fallbackImage, setFallbackImage] = useState<string | null>(null);
  const [favorited, setFavorited] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  // Seller review stats (fetched separately because announcement.user may not include aggregated stats)
  const [sellerRating, setSellerRating] = useState<number | null>(null);
  const [sellerReviewCount, setSellerReviewCount] = useState<number>(0);
  const [sellerReviewsLoading, setSellerReviewsLoading] = useState<boolean>(false);

  const width = Dimensions.get('window').width;
  const isLarge = width >= 768;
  const imageScrollRef = useRef<ScrollView | null>(null);
  // Use full screen width for the image carousel to match preview page
  const containerWidth = width;

  // Memoize the viewer header to prevent recreating it on every render (which causes page reload effect)
  const viewerHeaderComponent = useCallback(() => (
    <View style={[styles.viewerHeader, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={() => setImageViewerVisible(false)} style={[styles.viewerCloseBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
        <Ionicons name="close" size={20} color={tokens.colors.text} />
      </TouchableOpacity>
    </View>
  ), [insets.top, tokens.colors.surface, tokens.colors.border, tokens.colors.text]);

  const fetchAnnouncement = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
  setFetchError(null);
  // Use public announcement endpoint so details can be viewed for any announcement
  const res = await api.get(`/api/announcements/${id}`);
      setAnnouncement(res.data);
      // after loading announcement, check if it's in user's favorites
      try {
        const favRes = await api.get('/api/favorites');
        const favIds = favRes?.data?.favoriteIds || favRes?.data?.favorites || [];
        if (Array.isArray(favIds)) {
          setFavorited(favIds.some((f: any) => String(f) === String(id)));
        }
      } catch (favErr) {
        // ignore if not authenticated or any error
      }
    } catch (e: any) {
      console.error('Error loading announcement details:', e?.message || e);
      setFetchError('Nu am putut încărca anunțul.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAnnouncement();
  }, [fetchAnnouncement]);

  // Ascund header-ul implicit al navigatorului (evit bara neagră de sus)
  useEffect(() => {
    try {
      // @ts-ignore
      navigation.setOptions?.({ headerShown: false });
    } catch (e) {
      // nu blochează execuția dacă nu e disponibil
    }
  }, [navigation]);

  // Nu mai avem nevoie de geocodare sau MapView nativ — folosim iframe Google Maps pe toate platformele (funcționează în Expo Go)

  const getImageSrc = (img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    // ensure baseURL has no trailing slash
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    // handle "uploads/xxx.jpg" or bare filenames
    if (img.startsWith('uploads/')) return `${base}/${img}`;
    return `${base}/uploads/${img.replace(/^.*[\\\/]/, '')}`;
  };

  const images = announcement?.images || [];
  const currentImage = fallbackImage || (images[imgIndex] ? getImageSrc(images[imgIndex]) : null);

  // Memoize the gallery to prevent recreating it on every render
  const imageGallery = React.useMemo(() => {
    return (images || [])
      .map((im) => getImageSrc(im))
      .filter((u): u is string => !!u)
      .map((u) => ({ uri: u }));
  }, [images]);

  const initials = () => {
    const f = announcement?.user?.firstName?.[0] || '';
    const l = announcement?.user?.lastName?.[0] || '';
    return (f + l || 'U').toUpperCase();
  };

  // Prefer explicit seller stats fetched from /api/reviews/:userId, fallback to announcement.user values if present
  const rating = sellerRating ?? (announcement as any)?.user?.rating ?? 0;
  const reviewCount = sellerReviewCount ?? (announcement as any)?.user?.reviewCount ?? 0;

  // Fetch seller's reviews/stats whenever the announcement's user id is available
  useEffect(() => {
    const uid = announcement?.user?._id;
    if (!uid) {
      setSellerRating(null);
      setSellerReviewCount(0);
      return;
    }

    let cancelled = false;
    const fetchSellerReviews = async () => {
      try {
        setSellerReviewsLoading(true);
        const res = await api.get(`/api/reviews/${encodeURIComponent(String(uid))}`);
        const arr = Array.isArray(res.data) ? res.data : [];
        if (cancelled) return;

        if (arr.length > 0) {
          const total = arr.reduce((sum: number, r: any) => sum + (r.score ?? r.rating ?? r.value ?? 0), 0);
          const avg = total / arr.length;
          setSellerRating(avg);
          setSellerReviewCount(arr.length);
        } else {
          setSellerRating(null);
          setSellerReviewCount(0);
        }
      } catch (err) {
        console.warn('[AnnouncementDetails] Failed to load seller reviews', err);
        if (!cancelled) {
          setSellerRating(null);
          setSellerReviewCount(0);
        }
      } finally {
        if (!cancelled) setSellerReviewsLoading(false);
      }
    };

    fetchSellerReviews();
    return () => { cancelled = true; };
  }, [announcement?.user?._id]);

  const goToChat = () => {
    try {
      // Navigate to Messages tab and pass info to open a conversation with the announcement owner.
      // Chat screen will try to match an existing conversationId or create a temporary conversation view.
      const ownerId = announcement?.user?._id;
      if (!ownerId) {
        router.push('/(tabs)/chat');
        return;
      }
      const params = {
        announcementOwnerId: String(ownerId),
        announcementOwnerFirstName: announcement?.user?.firstName || '',
        announcementOwnerLastName: announcement?.user?.lastName || '',
        announcementOwnerAvatar: announcement?.user?.avatar || '',
        announcementImage: getImageSrc(images[0]) || null,
        announcementId: String(announcement._id),
        announcementTitle: announcement.title || '',
      } as any;
      // @ts-ignore
      router.push({ pathname: '/(tabs)/chat', params });
    } catch (err) {
      console.warn('goToChat navigation failed', err);
      try { router.push('/(tabs)/chat'); } catch (_) {}
    }
  };

  const goToProfile = () => {
    const uid = announcement?.user?._id;
    try {
      // Navigate to the public profile of the announcement's author.
      // The Profile page expects `userId` as a query param (e.g. /profile?userId=...)
      if (uid) {
        router.push(`/profile?userId=${encodeURIComponent(String(uid))}`);
      } else {
        // fallback to profile root (own profile)
        router.push('/profile');
      }
    } catch {}
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: tokens.colors.bg, paddingTop: insets.top + 40 }]}>        
        <ActivityIndicator size="large" color={tokens.colors.primary} />
        <ThemedText style={[styles.loadingMessage, { color: tokens.colors.muted, marginTop: 12 }]}>Se încarcă anunțul...</ThemedText>
      </View>
    );
  }

  if (fetchError || !announcement) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: tokens.colors.bg, paddingTop: insets.top + 40 }]}>        
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.errorTitle, { color: tokens.colors.text }]}>Eroare</ThemedText>
        <ThemedText style={[styles.errorMessage, { color: tokens.colors.muted }]}>{fetchError || 'Anunțul nu a fost găsit.'}</ThemedText>
        <TouchableOpacity onPress={fetchAnnouncement} style={[styles.retryBtn, { backgroundColor: tokens.colors.primary }]}>          
          <ThemedText style={styles.retryText}>Reîncearcă</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  const scrollStyle: any = Platform.OS === 'web' ? { height: '100vh' } : { flex: 1 };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.colors.bg }}>
      <ScrollView style={scrollStyle} contentContainerStyle={{ paddingBottom: 16 }}>
      {/* Header: circular back button + 'înapoi' text on left, placeholder right for balance */}
      <View style={[styles.headerSpacer, { paddingTop: insets.top + 12 }]}>        
        <View style={[styles.headerRow, { alignItems: 'center' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
            </TouchableOpacity>
            <ThemedText style={[styles.backText, { color: tokens.colors.text, marginLeft: 12 }]}>înapoi</ThemedText>
          </View>

          {/* Placeholder to keep layout balanced */}
          <View style={{ width: 44 }} />
        </View>
      </View>

      {/* Image area (wrapper allows overflow so buttons can overlay outside while inner card stays rounded) */}
      <View style={styles.imageCardWrapper}>
        <View style={[styles.imageCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>        
          {imageGallery.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              ref={(r) => { imageScrollRef.current = r; }}
              onMomentumScrollEnd={(e) => {
                const x = e.nativeEvent.contentOffset.x || 0;
                const newIndex = Math.round(x / containerWidth);
                if (newIndex !== imgIndex) setImgIndex(newIndex);
              }}
              style={{ width: containerWidth, alignSelf: 'center' }}
            >
              {imageGallery.map((src, idx) => (
                <TouchableOpacity key={idx} activeOpacity={0.9} onPress={() => { setImageViewerIndex(idx); setImageViewerVisible(true); }} style={{ width: containerWidth }}>
                  <Image source={{ uri: src.uri }} resizeMode="cover" style={[isLarge ? styles.heroImageLarge : styles.heroImage, { width: containerWidth }]} onError={() => { /* fallback handled earlier */ }} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: tokens.colors.elev }]}>            
              <Ionicons name="image-outline" size={64} color={tokens.colors.placeholder} />
            </View>
          )}
        </View>

        {/* Left / Right nav buttons positioned near image edges (overlay) */}
        {images.length > 1 && (
          <View
            style={[styles.carouselCounter, Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined]}
            {...(Platform.OS !== 'web' ? { pointerEvents: 'none' } : {})}
          >
            <View style={styles.paginationDotsRow}>
              {images.map((_: any, i: number) => (
                <View
                  key={`dot-${i}`}
                  style={{
                    height: 8,
                    borderRadius: 4,
                    marginHorizontal: 4,
                    backgroundColor: i === imgIndex ? tokens.colors.primary : 'rgba(255,255,255,0.5)',
                    width: i === imgIndex ? 24 : 8,
                  }}
                />
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Title placed above the main card to match preview layout */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{announcement.title}</ThemedText>
      </View>

      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View style={[styles.categoryBadge, { backgroundColor: isDark ? tokens.colors.elev : tokens.colors.surface }]}>            
          <ThemedText style={[styles.categoryText, { color: tokens.colors.primary }]}>{announcement.category}</ThemedText>
        </View>
      </View>

      {/* Main Card */}
      <View style={[styles.mainCard, { backgroundColor: isDark ? '#121212' : '#ffffff', borderColor: tokens.colors.border }]}>        
        {/* Action buttons (favorite, share) top-right */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={async () => {
              try {
                if (!favorited) {
                  const r = await api.post(`/api/favorites/${id}`);
                  setFavorited(true);
                  if (r?.data?.favoritesCount !== undefined) {
                    setAnnouncement(prev => prev ? { ...prev, favoritesCount: r.data.favoritesCount } : prev);
                  }
                } else {
                  const r = await api.delete(`/api/favorites/${id}`);
                  setFavorited(false);
                  if (r?.data?.favoritesCount !== undefined) {
                    setAnnouncement(prev => prev ? { ...prev, favoritesCount: r.data.favoritesCount } : prev);
                  }
                }
              } catch (err) {
                console.warn('Favorite toggle failed', err);
              }
            }}
            style={styles.actionCircle}
            accessibilityLabel="Favorite"
          >
            <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={24} color={favorited ? '#E0245E' : tokens.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              try {
                const shareUrl = `${api.defaults.baseURL}/announcements/${id}`;
                await Share.share({ message: `${announcement.title}\n\n${announcement.description}\n\n${shareUrl}` });
              } catch (e) {
                console.warn('Share error', e);
              }
            }}
            style={styles.actionCircle}
            accessibilityLabel="Share"
          >
            <Ionicons name="share-social" size={24} color={tokens.colors.primary} />
          </TouchableOpacity>
        </View>
        <ThemedText style={[styles.postedAt, { color: tokens.colors.muted }]}>Postat {new Date(announcement.createdAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}</ThemedText>
        
        <ThemedText style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#000000' }]}>Descriere</ThemedText>
        <ThemedText style={[styles.description, { color: isDark ? '#ffffff' : '#000000' }]}>{announcement.description}</ThemedText>
        <View style={[styles.divider, { borderBottomColor: tokens.colors.border }]} />
        <View style={styles.metaRow}>          
          <ThemedText style={[styles.metaItem, { color: isDark ? '#ffffff' : tokens.colors.muted }]}>ID: {announcement._id.slice(-8)}</ThemedText>
          {!!announcement.views && <ThemedText style={[styles.metaItem, { color: isDark ? '#ffffff' : tokens.colors.muted }]}>{announcement.views} vizualizări</ThemedText>}
        </View>
      </View>

      {/* Seller Card */}
      <View style={[styles.sellerCard, { backgroundColor: isDark ? '#121212' : '#ffffff', borderColor: tokens.colors.border }]}>        
        <ThemedText style={[styles.sellerHeading, { color: tokens.colors.text }]}>Informații vânzător</ThemedText>

        {/* Avatar + Name + Rating (tap to open seller profile) */}
        <TouchableOpacity
          onPress={goToProfile}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Deschide profilul vânzătorului"
          style={styles.sellerTopRow}
        >
          <View style={[styles.avatar, { backgroundColor: tokens.colors.elev, overflow: 'hidden' }]}>            
            {announcement.user?.avatar ? (
              <Image
                source={{ uri: getImageSrc(announcement.user.avatar) || undefined }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <ThemedText style={[styles.avatarText, { color: tokens.colors.text }]}>{initials()}</ThemedText>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.sellerName, { color: tokens.colors.text }]}>{announcement.user?.firstName} {announcement.user?.lastName}</ThemedText>
            {rating > 0 && reviewCount > 0 ? (
              <View style={styles.ratingRow}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Ionicons
                    key={i}
                    name={i < Math.round(rating) ? 'star' : 'star-outline'}
                    size={16}
                    color="#FFC107"
                  />
                ))}
                <ThemedText style={[styles.ratingValue, { color: tokens.colors.text }]}>{Number(rating).toFixed(1)}</ThemedText>
                <ThemedText style={[styles.ratingCount, { color: tokens.colors.muted }]}>({reviewCount} recenzii)</ThemedText>
              </View>
            ) : (
              sellerReviewsLoading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={tokens.colors.primary} />
                  <ThemedText style={[styles.sellerSub, { color: tokens.colors.muted }]}>se încarcă recenziile...</ThemedText>
                </View>
              ) : (
                <ThemedText style={[styles.sellerSub, { color: tokens.colors.muted }]}>nu există review-uri</ThemedText>
              )
            )}
          </View>
        </TouchableOpacity>

        {/* Contact label + Evaluate button */}
        <View style={styles.contactTopRow}>
          <ThemedText style={[styles.contactLabel, { color: tokens.colors.muted }]}>Persoană de contact:</ThemedText>
          <TouchableOpacity
            onPress={() => {
              setRatingModalVisible(true);
            }}
            style={[styles.evaluateBtn, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
            activeOpacity={0.8}
          >
            <Ionicons name="star-outline" size={16} color={tokens.colors.text} style={{ marginRight: 6 }} />
            <ThemedText style={[styles.evaluateText, { color: tokens.colors.text }]}>Evaluează</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={[styles.contactValue, { color: tokens.colors.text }]}>{announcement.contactPerson}</ThemedText>

        {/* Primary CTA: Send Message */}
        <TouchableOpacity
          onPress={goToChat}
          style={[styles.primaryCta, { backgroundColor: tokens.colors.primary }]}
          activeOpacity={0.9}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <ThemedText style={styles.primaryCtaText}>TRIMITE MESAJ</ThemedText>
        </TouchableOpacity>

        {/* Phone Card */}
        <View style={[styles.phoneCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          <Ionicons name="call-outline" size={20} color={tokens.colors.primary} style={{ marginRight: 10 }} />
          <ThemedText style={[styles.phoneValue, { color: tokens.colors.text }]}>
            {showPhone ? (announcement.contactPhone || '—') : 'xxx xxx xxx'}
          </ThemedText>
          {!!announcement.contactPhone && (
            <TouchableOpacity onPress={() => setShowPhone((s) => !s)} activeOpacity={0.8}>
              <ThemedText style={[styles.showPhoneLink, { color: tokens.colors.primary }]}>
                {showPhone ? 'ASCUNDE' : 'ARATĂ'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Outline: View Profile */}
        <TouchableOpacity
          onPress={goToProfile}
          style={[styles.outlineBtn, { borderColor: tokens.colors.border }]}
          activeOpacity={0.85}
        >
          <ThemedText style={[styles.outlineBtnText, { color: tokens.colors.text }]}>VIZUALIZARE PROFIL</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Rating Modal removed - moved to absolute overlay */}

      {/* Location Section */}
      <View style={styles.locationSection}>
        <View style={styles.locationHeader}>
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>Locație</ThemedText>
          <TouchableOpacity
            onPress={() => {
              if (!announcement.location) return;
              const q = encodeURIComponent(announcement.location);
              const url = `https://www.google.com/maps/search/?api=1&query=${q}`;
              Linking.openURL(url);
            }}
          >
            <ThemedText style={{ color: tokens.colors.primary, fontSize: 13, fontWeight: '600' }}>Deschide Harta</ThemedText>
          </TouchableOpacity>
        </View>
        {/* Map embed: iframe pe web, WebView pe mobile (funcționează în Expo Go) */}
        <View style={[styles.mapContainer, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>          
          {announcement.location ? (
            (() => {
              const encoded = encodeURIComponent(announcement.location);
              // Try to read key from Expo constants (extra) or env var
              const key = (Constants?.expoConfig?.extra?.VITE_GOOGLE_MAPS_KEY as string) || (Constants?.manifest?.extra?.VITE_GOOGLE_MAPS_KEY as string) || process.env?.EXPO_PUBLIC_GOOGLE_MAPS_KEY || process.env?.VITE_GOOGLE_MAPS_KEY;
              const mapUrl = key
                ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${encoded}`
                : `https://maps.google.com/maps?q=${encoded}&z=15&output=embed`;

              if (Platform.OS === 'web') {
                // Web: folosește iframe direct
                return (
                  <View style={styles.mapInnerWrapper}>
                    <iframe title="Locație" src={mapUrl} style={{ border: 0, width: '100%', height: '100%' }} loading="lazy" />
                  </View>
                );
              }

              // Mobile (iOS/Android): folosește WebView cu HTML care conține iframe
              try {
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const { WebView } = require('react-native-webview');
                
                // Creăm o pagină HTML simplă cu iframe-ul Google Maps
                const htmlContent = `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      html, body { width: 100%; height: 100%; overflow: hidden; }
                      iframe { border: 0; width: 100%; height: 100%; display: block; }
                    </style>
                  </head>
                  <body>
                    <iframe src="${mapUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                  </body>
                  </html>
                `;
                
                return (
                  <View style={styles.mapInnerWrapper}>
                    <WebView
                      source={{ html: htmlContent }}
                      style={styles.mapWebview}
                      startInLoadingState
                      javaScriptEnabled
                      domStorageEnabled
                      renderLoading={() => (
                        <View style={[styles.locationMapPlaceholder, { backgroundColor: tokens.colors.elev }]}>
                          <ActivityIndicator size="small" color={tokens.colors.primary} />
                        </View>
                      )}
                    />
                  </View>
                );
              } catch (err: any) {
                console.warn('WebView not available:', err?.message || err);
                return (
                  <View style={[styles.locationMapPlaceholder, { backgroundColor: tokens.colors.elev }]}>
                    <Ionicons name="map-outline" size={48} color={tokens.colors.placeholder} style={{ marginBottom: 8 }} />
                    <ThemedText style={{ color: tokens.colors.muted, fontSize: 13, textAlign: 'center' }}>Harta nu este disponibilă</ThemedText>
                  </View>
                );
              }
            })()
          ) : (
            <View style={[styles.locationMapPlaceholder, { backgroundColor: tokens.colors.elev }]}>          
              <Ionicons name="map-outline" size={48} color={tokens.colors.placeholder} />
            </View>
          )}
        </View>

        <View style={styles.locationRow}>
          <Ionicons name="pin" size={16} color={tokens.colors.primary} />
          <ThemedText style={[styles.locationText, { color: tokens.colors.text, flex: 1 }]}>{announcement.location}</ThemedText>
        </View>
      </View>
      {/* Image Viewer: reuse shared component that handles native pinch/zoom and swiping */}
      <ImageViewing
        images={imageGallery}
        imageIndex={imageViewerIndex}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        HeaderComponent={viewerHeaderComponent}
      />
    </ScrollView>

    {/* Rating Modal Overlay */}
    {ratingModalVisible && (
        <BlurView 
          intensity={80} 
          tint={isDark ? 'dark' : 'light'}
          experimentalBlurMethod="dimezisBlurView"
          style={[StyleSheet.absoluteFill, styles.ratingModalOverlay, { zIndex: 1000 }]}
        >
          <View style={[styles.ratingModalCard, { backgroundColor: isDark ? '#121212' : tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <ThemedText style={[styles.ratingModalTitle, { color: tokens.colors.text }]}>Evaluează utilizatorul</ThemedText>
            <View style={styles.ratingStarsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setRatingScore(i + 1)} activeOpacity={0.8}>
                  <Ionicons name={i < ratingScore ? 'star' : 'star-outline'} size={36} color="#FFC107" style={{ marginRight: 6 }} />
                </TouchableOpacity>
              ))}
              <ThemedText style={[styles.ratingNumeric, { color: tokens.colors.text }]}>{Number(ratingScore).toFixed(1)}</ThemedText>
            </View>

            <View style={[styles.ratingInputWrapper, { borderColor: tokens.colors.border, backgroundColor: isDark ? '#1e1e1e' : tokens.colors.elev }]}> 
              <ThemedTextInput
                multiline
                numberOfLines={4}
                onChangeText={setRatingComment}
                value={ratingComment}
                style={[styles.ratingInput, { color: tokens.colors.text }]}
                placeholder="Comentariu (opțional)"
                placeholderTextColor={tokens.colors.placeholder}
              />
            </View>

            <View style={styles.ratingModalActions}>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)} style={styles.ratingCancelBtn}>
                <ThemedText style={[styles.ratingCancelText, { color: tokens.colors.primary }]}>ANULEAZĂ</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!announcement?.user?._id) return;
                  setSubmittingRating(true);
                  try {
                    await api.post('/api/reviews', {
                      user: announcement.user._id,
                      score: ratingScore,
                      comment: ratingComment || undefined,
                    });
                    setRatingModalVisible(false);
                    setRatingComment('');
                    // optimistic UI: increase reviewCount and average - simplified
                    // Could re-fetch seller profile for accurate numbers
                  } catch (err) {
                    console.warn('Failed to submit review', err);
                    alert('Nu am putut trimite recenzia. Încearcă din nou mai târziu.');
                  } finally {
                    setSubmittingRating(false);
                  }
                }}
                style={styles.ratingSubmitBtn}
                activeOpacity={0.9}
              >
                <ThemedText style={[styles.ratingSubmitText, { color: '#ffffff' }]}>{submittingRating ? 'TRIMITE...' : 'TRIMITE'}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingMessage: { fontSize: 14, fontWeight: '500' },
  errorContainer: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  errorTitle: { fontSize: 22, fontWeight: '700' },
  errorMessage: { fontSize: 15, textAlign: 'center' },
  retryBtn: { marginTop: 12, paddingHorizontal: 22, paddingVertical: 14, borderRadius: 12 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  headerSpacer: { paddingHorizontal: 16, marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { width: 44, height: 44, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  backText: { marginLeft: 8, fontSize: 18, fontWeight: '700' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  // Align image container/styling with the preview carousel
  imageCardWrapper: { marginBottom: 12, position: 'relative', overflow: 'visible' },
  imageCard: { borderRadius: 0, borderWidth: 0, overflow: 'hidden', padding: 0 },
  heroImage: { width: '100%', height: 280, backgroundColor: '#f0f0f0' },
  heroImageLarge: { width: '100%', height: 480, backgroundColor: '#f0f0f0' },
  heroPlaceholder: { width: '100%', height: 280, justifyContent: 'center', alignItems: 'center' },
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  viewerHeader: { position: 'absolute', top: 28, right: 16, zIndex: 20 },
  viewerCloseBtn: { width: 40, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  viewerBody: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
  viewerImage: { width: '100%', height: '80%' },
  viewerFooter: { position: 'absolute', bottom: 24, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 12 },
  viewerControl: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  // place left/right nav buttons as overlays on the sides of the image, vertically centered
  carouselControls: { position: 'absolute', left: 0, right: 0, top: '50%', transform: [{ translateY: -24 }], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, zIndex: 20 },
  navBtn: { width: 48, height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, backgroundColor: 'transparent' },
  // smaller side buttons placed close to image edges
  navBtnLeft: { position: 'absolute', left: 8, top: '50%', transform: [{ translateY: -24 }], width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, zIndex: 30, elevation: 6 },
  navBtnRight: { position: 'absolute', right: 8, top: '50%', transform: [{ translateY: -24 }], width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, zIndex: 30, elevation: 6 },
  // Pagination similar to preview: centered dots near bottom
  carouselCounter: { position: 'absolute', left: 0, right: 0, bottom: 16, alignItems: 'center', justifyContent: 'center', zIndex: 15 },
  carouselCounterBubble: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 999, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
  paginationDotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  counter: { fontSize: 13, fontWeight: '600' },
  cardActions: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 12 },
  actionCircle: { width: 52, height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 0, backgroundColor: 'transparent' },
  mainCard: { marginHorizontal: 16, borderWidth: 1, borderRadius: 18, padding: 20, marginBottom: 20, gap: 12 },
  postedAt: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBadge: { alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 4 },
  categoryText: { fontSize: 14, fontWeight: '600' },
  sectionHeading: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  description: { fontSize: 14, lineHeight: 20 },
  divider: { borderBottomWidth: 1, marginVertical: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  metaItem: { fontSize: 11, fontWeight: '500' },
  sellerCard: { marginHorizontal: 16, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 20, gap: 8 },
  sellerHeading: { fontSize: 18, fontWeight: '700' },
  sellerRow: { flexDirection: 'row', gap: 14 },
  sellerTopRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: '700' },
  sellerName: { fontSize: 16, fontWeight: '700' },
  sellerSub: { fontSize: 13, fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  ratingValue: { marginLeft: 4, fontSize: 13, fontWeight: '700' },
  ratingCount: { marginLeft: 4, fontSize: 12, fontWeight: '600' },
  contactTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  contactLabel: { fontSize: 11, fontWeight: '600', marginTop: 8, textTransform: 'uppercase' },
  contactValue: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  ownBadge: { fontSize: 12, fontWeight: '500', textAlign: 'center', marginTop: 12 },
  evaluateBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 10 },
  evaluateText: { fontSize: 13, fontWeight: '700' },
  primaryCta: { marginTop: 6, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  primaryCtaText: { color: '#ffffff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  phoneCard: { marginTop: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  phoneValue: { flex: 1, fontSize: 15, fontWeight: '700' },
  showPhoneLink: { fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  outlineBtn: { marginTop: 6, borderWidth: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center' },
  outlineBtnText: { fontSize: 14, fontWeight: '700' },
  locationSection: { marginHorizontal: 16, marginBottom: 40 },
  locationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  mapContainer: { height: 160, borderRadius: 16, overflow: 'hidden', borderWidth: 1, position: 'relative' },
  locationMapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapInnerWrapper: { flex: 1, overflow: 'hidden' },
  mapWebview: { flex: 1, backgroundColor: 'transparent' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locationText: { fontSize: 14, fontWeight: '600' },
  /* Rating modal */
  ratingModalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  ratingModalCard: { width: '100%', maxWidth: 520, borderRadius: 10, padding: 18, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  ratingModalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  ratingStarsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratingNumeric: { marginLeft: 8, fontWeight: '700' },
  ratingInputWrapper: { borderWidth: 1, borderRadius: 8, padding: 12, minHeight: 90, marginBottom: 12 },
  ratingInput: { minHeight: 64, textAlignVertical: 'top', padding: 0, margin: 0 },
  ratingModalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, alignItems: 'center' },
  ratingCancelBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  ratingCancelText: { fontSize: 15, fontWeight: '700' },
  ratingSubmitBtn: { backgroundColor: '#f51866', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  ratingSubmitText: { fontSize: 15, fontWeight: '700' },
});