import { useEffect, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgLoader } from '../components/SvgLoader';
import { handleBookmarks } from '../hooks/handleBookmarks';
import movieService, { IMAGE_BASE_URL } from '../services/movieService';

const { width } = Dimensions.get('window');

const DetailScreen = ({ route, navigation }: any) => {
  const { movieId } = route.params
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('About Movie');
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);
  const [localBookmarked, setLocalBookmarked] = useState<boolean | null>(null);
  const { toggleBookmark, checkBookmarked } = handleBookmarks() 
  const persistedBookmarked = movie ? checkBookmarked(movie.id) : false;
  const isBookMarked = localBookmarked ?? persistedBookmarked;
  const bookmarkIconName = isBookMarked ? 'bookmarkSelected' : 'BookMarkUnSelected';
  const bookmarkIconColor = isBookMarked ? '#0296E5' : '#FFFFFF';


  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await movieService.getMovieDetails(movieId);
        setMovie(data);
      } catch (error) {
        console.error('Error fetching movie details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [movieId]);

  useEffect(() => {
    setLocalBookmarked(null);
  }, [movieId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0296E5" />
      </View>
    );
  }

  if (!movie) return navigation.goBack();

  const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '0.0';
  const genres = movie.genres && movie.genres.length > 0 ? movie.genres[0].name : 'N/A';
  const castList = movie.credits?.cast || []; // Grab the top 8 billing actors
  const reviewsList = movie.reviews?.results || []; // Grab top 5 reviews

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Global Navigation Top Row Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <SvgLoader name="arrowLeft" width={20} height={20} />
        </TouchableOpacity>
        <TouchableOpacity
           activeOpacity={0.7}
           disabled={isTogglingBookmark}
           onPress={async () => {
             if (!movie) return;
             const nextValue = !isBookMarked;
             setLocalBookmarked(nextValue);
             setIsTogglingBookmark(true);
             try {
               await toggleBookmark(movie);
             } catch (error) {
               console.error('Bookmark toggle failed:', error);
               setLocalBookmarked(null);
               Alert.alert('Bookmark Failed', 'Unable to update bookmark right now. Please try again.');
             } finally {
               setIsTogglingBookmark(false);
             }
       }}
>
  <SvgLoader name={bookmarkIconName} width={20} height={20} color={bookmarkIconColor} />
</TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* 2. Hero Section: Large Backdrop and Floating Rating Pill */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: `${IMAGE_BASE_URL}${movie.backdrop_path || movie.poster_path}` }}
            style={styles.backdrop}
          />
          <View style={styles.ratingBadge}>
            <Text style={styles.starIcon}>⭐</Text>
            <Text style={styles.ratingText}>{rating}</Text>
          </View>
        </View>

        {/* 3. Info Panel Layer with Overlapping Poster & Title */}
        <View style={styles.overlapSection}>
          <Image
            source={{ uri: `${IMAGE_BASE_URL}${movie.poster_path}` }}
            style={styles.overlappingPoster}
          />
          <Text style={styles.movieTitle} numberOfLines={2}>
            {movie.title}
          </Text>
        </View>

        {/* 4. Metadata Inline Row Layer */}
        <View style={styles.metadataRow}>
          <Text style={styles.metaItem}>📅 {releaseYear}</Text>
          <Text style={styles.divider}>|</Text>
          <Text style={styles.metaItem}>🕒 {movie.runtime || 0} Minutes</Text>
          <Text style={styles.divider}>|</Text>
          <Text style={styles.metaItem}>🎟️ {genres}</Text>
        </View>

        {/* 5. Sub-Navigation Tabs Row Segment layout */}
        <View style={styles.tabContainer}>
          {['About Movie', 'Reviews', 'Cast'].map((tab) => {
            const isSelected = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={styles.tabButton}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                  {tab}
                </Text>
                {isSelected && <View style={styles.activeLine} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 6. Dynamic Content Body Area */}
        <View style={styles.contentBody}>
          {activeTab === 'About Movie' && (
            <Text style={styles.overviewText}>{movie.overview || 'No overview available.'}</Text>
          )}
          {/* TAB 2: REVIEWS */}
          {activeTab === 'Reviews' && (
            <View>
              {reviewsList.length === 0 ? (
                <Text style={styles.fallbackText}>No reviews left for this movie yet.</Text>
              ) : (
                reviewsList.map((review: any) => (
                  <View key={review.id} style={styles.reviewCard}>
                    {/* Left Avatar Stack layout info */}
                    <View style={styles.reviewLeftColumn}>
                      {review.author_details?.avatar_path ? (
                        <Image
                          source={{ uri: `${IMAGE_BASE_URL}${review.author_details.avatar_path}` }}
                          style={styles.reviewAvatarImage}
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarLetter}>
                            {review.author ? review.author.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.reviewRatingValue}>
                        {review.author_details?.rating ? review.author_details.rating.toFixed(1) : rating}
                      </Text>
                    </View>
                    {/* Right text layout block info */}
                    <View style={styles.reviewRightColumn}>
                      <Text style={styles.reviewAuthorName}>{review.author}</Text>
                      <Text style={styles.reviewContentText} numberOfLines={5}>
                        {review.content}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
          {/* TAB 3: CAST (2-Column Circular Grid layout) */}
          {activeTab === 'Cast' && (
            <View style={styles.castGridContainer}>
              {castList.length === 0 ? (
                <Text style={styles.fallbackText}>No cast details found.</Text>
              ) : (
                castList.map((actor: any) => (
                  <View key={actor.id} style={styles.castMemberCard}>
                    {actor.profile_path ? (
                      <Image
                        source={{ uri: `${IMAGE_BASE_URL}${actor.profile_path}` }}
                        style={styles.castProfileImage}
                      />
                    ) : (
                      <View style={[styles.castProfileImage, styles.castAvatarPlaceholder]}>
                        <Text style={styles.castAvatarLetter}>
                          {actor.name ? actor.name.charAt(0).toUpperCase() : 'A'}
                        </Text>
                      </View>
                    )}
                    <Text style={styles.castActorName} numberOfLines={2}>
                      {actor.name}
                    </Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E2A',
  },
  center: {
    flex: 1,
    backgroundColor: '#1E1E2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    height: 48,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  headerIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroContainer: {
    width: width,
    height: 210,
    position: 'relative',
    marginTop: 16,
  },
  backdrop: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: 'rgba(30, 30, 42, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  starIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  ratingText: {
    color: '#FF8700',
    fontWeight: '600',
    fontSize: 13,
  },
  overlapSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    alignItems: 'flex-end',
    marginTop: -60, // Pulls section upward over the hero image
    zIndex: 10,
  },
  overlappingPoster: {
    width: 95,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#262738',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginLeft: 16,
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  metaItem: {
    color: '#67686D',
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    color: '#67686D',
    marginHorizontal: 12,
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 32,
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#262738',
  },
  tabButton: {
    marginRight: 28,
    paddingBottom: 10,
    position: 'relative',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 15,
    color: '#67686D',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeLine: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    width: '100%',
    backgroundColor: '#3A3F47',
    borderRadius: 2,
  },
  contentBody: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  overviewText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'left',
  },
  fallbackText: {
    color: '#67686D',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  /* --- REVIEWS STYLING RULES --- */
  reviewCard: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  reviewLeftColumn: {
    alignItems: 'center',
    marginRight: 14,
    width: 44,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3A3F47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewRatingValue: {
    color: '#0296E5',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  reviewRightColumn: {
    flex: 1,
  },
  reviewAuthorName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  reviewContentText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
  },
  /* --- CAST GRID STYLING RULES --- */
  castGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  castMemberCard: {
    width: (width - 80) / 2, // Even calculation for 2 columns with margin offsets
    alignItems: 'center',
    marginBottom: 24,
  },
  castProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50, // Perfect circular presentation matching design requirement
    backgroundColor: '#262738',
    marginBottom: 8,
  },
  castActorName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  castAvatarPlaceholder: {
    backgroundColor: '#3A3F47',
    justifyContent: 'center',
    alignItems: 'center',
  },
  castAvatarLetter: {
    color: '#FFFFFF',
    fontSize: 28,             // Larger text size for the prominent profile circle
    fontWeight: '600',
  },
  reviewAvatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22, // Keeps the user profile image perfectly circular
    backgroundColor: '#262738',
    resizeMode: 'cover',
  },
});

export default DetailScreen;