import { Request, Response, NextFunction } from 'express';
import jwt, {JwtPayload} from 'jsonwebtoken';
import { prisma } from '../app';
import { PagingData, paginate } from '../utils/pagingUtils';

interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

export const followGroupWithToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId, jwtToken } = req.params;

    // Verify JWT token
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(jwtToken, process.env.JWT_SECRET!) as JwtPayload;
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const userId = decoded.id;

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    // Check if already following
    const existingFollow = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: groupId
        }
      }
    });

    if (existingFollow) {
      res.status(400).json({ error: 'User already follows this group' });
      return;
    }

    // Create follow relationship
    await prisma.userGroup.create({
      data: {
        userId: userId,
        groupId: groupId
      }
    });

    res.json({
      success: true,
      message: 'Successfully followed the group',
      data: {
        userId: userId,
        groupId: groupId,
        groupName: group.name
      }
    });
  } catch (error) {
    console.error('Error in followGroupWithToken:', error);
    next(error);
  }
};

export const unfollowGroupWithToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId, jwtToken } = req.params;

    // Verify JWT token
    let decoded: jwt.JwtPayload;
    try {
      decoded = jwt.verify(jwtToken, process.env.JWT_SECRET!) as JwtPayload;
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const userId = decoded.id;

    // Delete the follow relationship
    const deletedFollow = await prisma.userGroup.delete({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: groupId
        }
      }
    }).catch(() => null);

    if (!deletedFollow) {
      res.status(404).json({ error: 'User was not following this group' });
      return;
    }

    res.json({
      success: true,
      message: 'Successfully unfollowed the group',
      data: {
        userId: userId,
        groupId: groupId
      }
    });
  } catch (error) {
    console.error('Error in unfollowGroupWithToken:', error);
    next(error);
  }
};

export const getGroups = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const groups = await prisma.group.findMany({
      take: limit,
      skip: (page - 1) * limit,
      include: {
        _count: {
          select: { news: true, users: true }
        }
      }
    });

    const formattedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      newsCount: group._count.news,
      followersCount: group._count.users
    }));

    const total = await prisma.group.count();
    const paginatedGroups: PagingData<any> = paginate(formattedGroups, page, limit, total);

    res.json(paginatedGroups);
  } catch (error) {
    next(error);
  }
};

export const getGroupById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        news: {
          include: { news: true },
          take: 5,
          orderBy: { news: { publishedAt: 'desc' } }
        },
        users: {
          where: { userId: userId },
          take: 1
        },
        _count: {
          select: { news: true, users: true }
        }
      }
    });

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    const formattedGroup = {
      id: group.id,
      name: group.name,
      description: group.description,
      newsCount: group._count.news,
      followersCount: group._count.users,
      isUserFollowing: group.users.length > 0,
      recentNews: group.news.map(gn => ({
        id: gn.news.id,
        title: gn.news.title,
        publishedAt: gn.news.publishedAt
      }))
    };

    res.json(formattedGroup);
  } catch (error) {
    next(error);
  }
};

export const followGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const existingFollow = await prisma.userGroup.findUnique({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: groupId
        }
      }
    });

    if (existingFollow) {
      res.status(400).json({ error: 'User already follows this group' });
      return;
    }

    await prisma.userGroup.create({
      data: {
        userId: userId,
        groupId: groupId
      }
    });

    res.json({ message: 'Successfully followed the group' });
  } catch (error) {
    next(error);
  }
};

export const unfollowGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const deletedFollow = await prisma.userGroup.delete({
      where: {
        userId_groupId: {
          userId: userId,
          groupId: groupId
        }
      }
    }).catch(() => null);

    if (!deletedFollow) {
      res.status(404).json({ error: 'User was not following this group' });
      return;
    }

    res.json({ message: 'Successfully unfollowed the group' });
  } catch (error) {
    next(error);
  }
};

export const getGroupNews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { groupId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const news = await prisma.news.findMany({
      where: {
        groups: {
          some: {
            groupId: groupId
          }
        }
      },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: { publishedAt: 'desc' }
    });

    const total = await prisma.groupNews.count({
      where: { groupId: groupId }
    });

    const paginatedNews: PagingData<any> = paginate(news, page, limit, total);

    res.json(paginatedNews);
  } catch (error) {
    next(error);
  }
};

export const createGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('Request body:', req.body);
    const { name, description } = req.body;

    if (!name) {
      console.log('Group name is missing');
      res.status(400).json({ error: 'Group name is required' });
      return;
    }

    console.log('Checking for existing group');
    const existingGroup = await prisma.group.findFirst({
      where: { name }
    });

    if (existingGroup) {
      console.log('Group already exists:', existingGroup);
      res.status(400).json({ error: 'A group with this name already exists' });
      return;
    }

    console.log('Creating new group');
    const newGroup = await prisma.group.create({
      data: {
        name,
        description
      }
    });

    console.log('New group created:', newGroup);
    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error in createGroup:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    next(error);
  }
};