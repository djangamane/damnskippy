export interface SearchResult {
  type: 'free' | 'diy' | 'premium';
  title: string;
  description: string;
  source?: string;
  url?: string;
  price?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}