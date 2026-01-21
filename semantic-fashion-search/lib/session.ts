/**
 * Session Management for Anonymous Users
 * Generates and stores a persistent session ID in localStorage
 */

/**
 * Get or create a session ID for the current user
 * Session ID persists across page refreshes via localStorage
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return a placeholder (won't be used)
    return 'server-side-placeholder';
  }

  const SESSION_KEY = 'fashion_search_session_id';

  // Try to get existing session ID
  let sessionId = localStorage.getItem(SESSION_KEY);

  // If no session ID exists, create one
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Generate a unique session ID
 * Format: timestamp + random string
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}

/**
 * Clear the current session (useful for testing)
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fashion_search_session_id');
  }
}
