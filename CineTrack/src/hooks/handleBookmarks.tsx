import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addBookmark,
  getAllBookmarks,
  isBookmarked,
  removeBookmark,
  type BookmarkMovieInput,
  type BookmarkRow,
} from '../db/bookmarkDB';

export function handleBookmarks() {
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  const bookmarkedIds = useMemo(() => new Set((bookmarks ?? []).map((b) => b.tmdb_id)), [bookmarks]);

  const toggleBookmark = useCallback(
    async (movie: BookmarkMovieInput) => {
      const exists = await isBookmarked(db, movie.id);
      if (exists) {
        await removeBookmark(db, movie.id);
      } else {
        await addBookmark(db, movie);
      }
      await refresh();
      return !exists;
    },
    [db, refresh]
  );

  const checkBookmarked = useCallback(
    (movieId: number) => bookmarkedIds.has(movieId),
    [bookmarkedIds]
  );

  return {
    bookmarks,
    loading,
    refresh,
    toggleBookmark,
    checkBookmarked,
  };
}