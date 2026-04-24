import express from 'express';
import { updateGrade } from './grades.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate, schemas } from '../../middlewares/validation.js';

const router = express.Router();

router.put('/:id', authenticate, authorize('instructor'), validate(schemas.updateGrade), updateGrade);

export default router;