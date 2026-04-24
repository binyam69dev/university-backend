import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const [users] = await pool.execute(
            'SELECT id, email, role FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'User not found or inactive' });
        }

        req.user = users[0];
        next();
    } catch (error) {
        logger.error('Authentication error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};