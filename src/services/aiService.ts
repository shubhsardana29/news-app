import { News } from '../models/types';

export const getAiAnswer = async (question: string, news: News): Promise<string> => {
  // Implement your AI service here
  // This is a placeholder implementation
  return `AI answer for "${question}" based on news: ${news.title}`;
};