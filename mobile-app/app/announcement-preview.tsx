import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';import { ThemedText } from '../components/themed-text';import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';

const { width } = Dimensions.get('window');

export default function AnnouncementPreviewScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { tokens, isDark } = useAppTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Parse preview data from params
  const title = params.title as string || '';
  const category = params.category as string || '';
  const description = params.description as string || '';
  const location = params.location as string || '';
  const contactPerson = params.contactPerson as string || '';
  const contactEmail = params.contactEmail as string || '';
  const contactPhone = params.contactPhone as string || '';
  const images = params.images ? JSON.parse(params.images as string) : [];

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showPhone, setShowPhone] = useState(false);

  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : contactPerson;

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header with back button */}
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: tokens.colors.bg, borderBottomColor: tokens.colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: tokens.colors.text }]}>Previzualizare anunț</ThemedText>
        <View style={styles.previewBadge}>
          <ThemedText style={styles.previewBadgeText}>PREVIEW</ThemedText>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        {images.length > 0 && (
          <View style={styles.imageCarouselContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / width);
                setActiveImageIndex(index);
              }}
            >
              {images.map((uri: string, index: number) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={[styles.carouselImage, { width }]}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View style={styles.pagination}>
                {images.map((_: any, index: number) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      {
                        backgroundColor: index === activeImageIndex ? tokens.colors.primary : 'rgba(255,255,255,0.5)',
                        width: index === activeImageIndex ? 24 : 8,
                      },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <View style={[styles.contentContainer, { backgroundColor: tokens.colors.bg }]}>
          {/* Title */}
          <ThemedText style={[styles.title, { color: tokens.colors.text }]}>{title}</ThemedText>

          {/* Category badge */}
          <View style={[styles.categoryBadge, { backgroundColor: isDark ? tokens.colors.elev : tokens.colors.surface }]}>
            <ThemedText style={[styles.categoryText, { color: tokens.colors.primary }]}>{category}</ThemedText>
          </View>

          {/* Description */}
          <View style={[styles.descriptionCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>Descriere</ThemedText>
            <ThemedText style={[styles.descriptionText, { color: tokens.colors.text }]}>{description}</ThemedText>
          </View>

          {/* Seller info */}
          <View style={[styles.sellerCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <View style={styles.sellerRow}>
              <View style={[styles.avatarCircle, { backgroundColor: tokens.colors.primary }]}>
                <ThemedText style={styles.avatarText}>
                  {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </ThemedText>
              </View>
              <View style={styles.sellerInfo}>
                <ThemedText style={[styles.sellerName, { color: tokens.colors.text }]}>{userName}</ThemedText>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFC107" />
                  <ThemedText style={[styles.ratingText, { color: tokens.colors.muted }]}>Fără evaluări</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Contact info */}
          <View style={[styles.contactCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <ThemedText style={[styles.contactLabel, { color: tokens.colors.muted }]}>Persoană de contact:</ThemedText>
            <ThemedText style={[styles.contactValue, { color: tokens.colors.text }]}>{contactPerson}</ThemedText>

            {/* Phone */}
            {contactPhone && (
              <View style={[styles.phoneCard, { backgroundColor: tokens.colors.elev, borderColor: tokens.colors.border }]}>
                <Ionicons name="call-outline" size={20} color={tokens.colors.primary} style={{ marginRight: 10 }} />
                <ThemedText style={[styles.phoneValue, { color: tokens.colors.text }]}>
                  {showPhone ? contactPhone : 'xxx xxx xxx'}
                </ThemedText>
                <TouchableOpacity onPress={() => setShowPhone(!showPhone)} activeOpacity={0.8}>
                  <ThemedText style={[styles.showPhoneLink, { color: tokens.colors.primary }]}>
                    {showPhone ? 'ASCUNDE' : 'ARATĂ'}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}

            {/* Email */}
            {contactEmail && (
              <View style={[styles.emailRow, { borderTopColor: tokens.colors.border }]}>
                <Ionicons name="mail-outline" size={18} color={tokens.colors.muted} />
                <ThemedText style={[styles.emailText, { color: tokens.colors.text }]}>{contactEmail}</ThemedText>
              </View>
            )}
          </View>

          {/* Location */}
          <View style={[styles.locationCard, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <ThemedText style={[styles.locationHeading, { color: tokens.colors.text }]}>Locație</ThemedText>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color={tokens.colors.primary} />
              <ThemedText style={[styles.locationText, { color: tokens.colors.text }]}>{location}</ThemedText>
            </View>
          </View>

          {/* Preview notice */}
          <View style={[styles.previewNotice, { backgroundColor: isDark ? 'rgba(245, 24, 102, 0.1)' : '#FFF3E0', borderColor: tokens.colors.primary }]}>
            <Ionicons name="information-circle-outline" size={20} color={tokens.colors.primary} style={{ marginRight: 8 }} />
            <ThemedText style={[styles.previewNoticeText, { color: tokens.colors.text }]}>
              Acesta este doar un preview. Anunțul nu a fost încă publicat.
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  previewBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  imageCarouselContainer: {
    position: 'relative',
  },
  carouselImage: {
    height: 280,
    backgroundColor: '#f0f0f0',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    lineHeight: 32,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  descriptionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  sellerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
  },
  contactCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  contactLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  phoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  phoneValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  showPhoneLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  emailText: {
    fontSize: 14,
  },
  locationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  locationHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  previewNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  previewNoticeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});