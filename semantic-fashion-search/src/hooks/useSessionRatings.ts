import { useState, useEffect, useCallback } from 'react';

interface SessionRatings {
  [productId: string]: number; // 1-5 stars
}

/**
 * Session-Only Ratings Hook (Anonymous Users)
 *
 * Features:
 * - Stores ratings in localStorage only
 * - Cleared when browser session ends (all tabs close)
 * - Never syncs to database
 * - Used for immediate personalization during browsing
 * - Falls back to memory if localStorage unavailable
 *
 * Storage key: 'session_ratings' (sessionStorage for true session lifecycle)
 */
export function useSessionRatings() {
  const [ratings, setRatings] = useState<SessionRatings>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('session_ratings');
      if (stored) {
        const parsed: SessionRatings = JSON.parse(stored);
        setRatings(parsed);
      }
    } catch (err) {
      console.error('Failed to load session ratings:', err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to sessionStorage whenever ratings change
  const saveRatings = useCallback((newRatings: SessionRatings) => {
    try {
      sessionStorage.setItem('session_ratings', JSON.stringify(newRatings));
      setRatings(newRatings);
    } catch (err) {
      console.error('Failed to save session ratings:', err);
      // Still update state even if sessionStorage fails
      setRatings(newRatings);
    }
  }, []);

  // Rate a product (1-5 stars)
  const rate = useCallback(
    (productId: string, rating: number) => {
      if (rating < 1 || rating > 5) {
        console.error('Invalid rating:', rating, '(must be 1-5)');
        return;
      }

      const newRatings = { ...ratings, [productId]: rating };
      saveRatings(newRatings);
    },
    [ratings, saveRatings]
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

  // Clear a single rating
  const clearRating = useCallback(
    (productId: string) => {
      const newRatings = { ...ratings };
      delete newRatings[productId];
      saveRatings(newRatings);
    },
    [ratings, saveRatings]
  );

  // Clear all ratings (useful for "start fresh")
  const clearAll = useCallback(() => {
    try {
      sessionStorage.removeItem('session_ratings');
      setRatings({});
    } catch (err) {
      console.error('Failed to clear session ratings:', err);
    }
  }, []);

  // Get all product IDs with ratings
  const getRatedProductIds = useCallback((): string[] => {
    return Object.keys(ratings);
  }, [ratings]);

  // Filter products based on ratings (for search filtering)
  const shouldShowProduct = useCallback(
    (productId: string): boolean => {
      const rating = getRating(productId);
      // Hide if rated 1-2 stars, show if unrated or 3-5 stars
      return rating === 0 || rating >= 3;
    },
    [getRating]
  );

  // Get personal boost for a product (for search ranking)
  const getPersonalBoost = useCallback(
    (productId: string): number => {
      const rating = getRating(productId);
      switch (rating) {
        case 5:
          return 0.15; // Maximum boost
        case 4:
          return 0.10; // More boost
        case 3:
          return 0.05; // Moderate boost
        default:
          return 0.0; // No boost for unrated or low-rated
      }
    },
    [getRating]
  );

  return {
    ratings,
    isLoaded,
    rate,
    getRating,
    hasRating,
    clearRating,
    clearAll,
    getRatedProductIds,
    shouldShowProduct,
    getPersonalBoost,
  };
}
