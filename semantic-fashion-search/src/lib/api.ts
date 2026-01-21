import type { SearchResponse } from "../types";

/**
 * Search for products using natural language query
 */
export async function searchProducts(
  query: string,
  options: {
    limit?: number;
    page?: number;
    userRatings?: { [productId: string]: number };
  } = {}
): Promise<SearchResponse> {
  const { limit = 24, page = 1, userRatings = {} } = options;

  const response = await fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, limit, page, userRatings })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Search request failed" }));
    throw new Error(error.error || "Search request failed");
  }

  return response.json();
}
