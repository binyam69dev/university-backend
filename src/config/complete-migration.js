import { pool } from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCompleteMigration() {
    const connection = await pool.getConnection();
    
    try {
        console.log('🚀 Starting Complete University Database Migration...\n');
        
        await connection.beginTransaction();
        
        // Read and execute all SQL files in order
        const sqlFiles = [
            '01_academic_structure.sql',
            '02_student_management.sql',
            '03_faculty_management.sql',
            '04_course_management.sql',
            '05_enrollment.sql',
            '06_assessment_grades.sql',
            '07_attendance.sql',
            '08_infrastructure.sql',
            '09_administration.sql',
            '10_library.sql',
            '11_examinations.sql',
            '12_communications.sql',
            '13_indexes.sql'
        ];
        
        for (const sqlFile of sqlFiles) {
            const sqlPath = path.join(__dirname, 'sql', sqlFile);
            if (fs.existsSync(sqlPath)) {
                const sql = fs.readFileSync(sqlPath, 'utf8');
                await connection.query(sql);
                console.log(`✅ Executed: ${sqlFile}`);
            }
        }
        
        await connection.commit();
        
        console.log('\n🎉 Complete Database Migration Successful!');
        console.log('📊 System is ready with all modules!');
        
    } catch (error) {
        await connection.rollback();
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        connection.release();
        process.exit(0);
    }
}

runCompleteMigration();