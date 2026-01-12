// Product types
export interface Product {
  id: string;
  imageUrl: string;
  brand: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  productUrl: string;
  tags?: string[];
  similarity?: number;
  affiliateNetwork?: string;
  merchantId?: string;
  merchantName?: string; // Fallback when brand is Unknown
  onSale?: boolean; // Whether product has "sale" or "on sale" in text
}

// Search types
export interface SearchResponse {
  query: string;
  results: Product[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  intent?: ParsedIntent;
  qualityWarning?: string; // Message when search results aren't ideal quality
}

export interface SearchParams {
  query: string;
  limit?: number;
  page?: number;
  filters?: SearchFilters;
}

export interface SearchFilters {
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  categories?: string[];
}

// Intent extraction types
export interface ParsedIntent {
  occasion?: string;
  style?: string[];
  constraints?: string[];
  primaryItem?: string;
  secondaryItems?: string[];
  searchQueries: SearchQuery[];
  explanation?: string;
}

export interface SearchQuery {
  query: string;
  category: string;
  priority: number;
  weight: number;
}

// Admin types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
}

export interface SearchSettings {
  id: string;
  similarityThreshold: number;
  diversityFactor: number;
  categoryWeights: Record<string, number>;
  brandBoosts: Record<string, number>;
  defaultPageSize: number;
  maxPageSize: number;
  updatedAt: string;
  updatedBy: string;
}

// Pagination types
export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Affiliate types
export interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  price: number | undefined;
  currency: string;
  imageUrl: string;
  productUrl: string;
  brand: string;
  category: string;
  merchantName: string;
  merchantId: string;
  affiliateNetwork: 'impact' | 'cj' | 'other';
  commissionRate?: number;
  inStock: boolean;
  lastUpdated: string;
}

// Email subscriber types
export interface EmailSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  preferences?: {
    newArrivals: boolean;
    sales: boolean;
    recommendations: boolean;
  };
}
