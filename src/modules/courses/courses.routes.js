import express from 'express';
import { getAllCourses, createCourse, assignInstructor } from './courses.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate, schemas } from '../../middlewares/validation.js';

const router = express.Router();

router.get('/', authenticate, getAllCourses);
router.post('/', authenticate, authorize('admin'), validate(schemas.createCourse), createCourse);
router.post('/assign-instructor', authenticate, authorize('admin'), assignInstructor);

export default router;