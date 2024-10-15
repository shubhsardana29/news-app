import express from 'express';
import * as groupController from '../controllers/groupController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/add', authMiddleware, (req, res, next) => {
  groupController.addGroup(req, res, next).catch(next);
});
router.get('/all', (req, res, next) => {
  groupController.getAllGroups(req, res, next).catch(next);
});
router.put('/:id', authMiddleware, (req, res, next) => {
  groupController.updateGroup(req, res, next).catch(next);
});
router.delete('/:id', authMiddleware, (req, res, next) => {
  groupController.deleteGroup(req, res, next).catch(next);
});

export default router;