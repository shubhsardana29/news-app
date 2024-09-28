"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var newsController = require("../controllers/newsController");
var authMiddleware_1 = require("../middleware/authMiddleware");
var router = express_1.default.Router();
router.get('/news', authMiddleware_1.optionalAuthMiddleware, function (req, res, next) {
    newsController.getNews(req, res, next).catch(next);
});
router.get('/timeline/:newsId', authMiddleware_1.optionalAuthMiddleware, function (req, res, next) {
    newsController.getTimeline(req, res, next).catch(next);
});
router.get('/getAiAnswer/:userQuestion/:newsId', authMiddleware_1.authMiddleware, function (req, res, next) {
    newsController.getAiAnswerForNews(req, res, next).catch(next);
});
router.get('/getFollowUp/:userId', authMiddleware_1.authMiddleware, function (req, res, next) {
    newsController.getFollowUp(req, res, next).catch(next);
});
router.get('/getAllSides/:newsId', authMiddleware_1.optionalAuthMiddleware, function (req, res, next) {
    newsController.getAllSides(req, res, next).catch(next);
});
exports.default = router;
