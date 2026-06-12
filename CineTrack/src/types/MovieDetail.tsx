export interface Genre {
  id: number;
  name: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface AuthorDetails {
  name: string;
  username: string;
  avatar_path: string | null;
  rating: number | null;
}

export interface MovieReview {
  id: string;
  author: string;
  content: string;
  created_at: string;
  author_details: AuthorDetails;
}

export interface MovieDetailData {
  id: number;
  title: string;
  backdrop_path: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  runtime: number;
  genres: Genre[];
  overview: string;
  credits: {
    cast: CastMember[];
  };
  reviews: {
    results: MovieReview[];
  };
}