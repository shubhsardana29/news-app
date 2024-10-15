import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';
import { fetchNewsFromApi } from '../services/newsApiService';
import { analyzeNewsContent } from '../services/geminiService';
import { PagingData, paginate } from '../utils/pagingUtils';
import { Group, News } from '../models/types';

interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

export const getNews = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.user?.id;

    console.log('Fetching news from API');
    const apiResponse = await fetchNewsFromApi();
    console.log(`Received ${apiResponse.articles.length} articles from API`);

    const processedNews = [];

    for (const article of apiResponse.articles) {
      console.log(`Processing article: ${article.title}`);
      let news = await prisma.news.findUnique({ where: { url: article.url } });

      if (!news) {
        console.log('Creating new news entry');
        news = await prisma.news.create({
          data: {
            title: article.title,
            description: article.description,
            content: article.content,
            author: article.author,
            sourceId: article.source.id || 'unknown',
            sourceName: article.source.name,
            url: article.url,
            urlToImage: article.urlToImage,
            publishedAt: new Date(article.publishedAt)
          }
        });

        console.log('Analyzing news content for groups');
        const suggestedGroups = await analyzeNewsContent(article.title, article.content, article.description);
        console.log('Suggested groups:', suggestedGroups);

        const associatedGroupIds = new Set<string>(); // Use a Set to avoid duplicates

        for (const group of suggestedGroups) {
          console.log(`Processing group: ${group.name}`);
          let existingGroup = await prisma.group.findFirst({
            where: { name: group.name }
          });

          if (!existingGroup) {
            console.log(`Creating new group: ${group.name}`);
            existingGroup = await prisma.group.create({
              data: {
                name: group.name,
                description: group.description
              }
            });
          }

          // Add group ID to the set for later association
          associatedGroupIds.add(existingGroup.id);

          // Check if the news is already associated with this group
          const existingAssociation = await prisma.groupNews.findUnique({
            where: {
              groupId_newsId: {
                groupId: existingGroup.id,
                newsId: news.id,
              }
            }
          });

          if (!existingAssociation) {
            console.log(`Associating news with group: ${existingGroup.name}`);
            await prisma.groupNews.create({
              data: {
                newsId: news.id,
                groupId: existingGroup.id
              }
            });
          } else {
            console.log(`News is already associated with group: ${existingGroup.name}`);
          }
        }

        // Associate the news with already existing groups for similar content
        for (const groupId of associatedGroupIds) {
          const existingGroupNews = await prisma.groupNews.findMany({
            where: { groupId }
          });

          if (existingGroupNews.length) {
            console.log(`Associating news with already existing group: ${groupId}`);
            const existingAssociation = await prisma.groupNews.findUnique({
              where: {
                groupId_newsId: {
                  groupId: groupId,
                  newsId: news.id,
                }
              }
            });

            if (!existingAssociation) {
              await prisma.groupNews.create({
                data: {
                  newsId: news.id,
                  groupId: groupId
                }
              });
            }
          }
        }
      }

      console.log(`Retrieving news with groups for: ${news.title}`);
      const newsWithGroups = await prisma.news.findUnique({
        where: { id: news.id },
        include: {
          groups: {
            include: {
              group: true
            }
          }
        }
      });

      console.log(`Groups for ${news.title}:`, newsWithGroups?.groups);

      const formattedNews = {
        newsId: news.id,
        newsTitle: news.title,
        newsContent: news.content,
        datePublished: news.publishedAt,
        sourceName: news.sourceName,
        sourceUrl: news.url,
        newsImageURL: news.urlToImage,
        groups: newsWithGroups?.groups.map(groupNews => ({
          groupId: groupNews.group.id,
          groupName: groupNews.group.name,
          isUserSubscribedToGroup: false
        })) || [],
        description: news.description,
        author: news.author
      };

      if (userId) {
        console.log(`Checking user subscriptions for user: ${userId}`);
        const userSubscriptions = await prisma.userGroup.findMany({
          where: {
            userId: userId,
            groupId: {
              in: formattedNews.groups.map(g => g.groupId)
            }
          }
        });

        formattedNews.groups = formattedNews.groups.map(group => ({
          ...group,
          isUserSubscribedToGroup: userSubscriptions.some(sub => sub.groupId === group.groupId)
        }));
      }

      processedNews.push(formattedNews);
    }

    const total = await prisma.news.count();
    const paginatedNews = paginate(processedNews, page, limit, total);

    console.log(`Sending response with ${processedNews.length} processed news items`);
    res.json(paginatedNews);
  } catch (error) {
    console.error('Error in getNews:', error);
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