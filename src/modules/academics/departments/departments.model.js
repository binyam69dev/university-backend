import { BaseModel } from '../../../models/BaseModel.js';
import { pool } from '../../../config/database.js';

class DepartmentModel extends BaseModel {
    constructor() {
        super('departments');
    }

    async getWithDetails(departmentId) {
        const [rows] = await pool.execute(`
            SELECT d.*, 
                   f.name as faculty_name,
                   f.code as faculty_code,
                   COUNT(DISTINCT p.id) as program_count,
                   COUNT(DISTINCT c.id) as course_count,
                   COUNT(DISTINCT i.id) as instructor_count
            FROM departments d
            LEFT JOIN faculties f ON d.faculty_id = f.id
            LEFT JOIN programs p ON p.department_id = d.id
            LEFT JOIN courses c ON c.department_id = d.id
            LEFT JOIN instructors i ON i.department_id = d.id
            WHERE d.id = ?
            GROUP BY d.id
        `, [departmentId]);
        
        return rows[0];
    }

    async getByFaculty(facultyId) {
        return this.findAll({ faculty_id: facultyId });
    }
}

export default new DepartmentModel();