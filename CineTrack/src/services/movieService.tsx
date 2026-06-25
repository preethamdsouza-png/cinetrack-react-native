import axios from 'axios';
import Constants from 'expo-constants';
import type { Movie } from '../types/Movie';
import { MovieDetailData } from '../types/MovieDetail';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

type TmdbMovieListResponse = {
  results: Movie[];
};

const getApiKey = (): string => {
  const envApiKey = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.EXPO_PUBLIC_TMDB_API_KEY;
  const configApiKey = Constants.expoConfig?.extra?.tmdbApiKey;
  const apiKey = envApiKey ?? configApiKey;

  if (!apiKey) {
    throw new Error(
      'Missing TMDB API key. Set EXPO_PUBLIC_TMDB_API_KEY or expo.extra.tmdbApiKey.'
    );
  }

  return apiKey;
};

const movieClient = axios.create({
  baseURL: TMDB_BASE_URL,
  params: {
    api_key: '13238ac6cc2796c8695d39e074139a0a' //process.env.EXPO_PUBLIC_TMDB_API_KEY, // Automatically appended to every request!
  },
});

movieClient.interceptors.request.use((config) => {
  const fullUrl = `${config.baseURL}${config.url}`;
  console.log('🌐 --- AXIOS REQUEST OUTBOUND ---');
  console.log(`📡 Method: ${config.method?.toUpperCase()}`);
  console.log(`🔗 Base URL + Path: ${fullUrl}`);
  console.log('📊 Query Params:', config.params);
  console.log('---------------------------------');
  return config;
}, (error) => {
  return Promise.reject(error);
});

const fetchMovies = async (endpoint: string): Promise<Movie[]> => {
  try {
    const response = await movieClient.get<TmdbMovieListResponse>(endpoint);

    return Array.isArray(response.data.results) ? response.data.results : [];
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data;
      throw new Error(`TMDB request failed (${statusCode ?? 'unknown'}): ${String(responseData ?? error.message)}`);
    }

    throw error;
  }
};


const movieService = {
  getTrendingToday: async (): Promise<Movie[]> => fetchMovies('/trending/movie/day'),
  getUpComing: async (): Promise<Movie[]> => fetchMovies('/movie/upcoming'),
  getNowPlaying: async (): Promise<Movie[]> => fetchMovies('/movie/now_playing'),
  getPopular: async (): Promise<Movie[]> => fetchMovies('/movie/popular'),
  getTopRated: async (): Promise<Movie[]> => fetchMovies('/movie/top_rated'),
  searchMovies: async (query: string, page: number = 1): Promise<Movie[]> => {
    const response = await movieClient.get<TmdbMovieListResponse>('/search/movie', {
      params: {
        query: query,
        include_adult: false,   // <-- Hides adult content explicitly
        language: 'en-US',      // <-- Defaults results to English
        page: page,             // <-- Supports pagination (defaults to page 1)
      },
    });
    return Array.isArray(response.data.results) ? response.data.results : []
  },
  getMovieDetails: async (id: number): Promise<MovieDetailData> => {
  const response = await movieClient.get<MovieDetailData>(`/movie/${id}`, {
    params: {
      language: 'en-US',
      append_to_response: 'credits,reviews'
    }
  });
  return response.data;
}
};

export default movieService;
