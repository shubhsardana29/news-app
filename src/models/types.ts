export interface News {
  newsId: string;
  newsTitle: string;
  newsContent: string | null;
  datePublished: Date;
  sourceName: string;
  sourceUrl: string;
  newsImageURL: string;
  groupId: string;
  groupName: string;
  description: string | null;
  author: string | null;
  isUserSubscribedToGroup: boolean;
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