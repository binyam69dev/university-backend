import express from 'express';
import { login, logout } from './auth.controller.js';
import { validate, schemas } from '../../middlewares/validation.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/login', validate(schemas.login), login);
router.post('/logout', authenticate, logout);

export default router;