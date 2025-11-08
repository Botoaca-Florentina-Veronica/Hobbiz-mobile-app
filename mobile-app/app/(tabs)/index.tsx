import React, { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, Dimensions } from 'react-native';
import { StyleSheet, ScrollView, View, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAppTheme } from '../../src/context/ThemeContext';
import { useResponsive } from '../../src/theme/responsive';
import MobileHeader from '@/components/MobileHeader';
import LegalFooter from '@/components/LegalFooter';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import api from '../../src/services/api';
import { useFocusEffect } from '@react-navigation/native';
import { FlatList, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const categories = [
  { description: 'Fotografie', color: '#FF6B6B', image: require('../../assets/images/camera.png') },
  { description: 'Prajituri', color: '#4ECDC4', image: require('../../assets/images/bake.png') },
  { description: 'Muzica', color: '#45B7D1', image: require('../../assets/images/guitar.png') },
  { description: 'Reparații', color: '#96CEB4', image: require('../../assets/images/pipe.png') },
  { description: 'Dans', color: '#FFEAA7', image: require('../../assets/images/salsa.png') },
  { description: 'Curățenie', color: '#DDA0DD', image: require('../../assets/images/cleaning.png') },
  { description: 'Gradinarit', color: '#98D8C8', image: require('../../assets/images/gardening-logo.jpg') },
  { description: 'Sport', color: '#F7DC6F', image: require('../../assets/images/tennis.png') },
  { description: 'Arta', color: '#BB8FCE', image: require('../../assets/images/arta.png') },
  { description: 'Tehnologie', color: '#85C1E9', image: require('../../assets/images/laptop.png') },
  { description: 'Auto', color: '#F8C471', image: require('../../assets/images/car.png') },
  { description: 'Meditații', color: '#82E0AA', image: require('../../assets/images/carte.png') },
];

// Design colors
const DESIGN_BLUE = '#034e84ff';
// deep blue for announcement titles (matches mock)
const TITLE_BLUE = '#1a3b7eff';

// ==================== CONFIGURARE DIMENSIUNI IMAGINII HERO ====================
// Editează aceste valori pentru a schimba rapid dimensiunea imaginii principale
const HERO_IMAGE_CONFIG = {
  // Aspect ratio (lățime / înălțime) al imaginii
  aspectRatio: 1.5,
  
  // Înălțime minimă (px) - pentru telefoane mici
  minHeight: 260,
  
  // Înălțime maximă (px) - pentru dispozitive foarte mari
  maxHeight: 600,
  
  // Procent din înălțimea ecranului (0.34 = 34%)
  screenHeightPercent: 0.34,
  
  // Border radius (colțuri rotunjite)
  borderRadius: 16,
  
  // Padding orizontal (spațiu la margini)
  horizontalPadding: 32,
  // Suprascrieri specifice telefoanelor (opțional)
  phoneOverrides: {
    // Exemplu: face imaginea mai wide și mai înaltă pe telefoane
    aspectRatio: 1.1,
    minHeight: 320,
    screenHeightPercent: 0.40,
  },
};
// ============================================================================

export default function HomeScreen() {
  const { tokens, isDark } = useAppTheme();
  const { columnsForCategories, width: screenWidth, isPhone, isTablet, isLargeTablet, scale } = useResponsive();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [notifCount, setNotifCount] = useState(0);
  const [popular, setPopular] = useState<any[]>([]);
  const [popularLoading, setPopularLoading] = useState(false);

  // helper: convert hex #RRGGBB to rgba(r,g,b,a)
  const hexToRgba = useCallback((hex: string, alpha: number) => {
    try {
      const h = hex.replace('#', '');
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch {
      return hex; // fallback
    }
  }, []);

  // Configure notifications behavior and Android channel once
  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: false, shouldSetBadge: false })
    });
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.DEFAULT,
      }).catch(() => {});
    }
  }, []);

  const loadCount = useCallback(async () => {
    try {
      if (!isAuthenticated || !user?.id) { 
        setNotifCount(0); 
        return; 
      }
      const res = await api.get(`/api/notifications/${user.id}`);
      const list = Array.isArray(res.data) ? res.data : [];
      // Considerăm ne-citit orice element cu read === false
      const unread = list.filter((n: any) => n && n.read === false).length;
      setNotifCount(unread);
    } catch (e: any) {
      // Suppress 404 and 401 errors in console (user not fully authenticated yet)
      if (e?.response?.status !== 404 && e?.response?.status !== 401) {
        console.error('Error loading notification count:', e);
      }
      setNotifCount(0);
    }
  }, [isAuthenticated, user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadCount();
      loadPopular();
    }, [loadCount])
  );

  const loadPopular = useCallback(async () => {
    setPopularLoading(true);
    try {
      // Fetch all announcements and sort client-side by favoritesCount desc, then createdAt desc
      const res = await api.get('/api/announcements');
      const data = Array.isArray(res.data) ? res.data : [];
      data.sort((a: any, b: any) => {
        const fa = (a.favoritesCount || 0);
        const fb = (b.favoritesCount || 0);
        if (fb !== fa) return fb - fa;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setPopular(data);
    } catch (e) {
      setPopular([]);
    } finally {
      setPopularLoading(false);
    }
  }, []);

  return (
  <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}> 
      <MobileHeader 
        notificationCount={notifCount}
        onSearchFocus={() => console.log('Search focused')}
        onNotificationClick={() => router.push('/notifications')}
      />
  <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.mainContent, { backgroundColor: tokens.colors.surface }]}>
          {
            (() => {
              // Determină dimensiunea titlului în mod responsive
              // Slightly smaller sizes to make the headline a bit less dominant
              const titleSize = isPhone ? Math.round(scale(20)) : isTablet ? Math.round(scale(30)) : isLargeTablet ? Math.round(scale(40)) : Math.round(scale(24));
              return (
                <ThemedText style={[styles.mainText, { color: tokens.colors.text, fontSize: titleSize, fontWeight: '800', lineHeight: Math.round(titleSize * 1.05) }]}> 
                  Ai vreun hobby fain și crezi că e inutil? Găsește oameni care sunt dispuși să plătească pentru el!
                </ThemedText>
              );
            })()
          }
          {(() => {
            // Calculăm dimensiunile imaginii hero folosind configurația de mai sus
            const window = Dimensions.get('window');
            const screenH = window.height || 800;

            // Aplicăm suprascrierile pentru telefoane dacă sunt definite
            const cfg = isPhone && HERO_IMAGE_CONFIG.phoneOverrides && Object.keys(HERO_IMAGE_CONFIG.phoneOverrides).length
              ? { ...HERO_IMAGE_CONFIG, ...HERO_IMAGE_CONFIG.phoneOverrides }
              : HERO_IMAGE_CONFIG;

            const availableWidth = Math.max(320, (screenWidth || 360) - cfg.horizontalPadding);

            // Calculăm înălțimea pe baza lățimii și aspect ratio
            const heightFromWidth = Math.round(availableWidth / cfg.aspectRatio);
            // Calculăm înălțimea pe baza procentului din înălțimea ecranului
            const heightFromScreen = Math.round(screenH * cfg.screenHeightPercent);

            // Alegem înălțimea mai mare dintre cele două, apoi aplicăm limitele min/max
            let calculatedHeight = Math.max(heightFromWidth, heightFromScreen);
            calculatedHeight = Math.max(
              cfg.minHeight,
              Math.min(calculatedHeight, cfg.maxHeight)
            );

            // Calculăm lățimea finală păstrând aspect ratio-ul
            let imageWidth = Math.min(availableWidth, Math.round(calculatedHeight * cfg.aspectRatio));
            const imageHeight = Math.round(imageWidth / cfg.aspectRatio);

            return (
              <View style={[styles.mainHeroWrap, { height: imageHeight + 20, marginBottom: -16 }]}>
                <View style={{ 
                  width: imageWidth, 
                  height: imageHeight,
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: cfg.borderRadius, 
                  overflow: 'hidden'
                }}>
                  <Image
                    // Afișăm hobby_img.jpg pe telefoane și hobbiz-wide-1.png pe tablete
                    source={isPhone 
                      ? require('../../assets/images/hobby_img.jpg') 
                      : require('../../assets/images/hobbiz-wide.png')
                    }
                    style={{ 
                      width: imageWidth, 
                      height: imageHeight, 
                      borderRadius: cfg.borderRadius,
                    }} 
                    resizeMode="contain"
                  />
                </View>
              </View>
            );
          })()}
          <View style={[styles.callToAction, { backgroundColor: tokens.colors.surface }]}> 
            {(() => {
              // Use same bold style as the main title, slightly smaller
              const ctaSize = isPhone ? Math.round(scale(18)) : isTablet ? Math.round(scale(30)) : isLargeTablet ? Math.round(scale(40)) : Math.round(scale(22));
              return (
                <ThemedText style={[styles.ctaText, { color: tokens.colors.text, fontSize: ctaSize, fontWeight: '800', lineHeight: Math.round(ctaSize * 1.05) }]}> 
                  Fă din pasiunea ta o sursă de venit!
                </ThemedText>
              );
            })()}
          </View>
        </View>

        {/* Popular announcements */}
        <View style={[styles.popularSection, { backgroundColor: tokens.colors.surface }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <ThemedText style={[styles.popularTitle, { color: tokens.colors.text }]}>Anunțuri populare</ThemedText>
            <TouchableOpacity onPress={() => router.push('/announcement-details?sort=popular') }>
              <Text style={{ color: tokens.colors.primary }}>Vezi tot</Text>
            </TouchableOpacity>
          </View>
          {popularLoading ? (
            <Text style={{ color: tokens.colors.muted }}>Se încarcă...</Text>
          ) : (
            (() => {
              const cols = screenWidth && screenWidth < 360 ? 1 : 2;
              const horizontalPadding = 32; // padding from container (16 + 16)
              const gap = 12; // marginRight between cards
              const cardWidth = Math.floor((Math.max(screenWidth || 360, 360) - horizontalPadding - (cols - 1) * gap) / cols);
              const listData = (() => {
                const arr = Array.isArray(popular) ? popular.slice(0) : [];
                if (cols > 1) {
                  const rem = arr.length % cols;
                  if (rem !== 0) {
                    const needed = cols - rem;
                    for (let i = 0; i < needed; i++) arr.push({ _id: `placeholder-show-all-${i}`, placeholder: true });
                  }
                }
                return arr;
              })();

              return (
                <FlatList
                  data={listData}
                  key={cols} // force re-render when cols change
                  numColumns={cols}
                  nestedScrollEnabled
                  scrollEnabled={false}
                  columnWrapperStyle={cols > 1 ? { justifyContent: 'flex-start' } : undefined}
                  contentContainerStyle={{ paddingVertical: 4 }}
                  keyExtractor={(it) => it._id}
                  renderItem={({ item, index }) => {
                    const isLastInRow = cols > 1 && ((index % cols) === (cols - 1));
                    // make the card border more subtle (like the 'cont' page): use themed border with low alpha
                    const subtleBorder = (() => {
                      try { return hexToRgba(tokens.colors.border || '#000000', 0.5); } catch { return tokens.colors.border; }
                    })();

                    const computedImageHeight = Math.max(120, Math.round(cardWidth * 0.55));

                    const itemStyle = [
                      styles.popularCard,
                      {
                        backgroundColor: tokens.colors.surface,
                        borderColor: subtleBorder,
                        width: cardWidth,
                        marginRight: isLastInRow ? 0 : gap,
                        marginBottom: 12,
                        // soften the card shadow a bit so the contour looks more muted
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.04,
                        shadowRadius: 6,
                        elevation: 2,
                      },
                    ];
                    // render placeholder card (fills empty slot) with a single informative text
                    if (item && item.placeholder) {
                      return (
                        <View style={itemStyle}>
                          <View style={styles.placeholderBox}>
                            <Text style={[styles.placeholderText, { color: tokens.colors.primary }]}>Afișați toate anunțurile</Text>
                          </View>
                        </View>
                      );
                    }

                    return (
                      <TouchableOpacity activeOpacity={0.9} style={itemStyle} onPress={() => router.push(`/announcement-details?id=${item._id}`)}>
                        <View style={[styles.popularImageWrap, { height: computedImageHeight }]}> 
                          <Image
                            source={{ uri: item.images && item.images[0] ? item.images[0] : undefined }}
                            style={[styles.popularImage, { height: '100%' }]}
                          />
                          {/* star button removed per request */}
                        </View>

                        <Text numberOfLines={2} style={[styles.popularLabel, { color: isDark ? '#c81553ff' : TITLE_BLUE }]}> 
                          {item.title || item.description || 'Anunț'}
                        </Text>

                        <View style={styles.popularMetaRow}>
                          {item.location ? (
                            <View
                              style={[
                                styles.metaPill,
                                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F2F4FF' },
                              ]}
                            >
                              <Text numberOfLines={1} style={[styles.metaPillText, { color: tokens.colors.muted }]}> 
                                {item.location}
                              </Text>
                            </View>
                          ) : null}
                          <View
                            style={[
                              styles.metaPill,
                              { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F2F4FF' },
                            ]}
                          >
                            <Text numberOfLines={1} style={[styles.metaPillText, { color: tokens.colors.muted }]}>
                              {item.createdAt
                                ? new Date(item.createdAt).toLocaleDateString('ro-RO', {
                                    day: '2-digit',
                                    month: 'long',
                                    year: 'numeric',
                                  })
                                : ''}
                            </Text>
                          </View>
                        </View>

                        {/* details button at bottom of card */}
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => router.push(`/announcement-details?id=${item._id}`)}
                          style={[
                            styles.detailsButton,
                            { backgroundColor: isDark ? '#f51866' : DESIGN_BLUE },
                          ]}
                        >
                          <Text style={[styles.detailsButtonText]}>Vezi detalii  ›</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  }}
                />
              );
            })()
          )}
        </View>

        <View style={[styles.categoriesSection, { backgroundColor: tokens.colors.surface }]}>
          <ThemedText style={[styles.categoriesTitle, { color: tokens.colors.text }]}>
            Explorează categorii
          </ThemedText>
          {(() => {
            const minCardWidth = 140;
            const gap = 12;
            const horizontalPadding = 32; // padding from section container (16 + 16)
            const avail = Math.max(screenWidth || 360, 320) - horizontalPadding;
            const tentative = Math.floor((avail + gap) / (minCardWidth + gap));
            const maxPossibleCols = Math.max(1, Math.min(tentative, 6));
            const minCols = (screenWidth || 0) >= 400 ? 3 : 1;

            // Build candidate cols range between minCols and maxPossibleCols
            const candidates: number[] = [];
            for (let c = minCols; c <= maxPossibleCols; c++) candidates.push(c);

            // Prefer the largest candidate that divides the total number of categories
            let cols = minCols;
            const totalItems = categories.length;
            if (candidates.length === 1) {
              cols = candidates[0];
            } else {
              const divisors = candidates.filter(c => totalItems % c === 0);
              if (divisors.length) {
                cols = Math.max(...divisors);
              } else {
                // If none divides evenly, pick candidate that minimizes leftover (tie -> larger cols)
                let best = candidates[0];
                let bestRem = totalItems % best;
                for (const c of candidates) {
                  const rem = totalItems % c;
                  if (rem < bestRem || (rem === bestRem && c > best)) { best = c; bestRem = rem; }
                }
                cols = best;
              }
            }

            const cardWidth = Math.floor((avail - (cols - 1) * gap) / cols);
            return (
              <View style={[styles.categoriesGrid, { gap }]}> 
                {categories.map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.7}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: tokens.colors.surface,
                        borderColor: tokens.colors.border,
                        width: cardWidth,
                      },
                    ]}
                    onPress={() => router.push(`/category-announcements?category=${encodeURIComponent(category.description)}`)}
                  >
                    {/* Gradient fade background overlay (theme-aware intensity) */}
                    <LinearGradient
                      colors={[
                        // Higher opacity in light mode, softer in dark mode
                        hexToRgba(category.color, isDark ? 0.18 : 0.35),
                        hexToRgba(category.color, isDark ? 0.08 : 0.15),
                        hexToRgba(category.color, 0),
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }, Platform.OS === 'web' ? { pointerEvents: 'none' } : undefined]}
                    />
                    <View style={[styles.imageContainer, { backgroundColor: 'transparent' }]}>
                      <Image 
                        source={category.image} 
                        style={styles.categoryImage}
                        resizeMode="contain"
                      />
                    </View>
                    <ThemedText style={[styles.categoryLabel, { color: tokens.colors.muted }]}>
                      {category.description}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })()}
        </View>

  {/* Legal Footer (hide 'Legal' section in Explore) */}
  <LegalFooter hideLegalSection />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Remove extra bottom spacing so the page ends right after the categories section
  scrollContent: { paddingBottom: 0 },
  mainContent: {
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  mainText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  mainImagePlaceholder: {
    width: '100%',
    maxWidth: 280,
    height: 300,
    borderRadius: 12,
    marginBottom: 24,
  },
  mainHeroImage: {
    width: '100%',
    height: '100%',
  },
  mainHeroWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 0,
  },
  callToAction: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  ctaText: {
    fontSize: 17,
    textAlign: 'center',
  },
  categoriesSection: {
    padding: 16,
    // No bottom margin: we want the page to end right after this section
    marginBottom: 0,
  },
  categoriesTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 100,
  },
  imageContainer: {
    height: 60,
    width: 60,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  categoryImage: {
    width: 50,
    height: 50,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  popularSection: {
    padding: 16,
    marginBottom: 12,
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  popularCard: {
    width: 140,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'visible',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 10,
    // dynamic height: allow the card to grow only as needed
    minHeight: 240,
    flexDirection: 'column',
    justifyContent: 'space-between',
    // cleaner elevation for card look
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  popularImageWrap: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#f2f2f2',
    // subtle shadow for the image (iOS) and elevation on Android
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  /* star button removed */
  popularImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#fafafa',
    resizeMode: 'cover' as any,
  },
  popularLabel: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
  },
  popularMetaText: {
    fontSize: 12,
    lineHeight: 16,
  },
  popularMetaRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaPillText: {
    fontSize: 11,
    lineHeight: 14,
  },
  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailsButton: {
    marginTop: 10,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  detailsButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});
