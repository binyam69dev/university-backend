import express from 'express';
import { enrollInCourse } from './enrollments.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router();

router.post('/', authenticate, enrollInCourse);

export default router;