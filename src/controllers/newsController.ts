import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';
import { fetchNewsFromApi } from '../services/newsApiService';
import { getAiAnswer } from '../services/aiService';
import { PagingData, paginate } from '../utils/pagingUtils';
import { News, Group } from '../models/types';
import { analyzeNewsContent } from '../services/geminiService';

interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

export const getNews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 5;
    const userId = req.user?.id;

    const apiResponse = await fetchNewsFromApi();
    
    // Store news in the database and analyze with Gemini
    for (const article of apiResponse.articles) {
      const news = await prisma.news.upsert({
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

      // Analyze and group the news
      const suggestedGroups = await analyzeNewsContent(
        article.title,
        article.content,
        article.description,
      );
      
      for (const group of suggestedGroups) {
        let existingGroup = await prisma.group.findFirst({
          where: { name: group.name }
        });

        if (!existingGroup) {
          existingGroup = await prisma.group.create({
            data: {
              name: group.name,
              description: group.description,
            }
          });
        }

        await prisma.groupNews.create({
          data: {
            newsId: news.id,
            groupId: existingGroup.id
          }
        });
      }
    }

    const news = await prisma.news.findMany({
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { publishedAt: 'desc' },
      include: {
        groups: {
          include: {
            group: {
              include: {
                users: {
                  where: {
                    userId: userId
                  }
                }
              }
            }
          }
        }
      }
    });

    const formattedNews = news.map(item => ({
      newsId: item.id,
      newsTitle: item.title,
      newsContent: item.content || '',
      datePublished: item.publishedAt,
      sourceName: item.sourceName || '',
      sourceUrl: item.url,
      newsImageURL: item.urlToImage || '',
      groupId: item.groups[0]?.group.id || '',
      groupName: item.groups[0]?.group.name || '',
      isUserSubscribedToGroup: item.groups[0]?.group.users.length > 0,
      description: item.description,
      author: item.author
    }));

    const total = await prisma.news.count();
    const paginatedNews: PagingData<News> = paginate(formattedNews, page, limit, total);

    res.json(paginatedNews);
  } catch (error) {
    next(error);
  }
};

export const getTimeline = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { newsId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 50;
    const userId = req.user?.id;

    const groupNews = await prisma.groupNews.findFirst({
      where: { newsId },
      include: { group: true }
    });

    if (!groupNews) {
      return res.status(404).json({ error: 'News not found in any group' });
    }

    const news = await prisma.news.findMany({
      where: {
        groups: {
          some: {
            groupId: groupNews.groupId
          }
        }
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { publishedAt: 'desc' },
      include: {
        groups: {
          include: {
            group: {
              include: {
                users: {
                  where: {
                    userId: userId
                  }
                }
              }
            }
          }
        }
      }
    });

    const formattedNews = news.map(item => ({
      newsId: item.id,
      newsTitle: item.title,
      newsContent: item.content || '',
      datePublished: item.publishedAt,
      sourceName: item.sourceName || '',
      sourceUrl: item.url,
      newsImageURL: item.urlToImage || '',
      groupId: groupNews.groupId,
      groupName: groupNews.group.name,
      isUserSubscribedToGroup: item.groups[0]?.group.users.length > 0,
      description: item.description,
      author: item.author
    }));

    const total = await prisma.groupNews.count({ where: { groupId: groupNews.groupId } });
    const paginatedNews: PagingData<News> = paginate(formattedNews, page, limit, total);

    res.json(paginatedNews);
  } catch (error) {
    next(error);
  }
};

export const getNewsById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { newsId } = req.params;
    const userId = req.user?.id;

    const news = await prisma.news.findUnique({
      where: { id: newsId },
      include: {
        groups: {
          include: {
            group: {
              include: {
                users: {
                  where: {
                    userId: userId
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    const formattedNews = {
      newsId: news.id,
      newsTitle: news.title,
      newsContent: news.content || '',
      datePublished: news.publishedAt.toISOString(),
      sourceName: news.sourceName || '',
      sourceUrl: news.url,
      newsImageURL: news.urlToImage || '',
      groupId: news.groups[0]?.group.id || '',
      groupName: news.groups[0]?.group.name || '',
      isUserSubscribedToGroup: news.groups[0]?.group.users.length > 0
    };

    res.json(formattedNews);
  } catch (error) {
    next(error);
  }
};

// export const getAiAnswerForNews = async (req: AuthRequest, res: Response, next: NextFunction) => {
//   try {
//     const { userQuestion, newsId } = req.params;

//     const news = await prisma.news.findUnique({ where: { id: newsId } });
//     if (!news) {
//       return res.status(404).json({ error: 'News not found' });
//     }

//     const answer = await getAiAnswer(userQuestion, news);
//     res.json({ answer });
//   } catch (error) {
//     next(error);
//   }
// };

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

    const groups = userGroups.map(ug => ({
      id: ug.group.id,
      name: ug.group.name,
      description: ug.group.description
    }));
    const total = await prisma.userGroup.count({ where: { userId } });
    const paginatedGroups: PagingData<Group> = paginate(groups, page, limit, total);

    res.json(paginatedGroups);
  } catch (error) {
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
    next(error);
  }
};