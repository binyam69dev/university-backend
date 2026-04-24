import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../config/database.js';
import logger from '../../utils/logger.js';

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
            [email]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        
        await pool.execute(
            'INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [user.id, 'LOGIN_SUCCESS', req.ip]
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.first_name,
                lastName: user.last_name
            }
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        await pool.execute(
            'INSERT INTO audit_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
            [req.user.id, 'LOGOUT', req.ip]
        );
        
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};