import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  Image,
  FlatList
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';

interface UserAnnouncement {
  _id: string;
  title: string;
  category: string;
  location: string;
  images?: string[];
  createdAt: string;
  views?: number;
  favoritesCount?: number;
  price?: number;
  currency?: string;
}

export default function UserAnnouncementsScreen() {
  const { tokens, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { user } = useAuth();
  const containerBorderStyle = { borderWidth: isDark ? 1 : 0, borderColor: tokens.colors.borderNeutral } as const;

  const [announcements, setAnnouncements] = useState<UserAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const targetUserId = userId || user?.id;

  useEffect(() => {
    fetchUserAnnouncements();
  }, [targetUserId]);

  const fetchUserAnnouncements = async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      
      // Fetch user info for name if we have a userId param (not own profile)
      if (userId) {
        try {
          const userRes = await api.get(`/api/users/profile/${encodeURIComponent(String(userId))}`);
          setUserName(`${userRes.data.firstName || ''} ${userRes.data.lastName || ''}`.trim() || 'Utilizator');
        } catch (e) {
          console.error('Error fetching user profile:', e);
          setUserName('Utilizator');
        }
      } else {
        setUserName('Anunțurile Mele');
      }
      
      // Fetch announcements
      const endpoint = userId 
          ? `/api/users/announcements/${encodeURIComponent(String(userId))}`
          : '/api/users/my-announcements';
          
      const res = await api.get(endpoint);
      setAnnouncements(res.data || []);
      
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get correct image URL
  const getImageSrc = (img?: string) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return img;
    if (img.startsWith('/uploads')) return `${base}${img}`;
    return `${base}/uploads/${img}`;
  };

  const renderAnnouncement = ({ item }: { item: UserAnnouncement }) => {
    const imageUri = item.images?.[0] ? getImageSrc(item.images[0]) : null;
    
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.borderNeutral }]}
        onPress={() => router.push(`/announcement-details?id=${item._id}`)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: imageUri || 'https://via.placeholder.com/300x200?text=No+Image' }}
          style={[styles.cardImage, { backgroundColor: tokens.colors.placeholderBg }]}
          resizeMode="cover"
        />

        <View style={[styles.cardContent, { borderLeftColor: tokens.colors.borderNeutral }]}> 
          <View style={styles.cardHeader}> 
            <ThemedText numberOfLines={2} style={[styles.cardTitle, { color: tokens.colors.text }]}> 
              {item.title}
            </ThemedText>
          </View>

          <View style={styles.cardFooter}> 
            <View style={styles.locationContainer}> 
              <Ionicons name="location-outline" size={14} color={tokens.colors.muted} />
              <ThemedText numberOfLines={1} style={[styles.cardLocation, { color: tokens.colors.muted, marginLeft: 6 }]}> 
                {item.location || 'Nedefinit'}
              </ThemedText>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: tokens.colors.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: tokens.colors.borderNeutral }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.borderNeutral }]}
        >
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ThemedText style={[styles.headerTitle, { color: tokens.colors.text }]}>
            {userId ? `Anunțurile lui ${userName}` : 'Anunțurile Mele'}
          </ThemedText>
          <ThemedText style={[styles.headerSubtitle, { color: tokens.colors.muted }]}>
            {announcements.length} anunțuri
          </ThemedText>
        </View>
      </View>


      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
        </View>
      ) : announcements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="albums-outline" size={64} color={tokens.colors.placeholder} />
          <ThemedText style={[styles.emptyText, { color: tokens.colors.muted }]}>
            Nu există anunțuri postate
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderAnnouncement}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    height: 100,
  },
  cardImage: {
    width: 120,
    height: '100%',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  cardContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    lineHeight: 20,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  cardLocation: {
    fontSize: 13,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
});