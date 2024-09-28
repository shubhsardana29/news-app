import { Request, Response , NextFunction } from 'express';
import { prisma } from '../index';
import { fetchNewsFromApi } from '../services/newsApiService';
import { getAiAnswer } from '../services/aiService';
import { PagingData, paginate } from '../utils/pagingUtils';
import { News, Group } from '../models/types';

interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

export const getNews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 5;

    const apiResponse = await fetchNewsFromApi();
    
    // Store news in the database
    for (const article of apiResponse.articles) {
      await prisma.news.upsert({
        where: { url: article.url },
        update: {
          title: article.title,
          description: article.description,
          content: article.content,
          author: article.author,
          sourceId: article.source.id || 'unknown',
          sourceName: article.source.name || 'unknown',
          urlToImage: article.urlToImage,
          publishedAt: new Date(article.publishedAt)
        },
        create: {
          title: article.title,
          description: article.description,
          content: article.content,
          author: article.author,
          sourceId: article.source.id || 'unknown',
          sourceName: article.source.name || 'unknown',
          url: article.url,
          urlToImage: article.urlToImage,
          publishedAt: new Date(article.publishedAt)
        }
      });
    }

    const news = await prisma.news.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { publishedAt: 'desc' }
    });

    const total = await prisma.news.count();
    const paginatedNews: PagingData<News> = paginate(news, page, limit, total);

    res.json(paginatedNews);
  } catch (error) {
      res.status(500).json({ error: 'An error occurred while fetching news' });
      next(error);
  }
};

export const getTimeline = async (req: AuthRequest, res: Response , next: NextFunction) => {
  try {
    const { newsId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;

    const groupNews = await prisma.groupNews.findFirst({
      where: { newsId },
      include: { group: true }
    });

    if (!groupNews) {
      return res.status(404).json({ error: 'News not found in any group' });
    }

    const newsIds = await prisma.groupNews.findMany({
      where: { groupId: groupNews.groupId },
      select: { newsId: true }
    });

    const news = await prisma.news.findMany({
      where: { id: { in: newsIds.map((n: { newsId: any; }) => n.newsId) } },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { publishedAt: 'desc' }
    });

    const total = await prisma.groupNews.count({ where: { groupId: groupNews.groupId } });
    const paginatedNews: PagingData<News> = paginate(news, page, limit, total);

    res.json(paginatedNews);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching the timeline' });
    next(error);
  }
};

export const getAiAnswerForNews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userQuestion, newsId } = req.params;

    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    const answer = await getAiAnswer(userQuestion, news);
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while getting AI answer' });
    next(error);
  }
};

export const getFollowUp = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;

    const userGroups = await prisma.userGroup.findMany({
      where: { userId },
      include: { group: true },
      take: limit,
      skip: (page - 1) * limit
    });

    const groups = userGroups.map((ug: { group: any; }) => ug.group);
    const total = await prisma.userGroup.count({ where: { userId } });
    const paginatedGroups: PagingData<Group> = paginate(groups, page, limit, total);

    res.json(paginatedGroups);
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching follow-up groups' });
    next(error);
  }
};

export const getAllSides = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { newsId } = req.params;
    // This is a placeholder implementation. You'll need to implement the logic to determine left, right, and center based on your criteria.
    const leftNews = await prisma.news.findFirst({ where: { /* left criteria */ } });
    const rightNews = await prisma.news.findFirst({ where: { /* right criteria */ } });
    const centerNews = await prisma.news.findFirst({ where: { /* center criteria */ } });

    res.json({ left: leftNews, right: rightNews, center: centerNews });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while fetching all sides' });
    next(error);
  }
};