import { Request, Response, NextFunction } from 'express';
import { prisma } from '../app';

export const addGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const newGroup = await prisma.group.create({
      data: {
        name,
        description
      }
    });

    res.status(201).json(newGroup);
  } catch (error) {
    next(error);
  }
};

export const getAllGroups = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groups = await prisma.group.findMany();
    res.json(groups);
  } catch (error) {
    next(error);
  }
};

export const updateGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const updatedGroup = await prisma.group.update({
      where: { id },
      data: { name, description }
    });

    res.json(updatedGroup);
  } catch (error) {
    next(error);
  }
};

export const deleteGroup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.group.delete({
      where: { id }
    });

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    next(error);
  }
};