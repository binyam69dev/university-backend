import pool from '../../config/database.js';

export const enrollInCourse = async (req, res, next) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // Get student ID - either from request body or from authenticated user
        const { courseId, studentId } = req.body;
        
        // If studentId not provided in body, use the authenticated user's ID
        let targetStudentId = studentId;
        
        if (!targetStudentId && req.user.role === 'student') {
            // Get student's database record ID from user_id
            const [students] = await connection.execute(
                'SELECT id FROM students WHERE user_id = ?',
                [req.user.id]
            );
            if (students.length === 0) {
                return res.status(404).json({ error: 'Student record not found' });
            }
            targetStudentId = students[0].id;
        } else if (targetStudentId) {
            // If studentId provided, verify it exists
            const [students] = await connection.execute(
                'SELECT id FROM students WHERE user_id = ?',
                [targetStudentId]
            );
            if (students.length === 0) {
                return res.status(404).json({ error: 'Student record not found' });
            }
            targetStudentId = students[0].id;
        } else {
            return res.status(400).json({ error: 'Student ID or authentication required' });
        }
        
        // Validate courseId
        if (!courseId) {
            return res.status(400).json({ error: 'Course ID is required' });
        }
        
        // Check if course exists and is active
        const [courses] = await connection.execute(
            'SELECT capacity, enrolled_count FROM courses WHERE id = ? AND is_active = TRUE',
            [courseId]
        );
        
        if (courses.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        const course = courses[0];
        
        // Check capacity
        if (course.enrolled_count >= course.capacity) {
            return res.status(400).json({ error: 'Course is full' });
        }
        
        // Check if already enrolled
        const [existing] = await connection.execute(
            'SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
            [targetStudentId, courseId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Student already enrolled in this course' });
        }
        
        // Create enrollment
        await connection.execute(
            'INSERT INTO enrollments (student_id, course_id, status) VALUES (?, ?, ?)',
            [targetStudentId, courseId, 'enrolled']
        );
        
        // Update enrolled count
        await connection.execute(
            'UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = ?',
            [courseId]
        );
        
        await connection.commit();
        
        res.status(201).json({ 
            message: 'Student enrolled successfully',
            enrollment: { studentId: targetStudentId, courseId }
        });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};