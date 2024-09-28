import express from 'express';
import * as newsController from '../controllers/newsController';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
router.get('/news', optionalAuthMiddleware, (req, res, next) => {
  newsController.getNews(req, res, next).catch(next);
});
router.get('/timeline/:newsId', optionalAuthMiddleware, (req, res, next) => {
  newsController.getTimeline(req, res, next).catch(next);
});
router.get('/getAiAnswer/:userQuestion/:newsId', authMiddleware, (req, res, next) => {
  newsController.getAiAnswerForNews(req, res, next).catch(next);
});
router.get('/getFollowUp/:userId', authMiddleware, (req, res, next) => {
  newsController.getFollowUp(req, res, next).catch(next);
});
router.get('/getAllSides/:newsId', optionalAuthMiddleware, (req, res, next) => {
  newsController.getAllSides(req, res, next).catch(next);
});

export default router;