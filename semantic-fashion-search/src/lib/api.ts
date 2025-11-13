import type { SearchResponse } from "../types";

/**
 * Search for products using natural language query
 */
export async function searchProducts(
  query: string,
  limit = 20
): Promise<SearchResponse> {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, limit })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Search request failed" }));
    throw new Error(error.error || "Search request failed");
  }

  return response.json();
}
