import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Security middleware
import helmet from 'helmet';
import { cspHeaders, auditLog, sanitizeInput, roleRateLimiter } from './middlewares/security.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Import all modules (only existing ones for now)
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/users.routes.js';
import courseRoutes from './modules/courses/courses.routes.js';
import enrollmentRoutes from './modules/enrollments/enrollments.routes.js';
import gradeRoutes from './modules/grades/grades.routes.js';

// Database & Redis
import pool, { testConnection } from './config/database.js';
import redisClient from './config/redis.js';

// Services
import logger from './utils/logger.js';

dotenv.config();

const app = express();

// Global middleware
app.use(helmet());
app.use(cspHeaders);
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(auditLog);

// Rate limiting by role
app.use('/api/v1/users', roleRateLimiter('admin', 100, 15 * 60 * 1000));
app.use('/api/v1/enrollments', roleRateLimiter('student', 50, 15 * 60 * 1000));
app.use('/api/v1/grades', roleRateLimiter('instructor', 200, 15 * 60 * 1000));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);
app.use('/api/v1/grades', gradeRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date(),
        uptime: process.uptime(),
        version: '2.0.0',
        services: {
            database: pool ? 'connected' : 'disconnected',
            redis: redisClient.isConnected ? 'connected' : 'disconnected'
        }
    });
});

// Error handling
app.use(errorHandler);

// Export app for server.js
export default app;