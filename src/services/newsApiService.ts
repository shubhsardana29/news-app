import axios from 'axios';
import { NewsApiResponse } from '../models/types';
import { config } from '../config/config';

export const fetchNewsFromApi = async (): Promise<NewsApiResponse> => {
  const response = await axios.get(config.newsApiUrl, {
    params: {
      q: 'india', // You can modify this query as needed
      apiKey: config.newsApiKey
    }
  });
  return response.data;
};