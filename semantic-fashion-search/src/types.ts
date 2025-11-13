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
