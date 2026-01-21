import { useState, useEffect } from 'react';
import { getSessionId } from '@/lib/session';

export type Vote = 1 | -1 | null;

interface UseFeedbackReturn {
  vote: Vote;
  isLoading: boolean;
  submitVote: (newVote: 1 | -1) => Promise<void>;
}

/**
 * Hook to manage product feedback (upvote/downvote)
 * Persists votes to the backend and maintains local state
 */
export function useFeedback(productId: string): UseFeedbackReturn {
  const [vote, setVote] = useState<Vote>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing vote from localStorage on mount
  useEffect(() => {
    const storageKey = `feedback_${productId}`;
    const stored = localStorage.getItem(storageKey);
    if (stored === '1') setVote(1);
    else if (stored === '-1') setVote(-1);
  }, [productId]);

  const submitVote = async (newVote: 1 | -1) => {
    setIsLoading(true);

    try {
      const sessionId = getSessionId();

      // If clicking the same vote, toggle it off (remove vote)
      const finalVote = vote === newVote ? null : newVote;

      // Send to API (API expects vote value, we handle toggle logic here)
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          productId,
          vote: finalVote ?? 0, // Send 0 to indicate removing the vote
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit vote');
      }

      // Update local state
      setVote(finalVote);

      // Persist to localStorage
      const storageKey = `feedback_${productId}`;
      if (finalVote === null) {
        localStorage.removeItem(storageKey);
      } else {
        localStorage.setItem(storageKey, finalVote.toString());
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      // Could show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return { vote, isLoading, submitVote };
}
