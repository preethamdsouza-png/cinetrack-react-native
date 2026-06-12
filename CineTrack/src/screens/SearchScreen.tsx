import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgLoader } from '../components/SvgLoader';
import movieService, { IMAGE_BASE_URL } from '../services/movieService';
import { Movie } from '../types/Movie';

const { width } = Dimensions.get('window');

const SearchScreen = ({ navigation }: any) => {

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);

  // Trigger search whenever the user types (with a minimal check)
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const searchData = await movieService.searchMovies(query);
        setResults(searchData);
      } catch (error) {
        console.error('Error during search:', error);
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce prevents hammering the API on every single keystroke

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. Header Layout */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      {/* 2. Styled Search Input Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search"
          placeholderTextColor="#67686D"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          autoCorrect={false}
        />
        <Text style={styles.searchBarIcon}>🔍</Text>
      </View>

      {/* 3. Results Section */}
      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#0296E5" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            query.trim().length > 1 ? (
              <View style={styles.noResultCol}>
                <SvgLoader name="noResults" width={76} height={76} />
                <Text style={styles.emptyTextTitle}>We are sorry, we can not find the movie!</Text>
                <Text style={styles.emptyTextSubtitle}>Find your movie by Type title, categories, years, etc </Text>
              </View>
            ) : (
              <Text style={styles.emptyText}>Find your favorite movies...</Text>
            )
          )}
          renderItem={({ item }) => {
            // Extract the release year from the string date "YYYY-MM-DD"
            const releaseYear = item.release_date ? item.release_date.split('-')[0] : 'N/A';
            const rating = item.vote_average ? item.vote_average.toFixed(1) : '0.0';

            return (
              <TouchableOpacity
                style={styles.movieCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Details', { movieId: item.id })}
              >
                {/* Left: Poster Image */}
                <Image
                  source={
                    item.poster_path
                      ? { uri: `${IMAGE_BASE_URL}${item.poster_path}` }
                      : { uri: 'https://via.placeholder.com/100x150/262738/FFFFFF?text=No+Image' }
                  }
                  style={styles.poster}
                />

                {/* Right: Movie Info Stack */}
                <View style={styles.infoContainer}>
                  <Text style={styles.movieTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  {/* Rating Line */}
                  <View style={styles.metaRow}>
                    <Text style={styles.starIcon}>⭐</Text>
                    <Text style={styles.ratingText}>{rating}</Text>
                  </View>

                  {/* Genre Line */}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaIcon}>🎟️</Text>
                    <Text style={styles.metaText}>Movie</Text>
                  </View>

                  {/* Year Line */}
                  <View style={styles.metaRow}>
                    <Text style={styles.metaIcon}>📅</Text>
                    <Text style={styles.metaText}>{releaseYear}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E2A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    height: 48,
    marginTop: 8,
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
  searchContainer: {
    backgroundColor: '#262738',
    height: 48,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  searchBarIcon: {
    fontSize: 16,
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  movieCard: {
    flexDirection: 'row',
    marginVertical: 12,
    alignItems: 'flex-start',
  },
  poster: {
    width: 100,
    height: 145,
    borderRadius: 16,
    backgroundColor: '#262738',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  noResultCol: {
    marginTop: 80,
    flexDirection: 'column',
    alignItems: 'center',
    marginVertical: 2,
  },
  starIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  ratingText: {
    color: '#FF8700',
    fontSize: 13,
    fontWeight: '600',
  },
  metaIcon: {
    fontSize: 13,
    color: '#67686D',
    marginRight: 6,
    width: 16,
    textAlign: 'center',
  },
  metaText: {
    color: '#67686D',
    fontSize: 13,
    fontWeight: '400',
  },
  emptyTextTitle: {
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 20,
  },
  emptyTextSubtitle: {
    color: '#67686D',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 15,
  },
  emptyText: {
    color: '#67686D',
    textAlign: 'center',
    marginTop: 80,
    fontSize: 15,
  },
});

export default SearchScreen;
