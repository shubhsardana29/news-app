import express from 'express';
import * as authController from '../controllers/authController';

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.get('/getUserFromGoogleToken', authController.getUserFromGoogleToken);


export default router;