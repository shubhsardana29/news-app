"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
var express_1 = require("express");
var client_1 = require("@prisma/client");
var newsRoutes_1 = require("./src/routes/newsRoutes");
var authRoutes_1 = require("./src/routes/authRoutes");
var config_1 = require("./src/config/config");
var app = (0, express_1.default)();
exports.prisma = new client_1.PrismaClient();
app.use(express_1.default.json());
app.use('/api/auth', authRoutes_1.default);
app.use('/api', newsRoutes_1.default);
app.listen(config_1.config.port, function () {
    console.log("Server is running on port ".concat(config_1.config.port));
});
