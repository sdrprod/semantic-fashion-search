'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RefinementLevel, ParsedIntent, Product } from '@/types';

interface UseRefinementHistoryReturn {
  refinementLevels: RefinementLevel[];
  currentLevelIndex: number;
  canRefineMore: boolean;

  // Methods
  pushRefinement: (query: string, results: Product[], totalCount: number, intent: ParsedIntent) => void;
  popRefinement: () => void;
  clearRefinements: () => void;

  // Persistence
  saveRefinementHistory: (productClicked?: string) => Promise<void>;
}

const REFINEMENT_LEVELS_KEY = 'refinement_levels';
const MAX_REFINEMENT_LEVELS = 3;

export function useRefinementHistory(userId?: string): UseRefinementHistoryReturn {
  const [refinementLevels, setRefinementLevels] = useState<RefinementLevel[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // On component mount: restore from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(REFINEMENT_LEVELS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setRefinementLevels(parsed);
        }
      } catch (err) {
        console.error('[useRefinementHistory] Failed to restore from sessionStorage:', err);
      }
      setIsHydrated(true);
    }
  }, []);

  // Keep sessionStorage in sync whenever refinementLevels changes (after hydration)
  useEffect(() => {
    if (typeof window !== 'undefined' && isHydrated) {
      try {
        sessionStorage.setItem(REFINEMENT_LEVELS_KEY, JSON.stringify(refinementLevels));
      } catch (err) {
        console.error('[useRefinementHistory] Failed to save to sessionStorage:', err);
      }
    }
  }, [refinementLevels, isHydrated]);

  // Save to DB for logged-in users
  const saveRefinementHistory = useCallback(
    async (productClicked?: string) => {
      if (!userId || refinementLevels.length === 0) return;

      try {
        const initialQuery = refinementLevels[0]?.query || '';
        const refinements = refinementLevels.slice(1).map(r => r.refinementQuery || '');
        const resultCounts = refinementLevels.map(r => r.totalCount);
        const timestamps = refinementLevels.map(r => r.timestamp);

        await fetch('/api/search/refinement-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initialQuery,
            refinements,
            resultCounts,
            timestamps,
            clickedProductId: productClicked,
          }),
        });
      } catch (err) {
        console.error('[useRefinementHistory] Failed to save refinement history:', err);
      }
    },
    [userId, refinementLevels]
  );

  const pushRefinement = useCallback(
    (query: string, results: Product[], totalCount: number, intent: ParsedIntent) => {
      setRefinementLevels(prev => {
        if (prev.length >= MAX_REFINEMENT_LEVELS) {
          console.warn('[useRefinementHistory] Max refinement levels reached');
          return prev;
        }

        return [
          ...prev,
          {
            query,
            refinementQuery: prev.length > 0 ? query : undefined,
            results,
            totalCount,
            page: 1,
            intent,
            timestamp: Date.now(),
          },
        ];
      });
    },
    []
  );

  const popRefinement = useCallback(() => {
    setRefinementLevels(prev => {
      if (prev.length <= 1) {
        console.warn('[useRefinementHistory] Cannot pop the initial level');
        return prev;
      }
      return prev.slice(0, -1);
    });
  }, []);

  const clearRefinements = useCallback(() => {
    setRefinementLevels([]);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(REFINEMENT_LEVELS_KEY);
    }
  }, []);

  return {
    refinementLevels,
    currentLevelIndex: refinementLevels.length - 1,
    canRefineMore: refinementLevels.length < MAX_REFINEMENT_LEVELS,
    pushRefinement,
    popRefinement,
    clearRefinements,
    saveRefinementHistory,
  };
}
