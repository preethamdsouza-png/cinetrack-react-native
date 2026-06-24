import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgLoader } from '../components/SvgLoader';
import { handleBookmarks } from '../hooks/handleBookmarks';
import { IMAGE_BASE_URL } from '../services/movieService';

export default function WatchlistScreen({ navigation }: any) {
  const { bookmarks, loading, refresh } = handleBookmarks();


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerBar}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
          style={styles.headerIconButton}
        >
          <SvgLoader name="arrowLeft" width={20} height={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Watch list</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#0296E5" />
        </View>
      ) : (
        <FlatList
          data={Array.isArray(bookmarks) ? bookmarks : []}
          keyExtractor={(item) => String(item.tmdb_id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerState}>
              <Text style={styles.emptyText}>No saved movies yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const releaseYear = item.release_date ? item.release_date.slice(0, 4) : 'N/A';
            const ratingText =
              typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A';
            const genreText = item.primary_genre ?? 'Unknown';
            const runtimeText =
              typeof item.runtime_minutes === 'number'
                ? `${item.runtime_minutes} minutes`
                : 'Runtime N/A';

            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.rowCard}
                onPress={() => navigation.navigate('Details', { movieId: item.tmdb_id })}
              >
                <Image
                  source={
                    item.poster_path
                      ? { uri: `${IMAGE_BASE_URL}${item.poster_path}` }
                      : undefined
                  }
                  style={styles.poster}
                />
                <View style={styles.infoColumn}>
                  <Text style={styles.movieTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.ratingStar}>★</Text>
                    <Text style={styles.ratingText}>{ratingText}</Text>
                  </View>
                  <Text style={styles.metaText}>🎟️ {genreText}</Text>
                  <Text style={styles.metaText}>📅 {releaseYear}</Text>
                  <Text style={styles.metaText}>🕒 {runtimeText}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#242A32',
  },
  headerBar: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 8,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ECECEC',
    fontSize: 16,
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 36,
    height: 36,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
  },
  rowCard: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  poster: {
    width: 95,
    height: 120,
    borderRadius: 16,
    backgroundColor: '#2A3039',
  },
  infoColumn: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingStar: {
    color: '#FF8700',
    fontSize: 13,
    marginRight: 4,
  },
  ratingText: {
    color: '#FF8700',
    fontSize: 12,
    fontWeight: '600',
  },
  metaText: {
    color: '#EEEEEE',
    fontSize: 12,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
