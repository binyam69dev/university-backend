import { pool } from './database.js';

export async function createTables() {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // Users table (base for all roles)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'instructor', 'student') NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_email (email),
                INDEX idx_role (role)
            )
        `);

        // Students table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS students (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT UNIQUE NOT NULL,
                student_id VARCHAR(50) UNIQUE NOT NULL,
                enrollment_date DATE NOT NULL,
                major VARCHAR(100),
                gpa DECIMAL(3,2) DEFAULT 0.00,
                total_credits INT DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_student_id (student_id)
            )
        `);

        // Instructors table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS instructors (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT UNIQUE NOT NULL,
                instructor_id VARCHAR(50) UNIQUE NOT NULL,
                department VARCHAR(100),
                hire_date DATE NOT NULL,
                office_location VARCHAR(100),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_instructor_id (instructor_id)
            )
        `);

        // Courses table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS courses (
                id INT PRIMARY KEY AUTO_INCREMENT,
                course_code VARCHAR(20) UNIQUE NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                credits INT NOT NULL,
                capacity INT NOT NULL,
                enrolled_count INT DEFAULT 0,
                instructor_id INT,
                prerequisite_course_id INT,
                semester VARCHAR(20),
                year INT,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL,
                FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE SET NULL,
                INDEX idx_course_code (course_code),
                INDEX idx_semester_year (semester, year)
            )
        `);

        // Enrollments table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS enrollments (
                id INT PRIMARY KEY AUTO_INCREMENT,
                student_id INT NOT NULL,
                course_id INT NOT NULL,
                enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled',
                grade VARCHAR(2),
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
                UNIQUE KEY unique_enrollment (student_id, course_id),
                INDEX idx_student_course (student_id, course_id)
            )
        `);

        // Grades table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS grades (
                id INT PRIMARY KEY AUTO_INCREMENT,
                enrollment_id INT UNIQUE NOT NULL,
                score DECIMAL(5,2),
                letter_grade VARCHAR(2),
                submitted_by INT,
                submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
                FOREIGN KEY (submitted_by) REFERENCES instructors(id) ON DELETE SET NULL,
                INDEX idx_enrollment (enrollment_id)
            )
        `);

        // Audit logs table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT PRIMARY KEY AUTO_INCREMENT,
                user_id INT,
                action VARCHAR(255) NOT NULL,
                entity_type VARCHAR(50),
                entity_id INT,
                old_values JSON,
                new_values JSON,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
                INDEX idx_user_action (user_id, action),
                INDEX idx_created_at (created_at)
            )
        `);

        await connection.commit();
        console.log('Database tables created successfully');
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}