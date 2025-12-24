import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  StyleSheet,
  Image,
  Alert 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../components/themed-text';
import { useAppTheme } from '../src/context/ThemeContext';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';

interface UserReview {
  _id: string;
  score: number;
  comment: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  likes?: any[];
  unlikes?: any[];
  likesCount?: number;
  unlikesCount?: number;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function AllReviewsScreen() {
  const { tokens, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { user } = useAuth();
  const containerBorderStyle = { borderWidth: isDark ? 1 : 0, borderColor: tokens.colors.borderNeutral } as const;

  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewLikeState, setReviewLikeState] = useState<Record<string, { liked: boolean; unliked: boolean; locked?: boolean }>>({});
  const [userName, setUserName] = useState('');

  const targetUserId = userId || user?.id;

  useEffect(() => {
    fetchAllReviews();
  }, [targetUserId]);

  const fetchAllReviews = async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      
      // Fetch user info for name
      const userRes = await api.get(`/api/users/profile/${encodeURIComponent(String(targetUserId))}`);
      setUserName(`${userRes.data.firstName || ''} ${userRes.data.lastName || ''}`.trim() || 'Utilizator');
      
      // Fetch all reviews
      const reviewsRes = await api.get(`/api/reviews/${encodeURIComponent(String(targetUserId))}`);
      const reviewsArray = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
      
      // Map reviews and calculate like counts from arrays
      const reviewsWithCounts = reviewsArray.map((r: any) => ({
        ...r,
        likesCount: Array.isArray(r.likes) ? r.likes.length : 0,
        unlikesCount: Array.isArray(r.unlikes) ? r.unlikes.length : 0,
      }));
      
      setReviews(reviewsWithCounts);

      // Calculate stats from reviews array
      if (reviewsWithCounts.length > 0) {
        const totalReviews = reviewsWithCounts.length;
        const totalScore = reviewsWithCounts.reduce((sum: number, r: any) => sum + (r.score || 0), 0);
        const averageRating = totalScore / totalReviews;
        
        // Calculate distribution
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewsWithCounts.forEach((r: any) => {
          const score = Math.round(r.score || 0);
          if (score >= 1 && score <= 5) {
            distribution[score as keyof typeof distribution]++;
          }
        });
        
        setReviewStats({
          averageRating,
          totalReviews,
          distribution
        });
      } else {
        setReviewStats(null);
      }

      // Initialize like state
      const initialState: Record<string, { liked: boolean; unliked: boolean }> = {};
      reviewsWithCounts.forEach((rev: any) => {
        const myId = user?.id;
        initialState[rev._id] = {
          liked: myId ? (rev.likes || []).some((id: any) => String(id) === String(myId)) : false,
          unliked: myId ? (rev.unlikes || []).some((id: any) => String(id) === String(myId)) : false,
        };
      });
      setReviewLikeState(initialState);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Alert.alert('Eroare', 'Nu s-au putut încărca evaluările');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reviewId: string) => {
    if (!user?.id) {
      Alert.alert('Autentificare necesară', 'Trebuie să fii autentificat pentru a aprecia.');
      return;
    }

    const current = reviewLikeState[reviewId];
    if (current?.locked) return;

    const wasLiked = current?.liked || false;
    const wasUnliked = current?.unliked || false;

    setReviewLikeState(prev => ({
      ...prev,
      [reviewId]: { liked: !wasLiked, unliked: false, locked: true }
    }));

    try {
      await api.post(`/api/reviews/${reviewId}/like`);
      
      setReviews(prev => prev.map(rev => {
        if (rev._id !== reviewId) return rev;
        const newLikesCount = wasLiked 
          ? (rev.likesCount || 0) - 1 
          : (rev.likesCount || 0) + 1;
        const newUnlikesCount = wasUnliked 
          ? (rev.unlikesCount || 0) - 1 
          : (rev.unlikesCount || 0);
        return {
          ...rev,
          likesCount: newLikesCount,
          unlikesCount: newUnlikesCount,
        };
      }));

      setReviewLikeState(prev => ({
        ...prev,
        [reviewId]: { liked: !wasLiked, unliked: false, locked: false }
      }));
    } catch (error) {
      console.error('Error liking review:', error);
      setReviewLikeState(prev => ({
        ...prev,
        [reviewId]: { liked: wasLiked, unliked: wasUnliked, locked: false }
      }));
    }
  };

  const handleUnlike = async (reviewId: string) => {
    if (!user?.id) {
      Alert.alert('Autentificare necesară', 'Trebuie să fii autentificat pentru a dezaprecia.');
      return;
    }

    const current = reviewLikeState[reviewId];
    if (current?.locked) return;

    const wasLiked = current?.liked || false;
    const wasUnliked = current?.unliked || false;

    setReviewLikeState(prev => ({
      ...prev,
      [reviewId]: { liked: false, unliked: !wasUnliked, locked: true }
    }));

    try {
      await api.post(`/api/reviews/${reviewId}/unlike`);
      
      setReviews(prev => prev.map(rev => {
        if (rev._id !== reviewId) return rev;
        const newUnlikesCount = wasUnliked 
          ? (rev.unlikesCount || 0) - 1 
          : (rev.unlikesCount || 0) + 1;
        const newLikesCount = wasLiked 
          ? (rev.likesCount || 0) - 1 
          : (rev.likesCount || 0);
        return {
          ...rev,
          unlikesCount: newUnlikesCount,
          likesCount: newLikesCount,
        };
      }));

      setReviewLikeState(prev => ({
        ...prev,
        [reviewId]: { liked: false, unliked: !wasUnliked, locked: false }
      }));
    } catch (error) {
      console.error('Error unliking review:', error);
      setReviewLikeState(prev => ({
        ...prev,
        [reviewId]: { liked: wasLiked, unliked: wasUnliked, locked: false }
      }));
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color={star <= rating ? tokens.colors.rating : tokens.colors.muted}
          />
        ))}
      </View>
    );
  };

  const getImageSrc = (avatar?: string) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    const base = String(api.defaults.baseURL || '').replace(/\/$/, '');
    if (!base) return avatar;
    if (avatar.startsWith('/uploads')) return `${base}${avatar}`;
    if (avatar.startsWith('uploads/')) return `${base}/${avatar}`;
    return `${base}/uploads/${avatar.replace(/^.*[\\\\/]/, '')}`;
  };

  const getAuthorId = (r: any) => {
    if (!r) return null;
    if (r.author) {
      if (typeof r.author === 'string') return String(r.author);
      if (typeof r.author === 'object') return r.author._id || r.author.id || null;
    }
    if (r.authorId) return String(r.authorId);
    if (r.user) return String(r.user);
    return null;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: tokens.colors.bg }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top, backgroundColor: tokens.colors.bg, borderBottomColor: tokens.colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
            <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: tokens.colors.text }]}>Toate evaluările</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <ThemedText style={[styles.loadingText, { color: tokens.colors.muted }]}>Se încarcă evaluările...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: tokens.colors.bg, borderBottomColor: tokens.colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: tokens.colors.surface, borderColor: tokens.colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={tokens.colors.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: tokens.colors.text }]}>Evaluările lui {userName}</ThemedText>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Stats Summary Card */}
        {reviewStats && (
          <View style={[styles.statsCard, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}>
            <View style={styles.statsHeader}>
              <View style={styles.ratingBox}>
                <ThemedText style={[styles.ratingNumber, { color: tokens.colors.text }]}>
                  {reviewStats.averageRating.toFixed(1)}
                </ThemedText>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <Ionicons
                      key={star}
                      name={star <= Math.round(reviewStats.averageRating) ? 'star' : 'star-outline'}
                      size={20}
                      color={star <= Math.round(reviewStats.averageRating) ? tokens.colors.rating : tokens.colors.muted}
                    />
                  ))}
                </View>
                <ThemedText style={[styles.totalReviews, { color: tokens.colors.muted }]}>
                  {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'evaluare' : 'evaluări'}
                </ThemedText>
              </View>

              <View style={styles.distributionBars}>
                {[5, 4, 3, 2, 1].map(star => {
                  const count = reviewStats.distribution[star as keyof typeof reviewStats.distribution] || 0;
                  const percentage = reviewStats.totalReviews > 0 ? (count / reviewStats.totalReviews) * 100 : 0;
                  const isEmpty = count === 0;
                  // Choose a lighter grey for empty rows in light mode, keep borderNeutral in dark mode
                  const emptyColor = isEmpty ? (isDark ? tokens.colors.borderNeutral : '#d1d5db') : null;
                  return (
                    <View key={star} style={styles.barRow}>
                      <ThemedText style={[styles.starLabel, { color: isEmpty ? emptyColor : tokens.colors.text }]}>{star}</ThemedText>
                      <Ionicons name="star" size={14} color={isEmpty ? emptyColor : tokens.colors.rating} />
                      <View style={[styles.barTrack, { backgroundColor: isEmpty ? emptyColor : tokens.colors.elev }]}>
                        <View 
                          style={[
                            styles.barFill, 
                            { 
                              backgroundColor: isEmpty ? emptyColor : tokens.colors.primary, 
                              width: `${percentage}%` 
                            }
                          ]} 
                        />
                      </View>
                      <ThemedText style={[styles.countLabel, { color: isEmpty ? emptyColor : tokens.colors.muted }]}>{count}</ThemedText>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* All Reviews List */}
        <View style={[styles.reviewsCard, { backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface, ...containerBorderStyle }]}>
          <ThemedText style={[styles.sectionTitle, { color: tokens.colors.text }]}>
            Toate comentariile ({reviews.length})
          </ThemedText>

          {reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="chatbubbles-outline" size={64} color={tokens.colors.placeholder} />
              <ThemedText style={[styles.emptyText, { color: tokens.colors.muted }]}>
                Nu există evaluări încă
              </ThemedText>
            </View>
          ) : (
            reviews.map((review) => {
              const avatarUri = getImageSrc(review.authorAvatar);
              const likeState = reviewLikeState[review._id] || { liked: false, unliked: false };
              
              const authorId = getAuthorId(review);
              return (
                <View key={review._id} style={[styles.reviewCard, { borderColor: tokens.colors.borderNeutral, backgroundColor: isDark ? tokens.colors.darkModeContainer : tokens.colors.surface }]}> 
                  <View style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                          if (authorId) {
                            try { router.push(`/profile?userId=${encodeURIComponent(String(authorId))}`); } catch (e) { /* ignore */ }
                          }
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        {avatarUri ? (
                          <Image source={{ uri: avatarUri }} style={styles.reviewerAvatar} />
                        ) : (
                          <View style={[styles.reviewerAvatarPlaceholder, { backgroundColor: tokens.colors.elev }]}> 
                            <Ionicons name="person" size={20} color={tokens.colors.muted} />
                          </View>
                        )}
                        <View style={styles.reviewerInfo}>
                          <ThemedText style={[styles.reviewerName, { color: tokens.colors.text }]}> 
                            {review.authorName}
                          </ThemedText>
                          <View style={styles.ratingRow}>
                            {renderStars(review.score)}
                            <ThemedText style={[styles.reviewDate, { color: tokens.colors.muted }]}> 
                              {new Date(review.createdAt).toLocaleDateString('ro-RO')}
                            </ThemedText>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </View>

                    <ThemedText style={[styles.reviewComment, { color: tokens.colors.text }]}> 
                      {review.comment}
                    </ThemedText>

                    <View style={styles.reviewFooter}>
                      <View style={styles.reviewActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleLike(review._id)}
                          disabled={likeState.locked}
                        >
                          <Ionicons
                            name={likeState.liked ? 'thumbs-up' : 'thumbs-up-outline'}
                            size={18}
                            color={likeState.liked ? tokens.colors.success : tokens.colors.muted}
                          />
                          <ThemedText style={[styles.actionText, { color: likeState.liked ? tokens.colors.success : tokens.colors.muted }]}> 
                            {review.likesCount || 0}
                          </ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleUnlike(review._id)}
                          disabled={likeState.locked}
                        >
                          <Ionicons
                            name={likeState.unliked ? 'thumbs-down' : 'thumbs-down-outline'}
                            size={18}
                            color={likeState.unliked ? '#dc3545' : tokens.colors.muted}
                          />
                          <ThemedText style={[styles.actionText, { color: likeState.unliked ? '#dc3545' : tokens.colors.muted }]}> 
                            {review.unlikesCount || 0}
                          </ThemedText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
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
    paddingVertical: 12,
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
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    fontFamily: 'Poppins-Bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  statsHeader: {
    gap: 20,
  },
  ratingBox: {
    alignItems: 'center',
    gap: 8,
  },
  ratingNumber: {
    fontSize: 48,
    fontWeight: '700',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  totalReviews: {
    fontSize: 14,
  },
  distributionBars: {
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starLabel: {
    fontSize: 14,
    fontWeight: '600',
    width: 12,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  countLabel: {
    fontSize: 12,
    width: 30,
    textAlign: 'right',
  },
  reviewsCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
  },
  reviewItem: {
    paddingBottom: 16,
    gap: 12,
  },
  reviewCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  reviewerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInfo: {
    flex: 1,
    gap: 4,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewDate: {
    fontSize: 12,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  reviewFooter: {
    marginTop: 12,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});