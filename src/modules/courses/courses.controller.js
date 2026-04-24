import pool from '../../config/database.js';

export const getAllCourses = async (req, res, next) => {
    try {
        const [courses] = await pool.execute(`
            SELECT c.*, 
                   CONCAT(u.first_name, ' ', u.last_name) as instructor_name,
                   (c.capacity - c.enrolled_count) as available_seats
            FROM courses c
            LEFT JOIN instructors i ON c.instructor_id = i.id
            LEFT JOIN users u ON i.user_id = u.id
            WHERE c.is_active = TRUE
        `);
        res.json(courses);
    } catch (error) {
        next(error);
    }
};

export const getCourseById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const [courses] = await pool.execute(`
            SELECT c.*, 
                   CONCAT(u.first_name, ' ', u.last_name) as instructor_name,
                   (c.capacity - c.enrolled_count) as available_seats
            FROM courses c
            LEFT JOIN instructors i ON c.instructor_id = i.id
            LEFT JOIN users u ON i.user_id = u.id
            WHERE c.id = ? AND c.is_active = TRUE
        `, [id]);
        
        if (courses.length === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        res.json(courses[0]);
    } catch (error) {
        next(error);
    }
};

export const createCourse = async (req, res, next) => {
    try {
        const { courseCode, title, description, credits, capacity, semester, year, prerequisiteCourseId } = req.body;
        
        const [result] = await pool.execute(
            `INSERT INTO courses (course_code, title, description, credits, capacity, semester, year, prerequisite_course_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [courseCode, title, description, credits, capacity, semester, year, prerequisiteCourseId || null]
        );
        
        res.status(201).json({
            message: 'Course created successfully',
            courseId: result.insertId
        });
    } catch (error) {
        next(error);
    }
};

export const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, credits, capacity, semester, year } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE courses SET title = ?, description = ?, credits = ?, capacity = ?, semester = ?, year = ? WHERE id = ?',
            [title, description, credits, capacity, semester, year, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        res.json({ message: 'Course updated successfully' });
    } catch (error) {
        next(error);
    }
};

export const deleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.execute('UPDATE courses SET is_active = FALSE WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Course not found' });
        }
        
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        next(error);
    }
};

export const assignInstructor = async (req, res, next) => {
    try {
        const { courseId, instructorId } = req.body;
        
        await pool.execute(
            'UPDATE courses SET instructor_id = ? WHERE id = ?',
            [instructorId, courseId]
        );
        
        res.json({ message: 'Instructor assigned successfully' });
    } catch (error) {
        next(error);
    }
};