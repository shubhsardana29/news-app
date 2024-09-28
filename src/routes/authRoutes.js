"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var authController = require("../controllers/authController");
var router = express_1.default.Router();
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
exports.default = router;
