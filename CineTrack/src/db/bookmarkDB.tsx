import type { SQLiteDatabase } from 'expo-sqlite';
import type { Movie } from '../types/Movie';

export type BookmarkMovieInput = Partial<Movie> & {
  id: number;
  title: string;
  vote_average?: number;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
};

export type BookmarkRow = {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string | null;
  vote_average: number | null;
  original_language: string | null;
  original_title: string | null;
  primary_genre: string | null;
  runtime_minutes: number | null;
  release_date: string | null;
  created_at: number;
};

export async function migrateBookmarksDb(db: SQLiteDatabase): Promise<void> {
  const DATABASE_VERSION = 4;
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS bookmarks (
      tmdb_id INTEGER PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      poster_path TEXT,
      backdrop_path TEXT,
      overview TEXT,
      vote_average REAL,
      original_language TEXT,
      original_title TEXT,
      primary_genre TEXT,
      runtime_minutes INTEGER,
      release_date TEXT,
      created_at INTEGER
    );
  `);

  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(bookmarks)');
  const columnSet = new Set(columns.map((column) => column.name));
  const hasCreatedAt = columns.some((column) => column.name === 'created_at');
  if (!hasCreatedAt) {
    await db.execAsync('ALTER TABLE bookmarks ADD COLUMN created_at INTEGER;');
  }
  if (!columnSet.has('backdrop_path')) {
    await db.execAsync('ALTER TABLE bookmarks ADD COLUMN backdrop_path TEXT;');
  }
  if (!columnSet.has('overview')) {
    await db.execAsync('ALTER TABLE bookmarks ADD COLUMN overview TEXT;');
  }
  if (!columnSet.has('vote_average')) {
    await db.execAsync('ALTER TABLE bookmarks ADD COLUMN vote_average REAL;');
  }
  if (!columnSet.has('original_language')) {
    await db.execAsync('ALTER TABLE bookmarks ADD COLUMN original_language TEXT;');
  }
  if (!columnSet.has('original_title')) {
    await db.execAsync('ALTER TABLE bookmarks ADD COLUMN original_title TEXT;');
  }
  if (!columnSet.has('primary_genre')) {
    await db.execAsync('ALTER TABLE bookmarks ADD COLUMN primary_genre TEXT;');
  }
  if (!columnSet.has('runtime_minutes')) {
    await db.execAsync('ALTER TABLE bookmarks ADD COLUMN runtime_minutes INTEGER;');
  }

  await db.execAsync(`
    UPDATE bookmarks
    SET created_at = COALESCE(created_at, strftime('%s','now') * 1000);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at
      ON bookmarks(created_at DESC);
    PRAGMA user_version = ${DATABASE_VERSION};
  `);
}

export async function addBookmark(db: SQLiteDatabase, movie: BookmarkMovieInput): Promise<void> {
  const primaryGenre = movie.genres?.[0]?.name ?? null;
  const runtimeMinutes = typeof movie.runtime === 'number' ? movie.runtime : null;

  await db.runAsync(
    `INSERT OR REPLACE INTO bookmarks (
      tmdb_id, title, poster_path, backdrop_path, overview, vote_average,
      original_language, original_title, primary_genre, runtime_minutes, release_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    movie.id,
    movie.title,
    movie.poster_path ?? null,
    movie.backdrop_path ?? null,
    movie.overview ?? null,
    movie.vote_average ?? null,
    movie.original_language ?? null,
    movie.original_title ?? null,
    primaryGenre,
    runtimeMinutes,
    movie.release_date ?? null,
    Date.now()
  );
}
export async function removeBookmark(db: SQLiteDatabase, movieId: number): Promise<void> {
  await db.runAsync('DELETE FROM bookmarks WHERE tmdb_id = ?', movieId);
}
export async function isBookmarked(db: SQLiteDatabase, movieId: number): Promise<boolean> {
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM bookmarks WHERE tmdb_id = ?',
    movieId
  );
  return (row?.c ?? 0) > 0;
}
export async function getAllBookmarks(db: SQLiteDatabase): Promise<BookmarkRow[]> {
  return db.getAllAsync<BookmarkRow>(
    'SELECT * FROM bookmarks ORDER BY created_at DESC'
  );
}