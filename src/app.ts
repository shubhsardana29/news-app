import express from 'express';
import { PrismaClient } from '@prisma/client';
import newsRoutes from './routes/newsRoutes';
import authRoutes from './routes/authRoutes';
import { config } from './config/config';

const app = express();
export const prisma = new PrismaClient();

app.use(express.json());
app.get('/', (req, res) => {
  res.send('Server is running...., FUCK YOU motherboard ');
});

app.use('/api/auth', authRoutes);
app.use('/api', newsRoutes);

app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});
