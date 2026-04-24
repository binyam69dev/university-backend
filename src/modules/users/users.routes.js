import express from 'express';
import { getAllUsers, createUser } from './users.controller.js';
import { authenticate, authorize } from '../../middlewares/auth.js';
import { validate, schemas } from '../../middlewares/validation.js';

const router = express.Router();

router.get('/', authenticate, authorize('admin'), getAllUsers);
router.post('/', authenticate, authorize('admin'), validate(schemas.createUser), createUser);

export default router;