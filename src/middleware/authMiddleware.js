"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
var jsonwebtoken_1 = require("jsonwebtoken");
var config_1 = require("../config/config");
var authMiddleware = function (req, res, next) {
    var authHeader = req.headers.authorization;
    if (authHeader) {
        var token = authHeader.split(' ')[1];
        jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret, function (err, user) {
            if (err) {
                return res.sendStatus(403);
            }
            req.user = user;
            next();
        });
    }
    else {
        res.sendStatus(401);
    }
};
exports.authMiddleware = authMiddleware;
var optionalAuthMiddleware = function (req, res, next) {
    var authHeader = req.headers.authorization;
    if (authHeader) {
        var token = authHeader.split(' ')[1];
        jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret, function (err, user) {
            if (!err) {
                req.user = user;
            }
        });
    }
    next();
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
