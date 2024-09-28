export interface News {
    id: string;
    title: string;
    description: string | null;
    content: string | null;
    author: string | null;
    sourceId: string | null;
    sourceName: string | null;
    url: string;
    urlToImage: string | null;
    publishedAt: Date;
  }
  
  export interface Group {
    id: string;
    name: string;
    description: string | null;
  }
  
  export interface NewsApiResponse {
    status: string;
    totalResults: number;
    articles: Array<{
      source: {
        id: string | null;
        name: string | null;
      };
      author: string;
      title: string;
      description: string;
      url: string;
      urlToImage: string;
      publishedAt: string;
      content: string;
    }>;
  }