import { useState } from "react";
import { searchProducts } from "../lib/api";
import type { Product } from "../types";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    // Don't search if query is empty or too short
    if (!query || query.trim().length < 3) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchProducts(query.trim());
      setResults(response.results);
    } catch (err) {
      console.error("Search failed:", err);
      setError(err instanceof Error ? err.message : "Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    runSearch
  };
}
