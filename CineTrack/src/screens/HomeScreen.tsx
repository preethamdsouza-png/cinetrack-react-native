import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image,TextInput,TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import movieService, { IMAGE_BASE_URL } from '../services/movieService';
import type { Movie } from '../types/Movie';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'now_playing', title: 'Now playing', fetch: movieService.getNowPlaying },
  { id: 'upcoming', title: 'Upcoming', fetch: movieService.getUpComing },
  { id: 'top_rated', title: 'Top rated', fetch: movieService.getTopRated },
  { id: 'popular', title: 'Popular', fetch: movieService.getPopular },
];



const HomeScreen = () => {
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);

  const [activeTab, setActiveTab] = useState('now_playing');
  const [gridMovies, setGridMovies] = useState<Movie[]>([]);
  const [loadingGrid, setLoadingGrid] = useState(true);

  // 1. Fetch Top Carousel Data once on mount
  useEffect(() => {
    const fetchTopSection = async () => {
      try {
        const data = await movieService.getTrendingToday(); // Using popular for the top row
        setTopMovies(data.slice(0, 5)); // Grab top 5 trending
      } catch (err) {
        console.error('Error fetching top section movies:', err);
      } finally {
        setLoadingTop(false);
      }
    };
    fetchTopSection();
  }, []);

  // 2. Fetch Grid Data dynamically every time activeTab changes
  useEffect(() => {
    const fetchGridSection = async () => {
      setLoadingGrid(true);
      try {
        const currentTabConfig = TABS.find((t) => t.id === activeTab);
        if (currentTabConfig) {
          const data = await currentTabConfig.fetch();
          setGridMovies(data);
        }
      } catch (err) {
        console.error(`Error fetching grid for tab ${activeTab}:`, err);
      } finally {
        setLoadingGrid(false);
      }
    };
    fetchGridSection();
  }, [activeTab]);

  // Sub-component: The Header elements stacked safely together
  const renderHeader = () => (
    <View>
      {/* App Headline */}
      <Text style={styles.headerTitle}>Trending Today!</Text>

      {/* Styled Search Bar */}
     {/*  <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search"
          placeholderTextColor="#67686D"
          style={styles.searchInput}
        />
        <Text style={styles.searchIcon}>🔍</Text>
      </View> */}

      {/* Top Trending Horizontal Row */}
      {loadingTop ? (
        <ActivityIndicator size="small" color="#0296E5" style={styles.rowLoader} />
      ) : (
        <FlatList
          data={topMovies}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `top-${item.id}`}
          contentContainerStyle={styles.horizontalListContent}
          renderItem={({ item, index }) => (
            <TouchableOpacity style={styles.topMovieContainer} activeOpacity={0.9}>
              {/* Giant background rank numbers styling */}
              <Text style={styles.rankNumber}>{index + 1}</Text>
              <Image
                source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
                style={styles.topMoviePoster}
              />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Category Horizontal Tab Bar */}
      <View style={styles.tabsWrapper}>
        <FlatList
          data={TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isActive = item.id === activeTab;
            return (
              <TouchableOpacity
                style={styles.tabItem}
                onPress={() => setActiveTab(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {item.title}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={loadingGrid ? [] : gridMovies} // Pass empty data while loading so loader shows down below
        keyExtractor={(item) => `grid-${item.id}`}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.mainScrollContent}
        
        // This acts as your dynamic loader zone below the tabs
        ListEmptyComponent={() => (
          loadingGrid ? (
            <View style={styles.gridLoaderContainer}>
              <ActivityIndicator size="large" color="#0296E5" />
            </View>
          ) : (
            <Text style={styles.emptyText}>No movies found.</Text>
          )
        )}
        
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.gridCard} activeOpacity={0.8}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
              style={styles.gridPoster}
            />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E2A',
  },
  mainScrollContent: {
    paddingBottom: 24,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 18,
    marginTop: 16,
    marginBottom: 20,
  },
  searchContainer: {
    backgroundColor: '#262738',
    height: 48,
    borderRadius: 16,
    marginHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
  },
  searchIcon: {
    fontSize: 16,
  },
  rowLoader: {
    marginVertical: 40,
  },
  horizontalListContent: {
    paddingLeft: 18,
    paddingRight: 32,
    paddingBottom: 16,
  },
  topMovieContainer: {
    width: width * 0.42,
    height: 210,
    marginRight: 28,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  topMoviePoster: {
    width: '85%',
    height: '100%',
    borderRadius: 16,
    alignSelf: 'flex-end',
  },
  rankNumber: {
    position: 'absolute',
    left: -12,
    bottom: -22,
    fontSize: 96,
    fontWeight: '900',
    color: '#1E1E2A',
    textShadowColor: '#0296E5',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    zIndex: 10,
  },
  tabsWrapper: {
    marginTop: 12,
    marginBottom: 18,
    paddingLeft: 18,
  },
  tabItem: {
    marginRight: 24,
    paddingVertical: 8,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    color: '#67686D',
    fontSize: 16,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 3,
    backgroundColor: '#0296E5',
    borderRadius: 2,
  },
  gridRow: {
    justifyContent: 'flex-start',
    paddingHorizontal: 14,
  },
  gridCard: {
    width: (width - 46) / 3, // Perfect equal 3-column division mathematically factoring padding
    height: 150,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#262738',
  },
  gridPoster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridLoaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#67686D',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
});

export default HomeScreen;
