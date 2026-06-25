import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
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
import {
  getAllBookmarks,
  type BookmarkRow,
} from '../db/bookmarkDB';
import { IMAGE_BASE_URL } from '../services/movieService';

export default function WatchlistScreen({ navigation }: any) {
  const db = useSQLiteContext();
  const [bookmarks, setBookmarks] = useState<BookmarkRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAllBookmarks(db);
      setBookmarks(rows ?? []);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
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
               <SvgLoader name="emptyWatchlist" width={63} height={76}/>
               <Text style={styles.emptyTextTitle}>There is no movie yet!</Text>
               <Text style={styles.emptyTextSubTitle}>Find your movie by Type title, categories, years, etc </Text>
            </View>
          }
          renderItem={({ item }) => {
             if (!item) return null;
            const releaseYear = item.release_date?.slice(0, 4) ?? 'N/A';
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
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPlaceholder: {
    width: 36,
    height: 36,
  },
  listContent: {
    flexGrow: 1,
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
  emptyTextTitle: {
     marginTop: 10,
     paddingHorizontal:10,
     color: '#FFFFFF',
    fontSize: 16,
  },
  emptyTextSubTitle: {
    marginTop: 8,
    paddingHorizontal:10,
    color: '#AAAAAA',
    fontSize: 14,
  }
});
