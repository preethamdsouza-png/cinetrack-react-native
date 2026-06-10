import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet } from 'react-native';
import movieService, { IMAGE_BASE_URL } from '../services/movieService';
import type { Movie } from '../types/Movie';
import { SafeAreaView } from 'react-native-safe-area-context';
const HomeScreen = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadMovies = async () => {
      try {
        // Easily swap this with movieService.getPopular() or getUpcoming() based on selected tab!
        const data = await movieService.getNowPlaying();
        console.log("✅ API Success! Total movies fetched:", data);
        setMovies(data);
      } catch (error) {
        // Error logging handled by service layer, user fallback can go here
        console.error("❌ HomeScreen API Fetch Failed!");
        console.error("Error Message:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0296E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>What do you want to watch?</Text>
      <FlatList
        data={movies}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image
              source={{ uri: `${IMAGE_BASE_URL}${item.poster_path}` }}
              style={styles.poster}
            />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1E1E2A', paddingHorizontal: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1E2A' },
  title: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginVertical: 20 },
  row: { justifyContent: 'space-between', marginBottom: 16 },
  card: { width: '30%' },
  poster: { width: '100%', height: 160, borderRadius: 12 }
});

export default HomeScreen;
