import { useState, useEffect, useCallback } from 'react';

interface FeedbackState {
  votes: Map<string, 1 | -1>;
  hiddenProducts: Set<string>;
}

interface StoredFeedbackState {
  votes: [string, 1 | -1][];
  hiddenProducts: string[];
}

/**
 * Hook to manage product feedback (upvotes/downvotes)
 * Stores votes in memory and syncs to localStorage for persistence
 * Handles API calls to save votes to backend
 */
export function useFeedback(sessionId: string) {
  const [state, setState] = useState<FeedbackState>({
    votes: new Map(),
    hiddenProducts: new Set()
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('feedback_state');
      if (stored) {
        const parsed: StoredFeedbackState = JSON.parse(stored);
        setState({
          votes: new Map(parsed.votes),
          hiddenProducts: new Set(parsed.hiddenProducts)
        });
      }
    } catch (err) {
      console.error('Failed to load feedback state from localStorage:', err);
    }
  }, []);

  // Save state to localStorage
  const saveState = useCallback((newState: FeedbackState) => {
    try {
      const toStore: StoredFeedbackState = {
        votes: Array.from(newState.votes.entries()),
        hiddenProducts: Array.from(newState.hiddenProducts)
      };
      localStorage.setItem('feedback_state', JSON.stringify(toStore));
      setState(newState);
    } catch (err) {
      console.error('Failed to save feedback state to localStorage:', err);
      // Still update React state even if localStorage fails
      setState(newState);
    }
  }, []);

  // Generic vote function
  const vote = useCallback(async (productId: string, voteValue: 1 | -1) => {
    // Optimistic update - update UI immediately
    const newVotes = new Map(state.votes);
    newVotes.set(productId, voteValue);

    const newHidden = new Set(state.hiddenProducts);
    if (voteValue === -1) {
      // Downvote = hide product
      newHidden.add(productId);
    } else {
      // Upvote = unhide product if it was hidden
      newHidden.delete(productId);
    }

    saveState({ votes: newVotes, hiddenProducts: newHidden });

    // Background API call - don't block UI
    if (!sessionId) {
      console.warn('No session ID available, vote not saved to backend');
      return;
    }

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          productId,
          vote: voteValue
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to save vote to backend:', error);
      }
    } catch (err) {
      console.error('Network error saving vote:', err);
      // Keep optimistic update even if API fails - graceful degradation
    }
  }, [state.votes, state.hiddenProducts, sessionId, saveState]);

  // Convenience methods
  const upvote = useCallback((productId: string) => {
    return vote(productId, 1);
  }, [vote]);

  const downvote = useCallback((productId: string) => {
    return vote(productId, -1);
  }, [vote]);

  return {
    votes: state.votes,
    hiddenProducts: state.hiddenProducts,
    upvote,
    downvote
  };
}
