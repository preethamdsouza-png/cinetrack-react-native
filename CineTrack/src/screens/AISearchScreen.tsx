import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGemma } from '../llm/GemmaProvider';
import movieService, { IMAGE_BASE_URL } from '../services/movieService';
import type { Movie } from '../types/Movie';

type SearchState = 'idle' | 'extracting' | 'fetching' | 'summarizing' | 'complete' | 'error';

type ExtractedFilters = {
  tmdbKeywords: string;
  vibeBadges: string[];
  maxRuntimeMinutes: number | null;
};

type VibePill = {
  id: string;
  label: string;
  active: boolean;
};

const PASS_1_SYSTEM_PROMPT = (query: string): string => `<user>
Analyze this search query from a user looking for a movie on an OTT app: "${query}"

Extract SIMPLE, GENERIC search keywords that will find movies in a database. Use common movie terms.

Return ONLY valid JSON with this exact shape:
{
  "tmdbKeywords": "1-3 simple genre or theme words separated by spaces (no commas)",
  "vibeBadges": ["mood1", "mood2", "mood3"],
  "maxRuntimeMinutes": number or null
}

GOOD tmdbKeywords examples:
- "thriller detective" 
- "romantic comedy"
- "action adventure"
- "horror mystery"
- "drama family"

BAD tmdbKeywords examples (too specific):
- "1990s urban setting rainy" 
- "slow paced character study"
- "nonlinear narrative"

Extract the GENRE and THEME, not the setting or style.
Do not write markdown backticks. Return only the raw JSON.
<assistant>`;

const PASS_2_SYSTEM_PROMPT = (query: string, candidateSummary: string): string => `<user>
The user asked for: "${query}".
Review these database candidate matches and summarize why they fit the user's specific mood. 
Candidates:
${candidateSummary}

Write a concise, enthusiastic, 2-3 sentence overview addressed directly to the viewer explaining how these selections perfectly bridge their request. Do not mention IDs or system variables.
<assistant>`;

const extractJsonObject = (text: string): string | null => {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonBlockMatch?.[1]) {
    return jsonBlockMatch[1].trim();
  }

  const curlyBraceMatch = text.match(/\{[\s\S]*\}/);
  if (curlyBraceMatch?.[0]) {
    return curlyBraceMatch[0];
  }

  return null;
};

const cleanKeywords = (keywords: string): string => {
  return keywords
    .replace(/,/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .slice(0, 4)
    .join(' ');
};

export default function AISearchScreen({ navigation }: any) {
  const { llm, isReady, isInitializing, initError, ensureLoaded } = useGemma();

  const [queryText, setQueryText] = useState('');
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [vibePills, setVibePills] = useState<VibePill[]>([]);
  const [activeBadges, setActiveBadges] = useState<string[]>([]);

  const [movieResults, setMovieResults] = useState<Movie[]>([]);
  const [gemmaReview, setGemmaReview] = useState('');

  const extractedFiltersRef = useRef<ExtractedFilters | null>(null);
  const abortRef = useRef(false);

  const resetSearch = useCallback(() => {
    setSearchState('idle');
    setErrorMessage(null);
    setVibePills([]);
    setActiveBadges([]);
    setMovieResults([]);
    setGemmaReview('');
    extractedFiltersRef.current = null;
    abortRef.current = false;
  }, []);

  const executePass1 = useCallback(
    async (query: string): Promise<ExtractedFilters | null> => {
      try {
        console.log('🤖 Calling Gemma with Pass 1 prompt...');
        const prompt = PASS_1_SYSTEM_PROMPT(query);
        
        let rawResponse: string;
        try {
          rawResponse = await llm.sendMessage(prompt);
          console.log('🤖 Gemma Raw Response:', rawResponse);
        } catch (modelError) {
          console.error('❌ Gemma sendMessage failed:', modelError);
          throw new Error(`AI model error: ${modelError instanceof Error ? modelError.message : 'Model inference failed'}. The model may need to be reloaded or is incompatible.`);
        }

        const cleanedJson = extractJsonObject(rawResponse);
        if (!cleanedJson) {
          throw new Error('Failed to extract JSON from Gemma response.');
        }
        console.log('📋 Extracted JSON:', cleanedJson);

        const parsed = JSON.parse(cleanedJson) as ExtractedFilters;
        console.log('🔧 Parsed Filters (before cleaning):', parsed);

        if (!parsed.tmdbKeywords || !Array.isArray(parsed.vibeBadges)) {
          throw new Error('Invalid JSON structure from Gemma.');
        }

        const originalKeywords = parsed.tmdbKeywords;
        parsed.tmdbKeywords = cleanKeywords(parsed.tmdbKeywords);
        console.log(`✨ Keywords cleaned: "${originalKeywords}" → "${parsed.tmdbKeywords}"`);

        return parsed;
      } catch (error) {
        console.error('❌ Pass 1 Error:', error);
        throw error;
      }
    },
    [llm]
  );

  const fetchMoviesFromTMDB = useCallback(
    async (keywords: string, runtimeLimit: number | null): Promise<Movie[]> => {
      try {
        if (!keywords || keywords.trim().length === 0) {
          console.log('⚠️ Empty keywords provided, using fallback: "action"');
          keywords = 'action';
        }

        const cleanedKeywords = cleanKeywords(keywords);
        console.log('🔍 Fetching from TMDB Discover API with keywords:', cleanedKeywords);

        let allResults = await movieService.discoverMovies(cleanedKeywords, 1);
        console.log(`📊 Discover API returned ${allResults.length} results for "${cleanedKeywords}"`);

        if (allResults.length === 0) {
          console.log('⚠️ No results from Discover, falling back to popular movies...');
          allResults = await movieService.getPopular();
          console.log(`📊 Fallback returned ${allResults.length} popular movies`);
        }

        let filtered = allResults;
        if (runtimeLimit !== null && runtimeLimit > 0) {
          filtered = allResults.filter((movie) => {
            return true;
          });
        }

        return filtered.slice(0, 5);
      } catch (error) {
        console.error('❌ TMDB Fetch Error:', error);
        throw new Error(`TMDB Fetch Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    []
  );

  const executePass2 = useCallback(
    async (query: string, movies: Movie[]): Promise<string> => {
      try {
        const candidateSummary = movies
          .map(
            (movie, idx) =>
              `${idx + 1}. "${movie.title}" (${movie.release_date?.slice(0, 4) ?? 'N/A'}): ${movie.overview}`
          )
          .join('\n');

        const prompt = PASS_2_SYSTEM_PROMPT(query, candidateSummary);
        const rawResponse = await llm.sendMessage(prompt);

        return rawResponse.trim();
      } catch (error) {
        throw new Error(`Pass 2 Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [llm]
  );

  const testDirectSearch = useCallback(async () => {
    console.log('🧪 Testing direct TMDB Discover API...');
    resetSearch();
    setSearchState('fetching');
    
    try {
      const testKeywords = 'action thriller';
      console.log('🧪 Testing with keywords:', testKeywords);
      const movies = await movieService.discoverMovies(testKeywords, 1);
      console.log('🧪 Discover API returned:', movies.length, 'movies');
      
      if (movies.length > 0) {
        setMovieResults(movies.slice(0, 3));
        setGemmaReview(`✅ Test successful! Discover API is working. Found ${movies.length} movies with genres: action + thriller. This test bypassed the AI model to verify TMDB connectivity.`);
        setSearchState('complete');
        
        const testPills: VibePill[] = [
          { id: 'action-test', label: 'Action', active: true },
          { id: 'thriller-test', label: 'Thriller', active: true },
        ];
        setVibePills(testPills);
      } else {
        setErrorMessage('Discover API returned 0 results. This might indicate an API key or network issue.');
        setSearchState('error');
      }
    } catch (error) {
      console.error('🧪 Discover API test failed:', error);
      setErrorMessage(`Discover API test failed: ${error instanceof Error ? error.message : 'Unknown'}`);
      setSearchState('error');
    }
  }, [resetSearch]);

  const extractBasicGenres = async (query: string): Promise<string[]> => {
    const lowerQuery = query.toLowerCase();
    const foundGenres: string[] = [];
    
    try {
      const allGenres = await movieService.getGenres();
      
      for (const genre of allGenres) {
        const genreName = genre.name.toLowerCase();
        if (lowerQuery.includes(genreName)) {
          foundGenres.push(genreName);
        }
      }
    } catch (error) {
      console.error('Failed to fetch genres for fallback search:', error);
    }
    
    return foundGenres;
  };

  const simpleFallbackSearch = useCallback(async (query: string) => {
    console.log('🔄 Using simple fallback search (no AI)...');
    
    const detectedGenres = await extractBasicGenres(query);
    const searchKeywords = detectedGenres.length > 0 
      ? detectedGenres.join(' ') 
      : query.split(' ').slice(0, 3).join(' ');
    
    console.log('🔍 Fallback detected genres:', detectedGenres);
    console.log('🔍 Fallback search keywords:', searchKeywords);
    
    const pills: VibePill[] = detectedGenres.length > 0
      ? detectedGenres.map((genre, idx) => ({
          id: `genre-${idx}`,
          label: genre.charAt(0).toUpperCase() + genre.slice(1),
          active: true,
        }))
      : [{ id: 'search-1', label: 'Search', active: true }];
    
    setVibePills(pills);
    setActiveBadges(detectedGenres.length > 0 ? detectedGenres : ['Search']);
    
    setSearchState('fetching');
    const movies = await fetchMoviesFromTMDB(searchKeywords, null);
    
    setMovieResults(movies);
    
    if (movies.length > 0) {
      const genreText = detectedGenres.length > 0 
        ? ` matching "${detectedGenres.join(', ')}"` 
        : '';
      const fallbackMessage = `Found ${movies.length} popular movies${genreText}! The AI model is currently unavailable, so we're showing top-rated genre-based results from the TMDB database. These movies match your search criteria.`;
      console.log('📝 Setting fallback review:', fallbackMessage);
      setGemmaReview(fallbackMessage);
    } else {
      setGemmaReview('No movies found with those criteria. The AI model is currently unavailable. Try using genre keywords from the database.');
    }
    
    setSearchState('complete');
  }, [fetchMoviesFromTMDB]);

  const performFullSearch = useCallback(async () => {
    if (!queryText.trim()) {
      setErrorMessage('Please enter a search query.');
      return;
    }

    resetSearch();
    abortRef.current = false;
    Keyboard.dismiss();

    const loaded = await ensureLoaded();
    if (!loaded) {
      console.log('⚠️ Gemma model not available, using fallback search...');
      try {
        await simpleFallbackSearch(queryText.trim());
      } catch (error) {
        setSearchState('error');
        setErrorMessage('Both AI and fallback search failed. Please check your connection.');
      }
      return;
    }

    try {
      setSearchState('extracting');
      const filters = await executePass1(queryText.trim());
      if (abortRef.current) return;

      if (!filters) {
        throw new Error('Failed to extract filters from Gemma.');
      }

      extractedFiltersRef.current = filters;

      const pills: VibePill[] = filters.vibeBadges.map((badge, idx) => ({
        id: `${badge}-${idx}`,
        label: badge,
        active: true,
      }));
      setVibePills(pills);
      setActiveBadges(filters.vibeBadges);

      setSearchState('fetching');
      const movies = await fetchMoviesFromTMDB(filters.tmdbKeywords, filters.maxRuntimeMinutes);
      if (abortRef.current) return;

      setMovieResults(movies);

      if (movies.length === 0) {
        setSearchState('complete');
        setGemmaReview('No matching movies found. Try a different query.');
        return;
      }

      setSearchState('summarizing');
      const review = await executePass2(queryText.trim(), movies);
      if (abortRef.current) return;

      setGemmaReview(review);
      setSearchState('complete');
    } catch (error) {
      if (!abortRef.current) {
        console.error('❌ AI search failed, attempting fallback...', error);
        try {
          await simpleFallbackSearch(queryText.trim());
        } catch (fallbackError) {
          setSearchState('error');
          setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
        }
      }
    }
  }, [queryText, ensureLoaded, resetSearch, executePass1, fetchMoviesFromTMDB, executePass2, simpleFallbackSearch]);

  const handlePillToggle = useCallback(
    async (pillId: string) => {
      const pill = vibePills.find((p) => p.id === pillId);
      if (!pill || !extractedFiltersRef.current) return;

      const newPills = vibePills.map((p) => (p.id === pillId ? { ...p, active: !p.active } : p));
      setVibePills(newPills);

      const newActiveBadges = newPills.filter((p) => p.active).map((p) => p.label);
      setActiveBadges(newActiveBadges);

      if (newActiveBadges.length === 0) {
        setMovieResults([]);
        setGemmaReview('No active vibe badges selected. Toggle some to refine results.');
        return;
      }

      try {
        setSearchState('fetching');

        const filters = extractedFiltersRef.current;
        const movies = await fetchMoviesFromTMDB(filters.tmdbKeywords, filters.maxRuntimeMinutes);

        setMovieResults(movies);

        if (movies.length === 0) {
          setSearchState('complete');
          setGemmaReview('No matching movies found with current filters.');
          return;
        }

        setSearchState('summarizing');
        try {
          const review = await executePass2(queryText.trim(), movies);
          setGemmaReview(review);
        } catch (pass2Error) {
          console.log('⚠️ Pass 2 failed during refinement, using simple message');
          const activeVibes = newActiveBadges.join(', ');
          setGemmaReview(`Showing ${movies.length} movies for your search. Active mood filters: ${activeVibes}. These moods help frame the recommendations, though the core genre-based results remain consistent.`);
        }
        setSearchState('complete');
      } catch (error) {
        setSearchState('error');
        setErrorMessage(error instanceof Error ? error.message : 'Error refining results.');
      }
    },
    [vibePills, queryText, fetchMoviesFromTMDB, executePass2]
  );

  useEffect(() => {
    return () => {
      abortRef.current = true;
    };
  }, []);

  const renderInputBlock = () => (
    <View style={styles.inputBlock}>
      <TextInput
        style={styles.textInput}
        placeholder="e.g., A tense 90s thriller in a rainy city"
        placeholderTextColor="#999999"
        value={queryText}
        onChangeText={setQueryText}
        multiline
        editable={searchState === 'idle' || searchState === 'complete' || searchState === 'error'}
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.askButton, styles.askButtonPrimary, (isInitializing || searchState === 'extracting' || searchState === 'fetching' || searchState === 'summarizing') && styles.askButtonDisabled]}
          onPress={performFullSearch}
          disabled={isInitializing || searchState === 'extracting' || searchState === 'fetching' || searchState === 'summarizing'}
        >
          <Text style={styles.askButtonText}>Ask AI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPillRow = () => {
    if (vibePills.length === 0) return null;

    return (
      <View style={styles.pillContainer}>
        <Text style={styles.pillLabel}>Vibe Pills:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScrollView}>
          {vibePills.map((pill) => (
            <TouchableOpacity
              key={pill.id}
              style={[styles.pill, !pill.active && styles.pillInactive]}
              onPress={() => handlePillToggle(pill.id)}
            >
              <Text style={[styles.pillText, !pill.active && styles.pillTextInactive]}>
                {pill.active ? '✨ ' : ''}
                {pill.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEditorialBox = () => {
    if (!gemmaReview && searchState !== 'summarizing') return null;

    return (
      <View style={styles.editorialBox}>
        <Text style={styles.editorialTitle}>Gemma's Suggestions</Text>
        {searchState === 'summarizing' ? (
          <ActivityIndicator size="small" color="#0296E5" style={styles.editorialLoader} />
        ) : (
          <Text style={styles.editorialText}>{gemmaReview}</Text>
        )}
      </View>
    );
  };

  const renderMovieItem = ({ item }: { item: Movie }) => {
    const releaseYear = item.release_date?.slice(0, 4) ?? 'N/A';
    const ratingText = typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : 'N/A';

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.movieCard}
        onPress={() => navigation.navigate('Details', { movieId: item.id })}
      >
        <Image
          source={item.poster_path ? { uri: `${IMAGE_BASE_URL}${item.poster_path}` } : undefined}
          style={styles.moviePoster}
        />
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.movieMetaRow}>
            <Text style={styles.ratingStar}>★</Text>
            <Text style={styles.ratingText}>{ratingText}</Text>
            <Text style={styles.movieYear}> • {releaseYear}</Text>
          </View>
          <Text style={styles.movieOverview} numberOfLines={3}>
            {item.overview}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLoadingState = () => {
    let message = 'Processing...';
    if (searchState === 'extracting') message = 'Extracting intent...';
    else if (searchState === 'fetching') message = 'Querying database...';
    else if (searchState === 'summarizing') message = 'Generating summary...';

    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color="#0296E5" />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.centerState}>
      <Text style={styles.errorText}>{errorMessage ?? 'An error occurred.'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={resetSearch}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  const renderInitializingState = () => (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color="#0296E5" />
      <Text style={styles.loadingText}>Initializing Gemma model...</Text>
    </View>
  );

  const renderInitErrorState = () => (
    <View style={styles.centerState}>
      <Text style={styles.errorText}>Failed to load Gemma model:</Text>
      <Text style={styles.errorText}>{initError}</Text>
    </View>
  );

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Search</Text>
        </View>
        {renderInitializingState()}
      </SafeAreaView>
    );
  }

  if (initError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Search</Text>
        </View>
        {renderInitErrorState()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Search</Text>
      </View>

      {renderInputBlock()}

      {renderPillRow()}

      {renderEditorialBox()}

      {(searchState === 'extracting' || searchState === 'fetching' || searchState === 'summarizing') &&
        renderLoadingState()}

      {searchState === 'error' && renderErrorState()}

      {searchState === 'complete' && movieResults.length > 0 && (
        <FlatList
          data={movieResults}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderMovieItem}
          contentContainerStyle={styles.movieList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {searchState === 'complete' && movieResults.length === 0 && gemmaReview && (
        <View style={styles.centerState}>
          <Text style={styles.emptyText}>No movies found matching your query.</Text>
        </View>
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
  inputBlock: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  textInput: {
    backgroundColor: '#2A3039',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFFFFF',
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  askButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    flex: 1,
  },
  askButtonPrimary: {
    backgroundColor: '#0296E5',
  },
  testButton: {
    backgroundColor: '#FF8700',
    flex: 0.5,
  },
  askButtonDisabled: {
    backgroundColor: '#4A5568',
  },
  askButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pillContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  pillLabel: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  pillScrollView: {
    flexDirection: 'row',
  },
  pill: {
    backgroundColor: '#0296E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  pillInactive: {
    backgroundColor: '#4A5568',
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextInactive: {
    color: '#AAAAAA',
  },
  editorialBox: {
    marginHorizontal: 24,
    marginVertical: 12,
    backgroundColor: '#2A3039',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0296E5',
    padding: 16,
  },
  editorialTitle: {
    color: '#0296E5',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  editorialText: {
    color: '#EEEEEE',
    fontSize: 14,
    lineHeight: 20,
  },
  editorialLoader: {
    marginTop: 8,
  },
  movieList: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  movieCard: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#2A3039',
    borderRadius: 12,
    padding: 12,
  },
  moviePoster: {
    width: 90,
    height: 135,
    borderRadius: 8,
    backgroundColor: '#1E1E2A',
  },
  movieInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  movieMetaRow: {
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
    fontSize: 13,
    fontWeight: '600',
  },
  movieYear: {
    color: '#AAAAAA',
    fontSize: 13,
  },
  movieOverview: {
    color: '#CCCCCC',
    fontSize: 13,
    lineHeight: 18,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: '#AAAAAA',
    fontSize: 15,
    marginTop: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#0296E5',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyText: {
    color: '#AAAAAA',
    fontSize: 15,
    textAlign: 'center',
  },
});
