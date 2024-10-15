import express from 'express';
import * as groupController from '../controllers/groupController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/', groupController.getGroups);
router.post('/', authMiddleware, groupController.createGroup);
router.get('/:groupId', groupController.getGroupById);
router.post('/:groupId/follow', authMiddleware, groupController.followGroup);
router.post('/:groupId/unfollow', authMiddleware, groupController.unfollowGroup);
router.get('/:groupId/news', groupController.getGroupNews);

export default router;