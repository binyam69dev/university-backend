import app from './working-app.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🎓 University Management System v3.0`);
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`\n📚 Available APIs:`);
    console.log(`   POST   /api/v1/auth/login     - Login`);
    console.log(`   GET    /api/v1/courses        - Get all courses`);
    console.log(`   POST   /api/v1/courses        - Create course (Admin)`);
    console.log(`   POST   /api/v1/enrollments    - Enroll in course`);
    console.log(`   PUT    /api/v1/grades/:id     - Update grade (Instructor)`);
    console.log(`   GET    /api/v1/students       - Get students (Admin)`);
    console.log(`   GET    /api/v1/dashboard/stats - Dashboard stats (Admin)`);
    console.log(`\n🔑 Test Credentials:`);
    console.log(`   Admin: admin@university.com / admin123`);
    console.log(`   Student: student@university.com / student123`);
    console.log(`   Instructor: instructor@university.com / instructor123\n`);
});