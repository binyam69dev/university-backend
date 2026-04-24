import { BaseModel } from '../../../models/BaseModel.js';

class FacultyModel extends BaseModel {
    constructor() {
        super('faculties');
    }

    async getWithDepartments(facultyId) {
        const [rows] = await pool.execute(`
            SELECT f.*, 
                   COUNT(DISTINCT d.id) as department_count,
                   COUNT(DISTINCT p.id) as program_count
            FROM faculties f
            LEFT JOIN departments d ON d.faculty_id = f.id
            LEFT JOIN programs p ON p.department_id = d.id
            WHERE f.id = ?
            GROUP BY f.id
        `, [facultyId]);
        
        return rows[0];
    }

    async getStatistics() {
        const [rows] = await pool.execute(`
            SELECT 
                COUNT(*) as total_faculties,
                SUM((SELECT COUNT(*) FROM departments d WHERE d.faculty_id = f.id)) as total_departments,
                SUM((SELECT COUNT(*) FROM programs p WHERE p.department_id IN (SELECT id FROM departments WHERE faculty_id = f.id))) as total_programs
            FROM faculties f
        `);
        return rows[0];
    }
}

export default new FacultyModel();