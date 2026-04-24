import bcrypt from 'bcrypt';
import pool from '../../config/database.js';

export const getAllUsers = async (req, res, next) => {
    try {
        const [users] = await pool.execute(
            'SELECT id, email, role, first_name, last_name, is_active, created_at FROM users'
        );
        res.json(users);
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req, res, next) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { email, password, role, firstName, lastName } = req.body;
        
        // Check if this is the first user (no users exist yet)
        const [existingUsers] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const isFirstUser = existingUsers[0].count === 0;
        
        // If not first user and not authenticated, deny access
        if (!isFirstUser && !req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // If not first user, check admin role
        if (!isFirstUser && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        
        const [result] = await connection.execute(
            'INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, role, firstName, lastName]
        );
        
        // Create role-specific record
        if (role === 'student') {
            const studentId = `STU${Date.now()}`;
            await connection.execute(
                'INSERT INTO students (user_id, student_id, enrollment_date) VALUES (?, ?, CURDATE())',
                [result.insertId, studentId]
            );
        } else if (role === 'instructor') {
            const instructorId = `INS${Date.now()}`;
            await connection.execute(
                'INSERT INTO instructors (user_id, instructor_id, hire_date) VALUES (?, ?, CURDATE())',
                [result.insertId, instructorId]
            );
        }
        
        await connection.commit();
        
        res.status(201).json({
            message: 'User created successfully',
            userId: result.insertId
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

export const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [users] = await pool.execute(
            'SELECT id, email, role, first_name, last_name, is_active, created_at FROM users WHERE id = ?',
            [id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(users[0]);
    } catch (error) {
        next(error);
    }
};

export const updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, isActive } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE users SET first_name = ?, last_name = ?, is_active = ? WHERE id = ?',
            [firstName, lastName, isActive, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
};