import pool from '../../config/database.js';

const calculateLetterGrade = (score) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
};

const updateStudentGPA = async (connection, studentId) => {
    const [grades] = await connection.execute(`
        SELECT g.score, c.credits
        FROM grades g
        JOIN enrollments e ON g.enrollment_id = e.id
        JOIN courses c ON e.course_id = c.id
        WHERE e.student_id = ? AND e.status = 'completed' AND g.score IS NOT NULL
    `, [studentId]);
    
    if (grades.length === 0) return;
    
    let totalPoints = 0;
    let totalCredits = 0;
    
    grades.forEach(grade => {
        let gradePoint = 0;
        if (grade.score >= 90) gradePoint = 4.0;
        else if (grade.score >= 80) gradePoint = 3.0;
        else if (grade.score >= 70) gradePoint = 2.0;
        else if (grade.score >= 60) gradePoint = 1.0;
        
        totalPoints += gradePoint * grade.credits;
        totalCredits += grade.credits;
    });
    
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    
    await connection.execute(
        'UPDATE students SET gpa = ? WHERE id = ?',
        [gpa.toFixed(2), studentId]
    );
};

export const updateGrade = async (req, res, next) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { score } = req.body;
        const instructorId = req.user.id;
        
        const [grades] = await connection.execute(
            'SELECT * FROM grades WHERE enrollment_id = ?',
            [id]
        );
        
        const letterGrade = calculateLetterGrade(score);
        
        if (grades.length === 0) {
            await connection.execute(
                `INSERT INTO grades (enrollment_id, score, letter_grade, submitted_by)
                 VALUES (?, ?, ?, (SELECT id FROM instructors WHERE user_id = ?))`,
                [id, score, letterGrade, instructorId]
            );
        } else {
            await connection.execute(
                `UPDATE grades 
                 SET score = ?, letter_grade = ?, submitted_by = (SELECT id FROM instructors WHERE user_id = ?), updated_at = NOW()
                 WHERE enrollment_id = ?`,
                [score, letterGrade, instructorId, id]
            );
        }
        
        // Mark enrollment as completed
        await connection.execute(
            'UPDATE enrollments SET status = "completed" WHERE id = ?',
            [id]
        );
        
        // Get student ID and update GPA
        const [enrollments] = await connection.execute(
            'SELECT student_id FROM enrollments WHERE id = ?',
            [id]
        );
        
        if (enrollments.length > 0) {
            await updateStudentGPA(connection, enrollments[0].student_id);
        }
        
        await connection.commit();
        res.json({ message: 'Grade updated successfully', letterGrade });
    } catch (error) {
        await connection.rollback();
        next(error);
    } finally {
        connection.release();
    }
};

export const getGradesByStudent = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        
        const [grades] = await pool.execute(`
            SELECT g.*, c.course_code, c.title, c.credits
            FROM grades g
            JOIN enrollments e ON g.enrollment_id = e.id
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = ?
        `, [studentId]);
        
        res.json(grades);
    } catch (error) {
        next(error);
    }
};

export const getGradesByCourse = async (req, res, next) => {
    try {
        const { courseId } = req.params;
        
        const [grades] = await pool.execute(`
            SELECT g.*, u.first_name, u.last_name, u.email
            FROM grades g
            JOIN enrollments e ON g.enrollment_id = e.id
            JOIN students s ON e.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE e.course_id = ?
        `, [courseId]);
        
        res.json(grades);
    } catch (error) {
        next(error);
    }
};