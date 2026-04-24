import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { pool } from '../config/database.js';
import { redisClient } from '../config/database.js';

class ReportingService {
    async generateStudentTranscript(studentId, semesterId = null) {
        const cacheKey = `transcript:${studentId}:${semesterId || 'all'}`;
        const cached = await redisClient.get(cacheKey);
        
        if (cached) {
            return JSON.parse(cached);
        }
        
        let query = `
            SELECT 
                c.course_code,
                c.title,
                c.credits,
                e.final_grade,
                fg.grade_points,
                s.semester_name,
                s.semester_number,
                ay.year_code
            FROM enrollments e
            JOIN course_offerings co ON e.course_offering_id = co.id
            JOIN courses c ON co.course_id = c.id
            JOIN final_grades fg ON e.id = fg.enrollment_id
            JOIN semesters s ON co.semester_id = s.id
            JOIN academic_years ay ON s.academic_year_id = ay.id
            WHERE e.student_id = ? AND e.status = 'Completed'
        `;
        
        const params = [studentId];
        
        if (semesterId) {
            query += ' AND co.semester_id = ?';
            params.push(semesterId);
        }
        
        const [grades] = await pool.execute(query, params);
        
        // Calculate statistics
        const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0);
        const totalPoints = grades.reduce((sum, g) => sum + (g.grade_points * g.credits), 0);
        const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : 0;
        
        const transcript = {
            student_id: studentId,
            semester: semesterId,
            courses: grades,
            summary: {
                total_credits: totalCredits,
                total_points: totalPoints,
                cgpa: cgpa,
                total_courses: grades.length
            }
        };
        
        // Cache for 1 hour
        await redisClient.setex(cacheKey, 3600, JSON.stringify(transcript));
        
        return transcript;
    }
    
    async exportTranscriptToPDF(studentId) {
        const transcript = await this.generateStudentTranscript(studentId);
        const doc = new PDFDocument();
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            return pdfData;
        });
        
        // Header
        doc.fontSize(20).text('University Academic Transcript', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Student ID: ${studentId}`);
        doc.text(`CGPA: ${transcript.summary.cgpa}`);
        doc.text(`Total Credits: ${transcript.summary.total_credits}`);
        doc.moveDown();
        
        // Table header
        doc.fontSize(10).text('Course Code', 50, doc.y);
        doc.text('Course Title', 150, doc.y);
        doc.text('Credits', 350, doc.y);
        doc.text('Grade', 450, doc.y);
        doc.text('Points', 500, doc.y);
        doc.moveDown();
        
        // Table rows
        transcript.courses.forEach(course => {
            doc.text(course.course_code, 50, doc.y);
            doc.text(course.title.substring(0, 30), 150, doc.y);
            doc.text(course.credits.toString(), 350, doc.y);
            doc.text(course.final_grade || 'N/A', 450, doc.y);
            doc.text(course.grade_points?.toString() || 'N/A', 500, doc.y);
            doc.moveDown();
        });
        
        doc.end();
        
        return new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(buffers)));
        });
    }
    
    async generateDepartmentReport(departmentId, academicYearId) {
        const [results] = await pool.execute(`
            SELECT 
                d.name as department_name,
                COUNT(DISTINCT s.id) as total_students,
                COUNT(DISTINCT i.id) as total_instructors,
                COUNT(DISTINCT c.id) as total_courses,
                AVG(s.current_gpa) as avg_gpa,
                SUM(CASE WHEN e.status = 'Registered' THEN 1 ELSE 0 END) as total_enrollments
            FROM departments d
            LEFT JOIN programs p ON p.department_id = d.id
            LEFT JOIN students s ON s.program_id = p.id
            LEFT JOIN instructors i ON i.department_id = d.id
            LEFT JOIN courses c ON c.department_id = d.id
            LEFT JOIN enrollments e ON e.student_id = s.id
            WHERE d.id = ? AND s.current_semester_id IN (
                SELECT id FROM semesters WHERE academic_year_id = ?
            )
            GROUP BY d.id
        `, [departmentId, academicYearId]);
        
        return results[0];
    }
}

export default new ReportingService();