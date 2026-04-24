import { pool, redisClient } from '../config/database.js';
import logger from '../utils/logger.js';
import notificationService from './NotificationService.js';

class EnrollmentService {
    async enrollStudent(studentId, courseOfferingId) {
        return await pool.transaction(async (connection) => {
            // Check prerequisites
            const hasPrerequisites = await this.checkPrerequisites(studentId, courseOfferingId);
            if (!hasPrerequisites) {
                throw new Error('Prerequisites not met');
            }
            
            // Check capacity
            const [offering] = await connection.execute(
                'SELECT capacity, enrolled_count FROM course_offerings WHERE id = ?',
                [courseOfferingId]
            );
            
            if (offering[0].enrolled_count >= offering[0].capacity) {
                // Add to waitlist
                return await this.addToWaitlist(studentId, courseOfferingId);
            }
            
            // Create enrollment
            await connection.execute(
                `INSERT INTO enrollments (student_id, course_offering_id, status) 
                 VALUES (?, ?, 'Registered')`,
                [studentId, courseOfferingId]
            );
            
            // Update enrolled count
            await connection.execute(
                'UPDATE course_offerings SET enrolled_count = enrolled_count + 1 WHERE id = ?',
                [courseOfferingId]
            );
            
            // Send notification
            await notificationService.sendEnrollmentConfirmation(studentId, courseOfferingId);
            
            // Clear cache
            await redisClient.del(`student:${studentId}:courses`);
            
            return { success: true, message: 'Enrolled successfully' };
        });
    }
    
    async checkPrerequisites(studentId, courseOfferingId) {
        const [prerequisites] = await pool.execute(`
            SELECT cp.prerequisite_course_id, cp.min_grade_required
            FROM course_prerequisites cp
            JOIN course_offerings co ON cp.course_id = co.course_id
            WHERE co.id = ?
        `, [courseOfferingId]);
        
        for (const prereq of prerequisites) {
            const [completed] = await pool.execute(`
                SELECT final_grade FROM enrollments e
                JOIN final_grades fg ON e.id = fg.enrollment_id
                WHERE e.student_id = ? AND e.course_offering_id = ?
                AND e.status = 'Completed'
            `, [studentId, prereq.prerequisite_course_id]);
            
            if (completed.length === 0) {
                return false;
            }
        }
        
        return true;
    }
    
    async addToWaitlist(studentId, courseOfferingId) {
        const [position] = await pool.execute(
            'SELECT COUNT(*) + 1 as position FROM waitlist WHERE course_offering_id = ?',
            [courseOfferingId]
        );
        
        await pool.execute(
            `INSERT INTO waitlist (course_offering_id, student_id, position) 
             VALUES (?, ?, ?)`,
            [courseOfferingId, studentId, position[0].position]
        );
        
        return { success: true, message: 'Added to waitlist', position: position[0].position };
    }
    
    async dropCourse(enrollmentId, reason) {
        return await pool.transaction(async (connection) => {
            await connection.execute(
                `UPDATE enrollments SET status = 'Dropped', drop_date = NOW() 
                 WHERE id = ?`,
                [enrollmentId]
            );
            
            // Update course offering count
            await connection.execute(
                `UPDATE course_offerings co 
                 SET enrolled_count = enrolled_count - 1 
                 WHERE id = (SELECT course_offering_id FROM enrollments WHERE id = ?)`,
                [enrollmentId]
            );
            
            // Process waitlist
            await this.processWaitlist(enrollmentId);
            
            return { success: true, message: 'Course dropped successfully' };
        });
    }
    
    async processWaitlist(enrollmentId) {
        const [waitlist] = await pool.execute(`
            SELECT w.* FROM waitlist w
            JOIN enrollments e ON e.course_offering_id = w.course_offering_id
            WHERE e.id = ?
            ORDER BY w.position ASC
            LIMIT 1
        `, [enrollmentId]);
        
        if (waitlist.length > 0) {
            await notificationService.sendWaitlistOffer(waitlist[0].student_id, waitlist[0].course_offering_id);
        }
    }
}

export default new EnrollmentService();