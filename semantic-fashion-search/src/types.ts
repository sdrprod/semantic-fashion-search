export interface Product {
  id: string;
  imageUrl: string;
  brand: string;
  title: string;
  description: string;
  price: number | null;
  currency: string;
  productUrl: string;
  merchantName?: string; // Fallback when brand is Unknown
  onSale?: boolean; // Whether product has "sale" or "on sale" in text
}

export interface SearchResponse {
  query: string;
  results: Product[];
}
