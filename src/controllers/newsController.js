"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllSides = exports.getFollowUp = exports.getAiAnswerForNews = exports.getTimeline = exports.getNews = void 0;
var app_1 = require("../../app");
var newsApiService_1 = require("../services/newsApiService");
var aiService_1 = require("../services/aiService");
var pagingUtils_1 = require("../utils/pagingUtils");
var getNews = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, apiResponse, _i, _a, article, news, total, paginatedNews, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 8, , 9]);
                page = parseInt(req.query.page) || 1;
                limit = 5;
                return [4 /*yield*/, (0, newsApiService_1.fetchNewsFromApi)()];
            case 1:
                apiResponse = _b.sent();
                _i = 0, _a = apiResponse.articles;
                _b.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 5];
                article = _a[_i];
                return [4 /*yield*/, app_1.prisma.news.upsert({
                        where: { url: article.url },
                        update: {
                            title: article.title,
                            description: article.description,
                            content: article.content,
                            author: article.author,
                            sourceId: article.source.id || 'unknown',
                            sourceName: article.source.name || 'unknown',
                            urlToImage: article.urlToImage,
                            publishedAt: new Date(article.publishedAt)
                        },
                        create: {
                            title: article.title,
                            description: article.description,
                            content: article.content,
                            author: article.author,
                            sourceId: article.source.id || 'unknown',
                            sourceName: article.source.name || 'unknown',
                            url: article.url,
                            urlToImage: article.urlToImage,
                            publishedAt: new Date(article.publishedAt)
                        }
                    })];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [4 /*yield*/, app_1.prisma.news.findMany({
                    take: limit,
                    skip: (page - 1) * limit,
                    orderBy: { publishedAt: 'desc' }
                })];
            case 6:
                news = _b.sent();
                return [4 /*yield*/, app_1.prisma.news.count()];
            case 7:
                total = _b.sent();
                paginatedNews = (0, pagingUtils_1.paginate)(news, page, limit, total);
                res.json(paginatedNews);
                return [3 /*break*/, 9];
            case 8:
                error_1 = _b.sent();
                res.status(500).json({ error: 'An error occurred while fetching news' });
                next(error_1);
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.getNews = getNews;
var getTimeline = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var newsId, page, limit, groupNews, newsIds, news, total, paginatedNews, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                newsId = req.params.newsId;
                page = parseInt(req.query.page) || 1;
                limit = 50;
                return [4 /*yield*/, app_1.prisma.groupNews.findFirst({
                        where: { newsId: newsId },
                        include: { group: true }
                    })];
            case 1:
                groupNews = _a.sent();
                if (!groupNews) {
                    return [2 /*return*/, res.status(404).json({ error: 'News not found in any group' })];
                }
                return [4 /*yield*/, app_1.prisma.groupNews.findMany({
                        where: { groupId: groupNews.groupId },
                        select: { newsId: true }
                    })];
            case 2:
                newsIds = _a.sent();
                return [4 /*yield*/, app_1.prisma.news.findMany({
                        where: { id: { in: newsIds.map(function (n) { return n.newsId; }) } },
                        take: limit,
                        skip: (page - 1) * limit,
                        orderBy: { publishedAt: 'desc' }
                    })];
            case 3:
                news = _a.sent();
                return [4 /*yield*/, app_1.prisma.groupNews.count({ where: { groupId: groupNews.groupId } })];
            case 4:
                total = _a.sent();
                paginatedNews = (0, pagingUtils_1.paginate)(news, page, limit, total);
                res.json(paginatedNews);
                return [3 /*break*/, 6];
            case 5:
                error_2 = _a.sent();
                res.status(500).json({ error: 'An error occurred while fetching the timeline' });
                next(error_2);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getTimeline = getTimeline;
var getAiAnswerForNews = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userQuestion, newsId, news, answer, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.params, userQuestion = _a.userQuestion, newsId = _a.newsId;
                return [4 /*yield*/, app_1.prisma.news.findUnique({ where: { id: newsId } })];
            case 1:
                news = _b.sent();
                if (!news) {
                    return [2 /*return*/, res.status(404).json({ error: 'News not found' })];
                }
                return [4 /*yield*/, (0, aiService_1.getAiAnswer)(userQuestion, news)];
            case 2:
                answer = _b.sent();
                res.json({ answer: answer });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                res.status(500).json({ error: 'An error occurred while getting AI answer' });
                next(error_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAiAnswerForNews = getAiAnswerForNews;
var getFollowUp = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, page, limit, userGroups, groups, total, paginatedGroups, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.id;
                page = parseInt(req.query.page) || 1;
                limit = 50;
                return [4 /*yield*/, app_1.prisma.userGroup.findMany({
                        where: { userId: userId },
                        include: { group: true },
                        take: limit,
                        skip: (page - 1) * limit
                    })];
            case 1:
                userGroups = _a.sent();
                groups = userGroups.map(function (ug) { return ug.group; });
                return [4 /*yield*/, app_1.prisma.userGroup.count({ where: { userId: userId } })];
            case 2:
                total = _a.sent();
                paginatedGroups = (0, pagingUtils_1.paginate)(groups, page, limit, total);
                res.json(paginatedGroups);
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                res.status(500).json({ error: 'An error occurred while fetching follow-up groups' });
                next(error_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getFollowUp = getFollowUp;
var getAllSides = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var newsId, leftNews, rightNews, centerNews, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                newsId = req.params.newsId;
                return [4 /*yield*/, app_1.prisma.news.findFirst({ where: { /* left criteria */} })];
            case 1:
                leftNews = _a.sent();
                return [4 /*yield*/, app_1.prisma.news.findFirst({ where: { /* right criteria */} })];
            case 2:
                rightNews = _a.sent();
                return [4 /*yield*/, app_1.prisma.news.findFirst({ where: { /* center criteria */} })];
            case 3:
                centerNews = _a.sent();
                res.json({ left: leftNews, right: rightNews, center: centerNews });
                return [3 /*break*/, 5];
            case 4:
                error_5 = _a.sent();
                res.status(500).json({ error: 'An error occurred while fetching all sides' });
                next(error_5);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getAllSides = getAllSides;
