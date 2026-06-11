export interface Movie {
    id: number;
    title: string;
    adult: boolean;
    poster_path: string;
    original_language: string;
    original_title: string;
    backdrop_path: string;
    overview: string;
    vote_average: number;
    release_date: string;
    genre_ids: number[];
}

export interface TMDBResponse {
    page: number;
    results: Movie[];
    total_pages: number;
    total_results: number;
}