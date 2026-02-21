import { useState, useEffect, useCallback } from 'react';

interface PersistentRatings {
  [productId: string]: number; // 1-5 stars
}

interface UsePersistentRatingsOptions {
  userId: string | null; // null = not authenticated
  autoFetch?: boolean; // Auto-fetch user's ratings on mount
}

/**
 * Persistent Ratings Hook (Authenticated Users Only)
 *
 * Features:
 * - Stores ratings in database (product_feedback table)
 * - Requires authenticated user (userId)
 * - Permanent storage (survives browser close)
 * - Contributes to community aggregate stats
 * - Auto-fetches user's existing ratings on mount
 *
 * Usage:
 *   const { rate, getRating } = usePersistentRatings({ userId: session?.user?.id });
 */
export function usePersistentRatings({
  userId,
  autoFetch = true,
}: UsePersistentRatingsOptions) {
  const [ratings, setRatings] = useState<PersistentRatings>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's existing ratings from API
  const fetchRatings = useCallback(async () => {
    if (!userId) {
      setIsLoaded(true);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ratings/user', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || {});
      } else {
        console.error('Failed to fetch user ratings');
      }
    } catch (err) {
      console.error('Error fetching user ratings:', err);
    } finally {
      setIsLoading(false);
      setIsLoaded(true);
    }
  }, [userId]);

  // Auto-fetch on mount if userId available
  useEffect(() => {
    if (autoFetch && userId) {
      fetchRatings();
    } else {
      setIsLoaded(true);
    }
  }, [userId, autoFetch, fetchRatings]);

  // Rate a product (1-5 stars)
  const rate = useCallback(
    async (productId: string, rating: number) => {
      if (!userId) {
        console.warn('Cannot save rating: user not authenticated');
        return false;
      }

      if (rating < 1 || rating > 5) {
        console.error('Invalid rating:', rating, '(must be 1-5)');
        return false;
      }

      // Optimistic update
      const newRatings = { ...ratings, [productId]: rating };
      setRatings(newRatings);

      try {
        const response = await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            rating,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Failed to save rating:', error);

          // Revert optimistic update on failure
          setRatings(ratings);
          return false;
        }

        return true;
      } catch (err) {
        console.error('Network error saving rating:', err);

        // Revert optimistic update on error
        setRatings(ratings);
        return false;
      }
    },
    [userId, ratings]
  );

  // Get rating for a product (0 if unrated)
  const getRating = useCallback(
    (productId: string): number => {
      return ratings[productId] || 0;
    },
    [ratings]
  );

  // Check if product has been rated
  const hasRating = useCallback(
    (productId: string): boolean => {
      return productId in ratings;
    },
    [ratings]
  );

  // Clear a single rating (delete from database)
  const clearRating = useCallback(
    async (productId: string) => {
      if (!userId) {
        console.warn('Cannot clear rating: user not authenticated');
        return false;
      }

      // Optimistic update
      const newRatings = { ...ratings };
      delete newRatings[productId];
      setRatings(newRatings);

      try {
        const response = await fetch(`/api/ratings?productId=${productId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          console.error('Failed to delete rating');
          // Revert optimistic update
          setRatings(ratings);
          return false;
        }

        return true;
      } catch (err) {
        console.error('Error deleting rating:', err);
        // Revert optimistic update
        setRatings(ratings);
        return false;
      }
    },
    [userId, ratings]
  );

  // Get all product IDs with ratings
  const getRatedProductIds = useCallback((): string[] => {
    return Object.keys(ratings);
  }, [ratings]);

  // Save free-text feedback for a product (upserts alongside existing rating)
  const saveFeedback = useCallback(
    async (productId: string, feedbackText: string) => {
      if (!userId) {
        console.warn('Cannot save feedback: user not authenticated');
        return false;
      }

      try {
        const response = await fetch('/api/ratings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            rating: ratings[productId], // preserve existing rating
            feedbackText,
          }),
        });
        return response.ok;
      } catch (err) {
        console.error('Network error saving feedback:', err);
        return false;
      }
    },
    [userId, ratings]
  );

  return {
    ratings,
    isLoaded,
    isLoading,
    isAuthenticated: !!userId,
    rate,
    getRating,
    hasRating,
    clearRating,
    getRatedProductIds,
    saveFeedback,
    refetch: fetchRatings,
  };
}
