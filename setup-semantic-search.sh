#!/bin/bash

# Semantic Fashion Search - Project Setup Script
# This script creates all files and directories for the semantic fashion search MVP

set -e

echo "Creating semantic-fashion-search project..."

# Create directory structure
mkdir -p semantic-fashion-search
cd semantic-fashion-search

mkdir -p src/components
mkdir -p src/hooks
mkdir -p src/lib
mkdir -p netlify/functions
mkdir -p data

echo "Creating configuration files..."

# package.json
cat > package.json << 'EOF'
{
  "name": "semantic-fashion-search",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "@netlify/functions": "^2.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
EOF

# tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# tsconfig.node.json
cat > tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "netlify"]
}
EOF

# vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
EOF

# netlify.toml
cat > netlify.toml << 'EOF'
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/search"
  to = "/.netlify/functions/search"
  status = 200

[[redirects]]
  from = "/api/index-products"
  to = "/.netlify/functions/index-products"
  status = 200
EOF

# index.html
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Discover clothing that matches your exact vision using natural language and AI-powered semantic search." />
    <title>Semantic Fashion Search</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# .env.example
cat > .env.example << 'EOF'
# ============================================
# Environment Variables - Semantic Fashion Search
# ============================================
# Copy this file to .env and fill in your actual values
# NEVER commit .env to version control

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Indexing Security
INDEX_SECRET=your-secret-key-for-indexing-endpoint

# Optional: Frontend API base URL (leave empty for relative paths)
# VITE_API_BASE_URL=
EOF

# .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/

# Misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Netlify
.netlify/
EOF

echo "Creating source files..."

# src/types.ts
cat > src/types.ts << 'EOF'
export interface Product {
  id: string;
  imageUrl: string;
  brand: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  productUrl: string;
}

export interface SearchResponse {
  query: string;
  results: Product[];
}
EOF

# src/main.tsx
cat > src/main.tsx << 'EOF'
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

# src/App.tsx
cat > src/App.tsx << 'EOF'
import { useSearch } from "./hooks/useSearch";
import { SearchBar } from "./components/SearchBar";
import { ProductCard } from "./components/ProductCard";

export function App() {
  const { query, setQuery, results, loading, error, runSearch } = useSearch();

  const hasSearched = results.length > 0 || error !== null || loading;

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1 className="title">Semantic Fashion Search</h1>
          <p className="subtitle">
            Discover clothing that matches your exact vision using natural language
          </p>
        </header>

        <SearchBar
          value={query}
          onChange={setQuery}
          onSubmit={runSearch}
          loading={loading}
        />

        <main className="main-content">
          {!hasSearched && (
            <div className="hint-text">
              <p>
                Type a detailed description of what you're looking for and press Enter or
                click Search.
              </p>
              <p>
                For example: "black fitted midi dress with square neckline, minimal, no
                cutouts"
              </p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Searching for your perfect match...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && results.length === 0 && hasSearched && (
            <div className="empty-state">
              <p>No matches found. Try adjusting your description.</p>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="results-grid">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
EOF

# src/components/SearchBar.tsx
cat > src/components/SearchBar.tsx << 'EOF'
import React from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function SearchBar({ value, onChange, onSubmit, loading }: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit();
    }
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-input"
        placeholder="Describe what you're looking for (e.g., 'black fitted midi dress with square neckline, minimal, no cutouts')"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
      />
      <button
        className="search-button"
        onClick={onSubmit}
        disabled={loading || value.trim().length < 3}
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </div>
  );
}
EOF

# src/components/ProductCard.tsx
cat > src/components/ProductCard.tsx << 'EOF'
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return "Price on request";

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD"
    });

    return formatter.format(price);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="product-image"
          loading="lazy"
        />
      </div>
      <div className="product-info">
        <p className="product-brand">{product.brand}</p>
        <h3 className="product-title">{product.title}</h3>
        <p className="product-description">{product.description}</p>
        <p className="product-price">{formatPrice(product.price, product.currency)}</p>
        <a
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="product-link"
        >
          View Product
        </a>
      </div>
    </div>
  );
}
EOF

# src/hooks/useSearch.ts
cat > src/hooks/useSearch.ts << 'EOF'
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
EOF

# src/lib/api.ts
cat > src/lib/api.ts << 'EOF'
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
EOF

# src/lib/embeddings.ts
cat > src/lib/embeddings.ts << 'EOF'
/**
 * Generate text embeddings using OpenAI's text-embedding-3-small model
 */
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI embedding error: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  const embedding = json.data[0]?.embedding;
  if (!embedding) {
    throw new Error("No embedding returned from OpenAI");
  }

  return embedding;
}
EOF