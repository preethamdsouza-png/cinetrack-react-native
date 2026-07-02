import axios from 'axios';
import Constants from 'expo-constants';
import type { Movie } from '../types/Movie';
import { MovieDetailData } from '../types/MovieDetail';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

type TmdbMovieListResponse = {
  results: Movie[];
  total_results?: number;
  page?: number;
  total_pages?: number;
};

export type Genre = {
  id: number;
  name: string;
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


let genreCache: Genre[] | null = null;

const fetchGenres = async (): Promise<Genre[]> => {
  if (genreCache) {
    return genreCache;
  }
  
  try {
    const response = await movieClient.get<{ genres: Genre[] }>('/genre/movie/list', {
      params: {
        language: 'en-US',
      },
    });
    genreCache = response.data.genres;
    return genreCache;
  } catch (error) {
    console.error('Failed to fetch genres:', error);
    return [];
  }
};

const genreNameToIds = async (keywords: string): Promise<number[]> => {
  const genres = await fetchGenres();
  const keywordsLower = keywords.toLowerCase();
  const genreIds: number[] = [];
  
  for (const genre of genres) {
    const genreName = genre.name.toLowerCase();
    
    if (keywordsLower.includes(genreName)) {
      genreIds.push(genre.id);
    }
  }
  
  return [...new Set(genreIds)];
};

const movieService = {
  getTrendingToday: async (): Promise<Movie[]> => fetchMovies('/trending/movie/day'),
  getUpComing: async (): Promise<Movie[]> => fetchMovies('/movie/upcoming'),
  getNowPlaying: async (): Promise<Movie[]> => fetchMovies('/movie/now_playing'),
  getPopular: async (): Promise<Movie[]> => fetchMovies('/movie/popular'),
  getTopRated: async (): Promise<Movie[]> => fetchMovies('/movie/top_rated'),
  searchMovies: async (query: string, page: number = 1): Promise<Movie[]> => {
    console.log('🔍 searchMovies called with query:', query);
    const response = await movieClient.get<TmdbMovieListResponse>('/search/movie', {
      params: {
        query: query,
        include_adult: false,
        language: 'en-US',
        page: page,
      },
    });
    console.log('📦 TMDB Response:', {
      total_results: response.data.total_results,
      results_count: response.data.results?.length || 0,
      first_result: response.data.results?.[0]?.title || 'none'
    });
    return Array.isArray(response.data.results) ? response.data.results : []
  },
  discoverMovies: async (keywords: string, page: number = 1): Promise<Movie[]> => {
    console.log('🔍 discoverMovies called with keywords:', keywords);
    
    const genreIds = await genreNameToIds(keywords);
    console.log('🎭 Mapped genres:', genreIds);
    
    const yearMatch = keywords.match(/\b(19\d{2}|20[0-2]\d)\b/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : null;
    
    const params: any = {
      include_adult: false,
      language: 'en-US',
      page: page,
      sort_by: 'popularity.desc',
    };
    
    if (genreIds.length > 0) {
      params.with_genres = genreIds.join('|');
    }
    
    if (year) {
      params.primary_release_year = year;
      console.log('📅 Filtering by year:', year);
    }
    
    console.log('📊 Discover params:', params);
    
    const response = await movieClient.get<TmdbMovieListResponse>('/discover/movie', {
      params,
    });
    
    console.log('📦 Discover Response:', {
      total_results: response.data.total_results,
      results_count: response.data.results?.length || 0,
      first_three: response.data.results?.slice(0, 3).map(m => m.title) || []
    });
    
    return Array.isArray(response.data.results) ? response.data.results : []
  },
  getGenres: async (): Promise<Genre[]> => {
    return fetchGenres();
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
