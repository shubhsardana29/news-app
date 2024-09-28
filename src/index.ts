import express from 'express';
import { PrismaClient } from '@prisma/client';
import newsRoutes from './routes/newsRoutes';
import authRoutes from './routes/authRoutes';
import { config } from './config/config';

const index = express();
export const prisma = new PrismaClient();

index.use(express.json());
index.use('/api/auth', authRoutes);
index.use('/api', newsRoutes);

index.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});