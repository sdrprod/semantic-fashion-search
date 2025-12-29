import { useState } from "react";
import { searchProducts } from "../lib/api";
import type { Product } from "../types";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [refinement, setRefinement] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRefinement, setShowRefinement] = useState(false);

  const runSearch = async (useRefinement = false) => {
    // Build the search query
    let searchQuery = query.trim();

    // If refining, combine original query with refinement
    if (useRefinement && refinement.trim()) {
      searchQuery = `${query.trim()}. ${refinement.trim()}`;
    }

    // Don't search if query is empty or too short
    if (!searchQuery || searchQuery.length < 3) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchProducts(searchQuery);
      setResults(response.results);

      // Show refinement box after initial search (only if not already showing)
      if (!useRefinement && !showRefinement) {
        setShowRefinement(true);
      }

      // Clear refinement after using it
      if (useRefinement) {
        setRefinement("");
      }
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
    refinement,
    setRefinement,
    results,
    loading,
    error,
    showRefinement,
    setShowRefinement,
    runSearch
  };
}
