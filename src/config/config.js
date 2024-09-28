"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    jwtSecret: process.env.JWT_SECRET,
    newsApiKey: process.env.NEWS_API_KEY,
    newsApiUrl: process.env.NEWS_API_URL,
    port: process.env.PORT || 3000,
};
