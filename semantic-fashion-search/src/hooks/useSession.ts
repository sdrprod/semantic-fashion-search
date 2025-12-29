import { useState, useEffect } from 'react';

/**
 * Hook to manage anonymous session ID for tracking user feedback
 * Session ID is stored in localStorage and persists across browser sessions
 */
export function useSession() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Get or create session ID
    let id = localStorage.getItem('session_id');

    if (!id) {
      // Generate new UUID for this session
      id = crypto.randomUUID();
      localStorage.setItem('session_id', id);
    }

    setSessionId(id);
  }, []);

  return sessionId;
}
