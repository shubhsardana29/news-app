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

// New routes with JWT in path
router.post('/:groupId/user/:jwtToken/follow', groupController.followGroupWithToken);
router.post('/:groupId/user/:jwtToken/unfollow', groupController.unfollowGroupWithToken);

export default router;