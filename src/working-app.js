import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database import (will add when ready)
// import pool from './config/database.js';
// import redisClient from './config/redis.js';

const app = express();
const upload = multer({ dest: 'uploads/' });

// ============ MIDDLEWARE ============
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`📝 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    });
    next();
});
// Welcome route (root path)
app.get('/', (req, res) => {
    res.json({
        name: 'University Management System API',
        version: '3.0.0',
        status: 'running',
        documentation: '/api/docs',
        endpoints: {
            health: 'GET /health',
            login: 'POST /api/v1/auth/login',
            courses: 'GET /api/v1/courses',
            users: 'GET /api/v1/users',
            enrollments: 'POST /api/v1/enrollments',
            grades: 'PUT /api/v1/grades/:id',
            dashboard: 'GET /api/v1/dashboard/stats'
        },
        env: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

// API Documentation route
app.get('/api/docs', (req, res) => {
    res.json({
        title: 'University Management System API Documentation',
        version: '3.0.0',
        base_url: 'http://localhost:5000',
        endpoints: {
            auth: {
                login: {
                    method: 'POST',
                    url: '/api/v1/auth/login',
                    body: { email: 'string', password: 'string' }
                },
                logout: {
                    method: 'POST',
                    url: '/api/v1/auth/logout',
                    headers: { Authorization: 'Bearer token' }
                }
            },
            courses: {
                list: { method: 'GET', url: '/api/v1/courses' },
                create: { method: 'POST', url: '/api/v1/courses', body: { course_code: 'string', title: 'string', credits: 'number' } },
                update: { method: 'PUT', url: '/api/v1/courses/:id' },
                delete: { method: 'DELETE', url: '/api/v1/courses/:id' }
            },
            users: {
                list: { method: 'GET', url: '/api/v1/users' },
                create: { method: 'POST', url: '/api/v1/users', body: { email: 'string', password: 'string', role: 'string' } }
            },
            enrollments: {
                enroll: { method: 'POST', url: '/api/v1/enrollments', body: { courseId: 'number' } },
                myCourses: { method: 'GET', url: '/api/v1/enrollments/my-courses' }
            },
            grades: {
                update: { method: 'PUT', url: '/api/v1/grades/:enrollmentId', body: { score: 'number', letterGrade: 'string' } },
                myGrades: { method: 'GET', url: '/api/v1/grades/my-grades' }
            }
        }
    });
});


// Authentication middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '3.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============ AUTH ROUTES ============



// Auth routes
app.post('/api/v1/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Mock database of users
    const users = [
        { id: 1, email: 'admin@university.com', password: 'admin123', role: 'admin', firstName: 'Admin', lastName: 'User' },
        { id: 2, email: 'student@university.com', password: 'student123', role: 'student', firstName: 'John', lastName: 'Doe' },
        { id: 3, email: 'instructor@university.com', password: 'instructor123', role: 'instructor', firstName: 'Jane', lastName: 'Smith' }
    ];
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '7d' }
    );
    
    res.json({
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
        }
    });
});





// ============ USER MANAGEMENT ============
app.get('/api/v1/users', authenticate, authorize('admin'), (req, res) => {
    res.json([
        { id: 1, email: 'admin@university.com', role: 'admin', first_name: 'Admin', last_name: 'User', is_active: true },
        { id: 2, email: 'student@university.com', role: 'student', first_name: 'John', last_name: 'Doe', is_active: true },
        { id: 3, email: 'instructor@university.com', role: 'instructor', first_name: 'Jane', last_name: 'Smith', is_active: true }
    ]);
});

app.post('/api/v1/users', authenticate, authorize('admin'), async (req, res) => {
    const { email, password, role, firstName, lastName } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Mock response - replace with database insert
        res.status(201).json({
            message: 'User created successfully',
            userId: Date.now(),
            user: { email, role, firstName, lastName }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============ COURSE MANAGEMENT ============
let courses = [
    { id: 1, course_code: 'CS101', title: 'Introduction to Programming', description: 'Learn programming fundamentals', credits: 3, capacity: 30, enrolled_count: 15, semester: 'Fall', year: 2024, is_active: true },
    { id: 2, course_code: 'MATH101', title: 'Calculus I', description: 'Differential and integral calculus', credits: 4, capacity: 25, enrolled_count: 20, semester: 'Fall', year: 2024, is_active: true },
    { id: 3, course_code: 'ENG101', title: 'English Composition', description: 'Academic writing and research', credits: 3, capacity: 28, enrolled_count: 12, semester: 'Fall', year: 2024, is_active: true },
    { id: 4, course_code: 'PHY101', title: 'Physics I', description: 'Mechanics and thermodynamics', credits: 4, capacity: 24, enrolled_count: 18, semester: 'Fall', year: 2024, is_active: true }
];

app.get('/api/v1/courses', authenticate, (req, res) => {
    const activeCourses = courses.filter(c => c.is_active);
    res.json(activeCourses);
});

app.get('/api/v1/courses/:id', authenticate, (req, res) => {
    const course = courses.find(c => c.id === parseInt(req.params.id));
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
});

app.post('/api/v1/courses', authenticate, authorize('admin'), (req, res) => {
    const { course_code, title, description, credits, capacity, semester, year } = req.body;
    
    const newCourse = {
        id: courses.length + 1,
        course_code,
        title,
        description,
        credits,
        capacity,
        enrolled_count: 0,
        semester,
        year,
        is_active: true,
        created_at: new Date()
    };
    
    courses.push(newCourse);
    res.status(201).json({ message: 'Course created successfully', courseId: newCourse.id });
});

app.put('/api/v1/courses/:id', authenticate, authorize('admin'), (req, res) => {
    const courseId = parseInt(req.params.id);
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    courses[courseIndex] = { ...courses[courseIndex], ...req.body };
    res.json({ message: 'Course updated successfully', course: courses[courseIndex] });
});

app.delete('/api/v1/courses/:id', authenticate, authorize('admin'), (req, res) => {
    const courseId = parseInt(req.params.id);
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    courses[courseIndex].is_active = false;
    res.json({ message: 'Course deleted successfully' });
});

// ============ ENROLLMENT MANAGEMENT ============
let enrollments = [];

app.post('/api/v1/enrollments', authenticate, async (req, res) => {
    const { courseId } = req.body;
    const studentId = req.user.id;
    
    const course = courses.find(c => c.id === courseId);
    if (!course) {
        return res.status(404).json({ error: 'Course not found' });
    }
    
    if (course.enrolled_count >= course.capacity) {
        return res.status(400).json({ error: 'Course is full' });
    }
    
    const alreadyEnrolled = enrollments.some(e => e.studentId === studentId && e.courseId === courseId);
    if (alreadyEnrolled) {
        return res.status(400).json({ error: 'Already enrolled in this course' });
    }
    
    const enrollment = {
        id: enrollments.length + 1,
        studentId,
        courseId,
        status: 'enrolled',
        enrollmentDate: new Date()
    };
    
    enrollments.push(enrollment);
    course.enrolled_count++;
    
    res.status(201).json({ message: 'Enrolled successfully', enrollment });
});

app.get('/api/v1/enrollments/my-courses', authenticate, (req, res) => {
    const myEnrollments = enrollments.filter(e => e.studentId === req.user.id);
    const myCourses = myEnrollments.map(e => courses.find(c => c.id === e.courseId));
    res.json(myCourses);
});

app.delete('/api/v1/enrollments/:id', authenticate, (req, res) => {
    const enrollmentId = parseInt(req.params.id);
    const enrollmentIndex = enrollments.findIndex(e => e.id === enrollmentId);
    
    if (enrollmentIndex === -1) {
        return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    const enrollment = enrollments[enrollmentIndex];
    const course = courses.find(c => c.id === enrollment.courseId);
    
    if (course) {
        course.enrolled_count--;
    }
    
    enrollments.splice(enrollmentIndex, 1);
    res.json({ message: 'Dropped course successfully' });
});

// ============ GRADE MANAGEMENT ============
let grades = [];

app.put('/api/v1/grades/:enrollmentId', authenticate, authorize('instructor'), (req, res) => {
    const { enrollmentId } = req.params;
    const { score, letterGrade } = req.body;
    
    const enrollment = enrollments.find(e => e.id === parseInt(enrollmentId));
    if (!enrollment) {
        return res.status(404).json({ error: 'Enrollment not found' });
    }
    
    const existingGrade = grades.find(g => g.enrollmentId === parseInt(enrollmentId));
    
    if (existingGrade) {
        existingGrade.score = score;
        existingGrade.letterGrade = letterGrade;
        existingGrade.updatedAt = new Date();
    } else {
        grades.push({
            id: grades.length + 1,
            enrollmentId: parseInt(enrollmentId),
            score,
            letterGrade,
            createdAt: new Date()
        });
    }
    
    res.json({ message: 'Grade updated successfully', grade: { score, letterGrade } });
});

app.get('/api/v1/grades/my-grades', authenticate, (req, res) => {
    const myEnrollments = enrollments.filter(e => e.studentId === req.user.id);
    const myGrades = myEnrollments.map(e => {
        const grade = grades.find(g => g.enrollmentId === e.id);
        const course = courses.find(c => c.id === e.courseId);
        return {
            course: course?.title,
            courseCode: course?.course_code,
            grade: grade?.letterGrade || 'Pending',
            score: grade?.score || null
        };
    });
    
    res.json(myGrades);
});

// ============ STUDENT MANAGEMENT ============
let students = [
    { id: 1, user_id: 2, student_id: 'STU2024001', first_name: 'John', last_name: 'Doe', email: 'student@university.com', program: 'Computer Science', enrollment_year: 2024, status: 'active' }
];

app.get('/api/v1/students', authenticate, authorize('admin'), (req, res) => {
    res.json(students);
});

app.get('/api/v1/students/profile', authenticate, (req, res) => {
    if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Access denied' });
    }
    const student = students.find(s => s.user_id === req.user.id);
    res.json(student);
});

// ============ INSTRUCTOR MANAGEMENT ============
let instructors = [
    { id: 1, user_id: 3, instructor_id: 'INS2024001', first_name: 'Jane', last_name: 'Smith', email: 'instructor@university.com', department: 'Computer Science', hire_date: '2020-08-15' }
];

app.get('/api/v1/instructors', authenticate, (req, res) => {
    res.json(instructors);
});

app.get('/api/v1/instructors/my-courses', authenticate, authorize('instructor'), (req, res) => {
    // For demo, return first 2 courses
    res.json(courses.slice(0, 2));
});

// ============ DASHBOARD STATISTICS ============
app.get('/api/v1/dashboard/stats', authenticate, authorize('admin'), (req, res) => {
    res.json({
        total_students: students.length,
        total_instructors: instructors.length,
        total_courses: courses.filter(c => c.is_active).length,
        total_enrollments: enrollments.length,
        average_attendance: 85.5,
        total_revenue: 125000,
        recent_activities: [
            { id: 1, action: 'New enrollment', user: 'John Doe', time: '2 hours ago' },
            { id: 2, action: 'Course created', user: 'Admin', time: '5 hours ago' },
            { id: 3, action: 'Grade updated', user: 'Jane Smith', time: '1 day ago' }
        ]
    });
});

// ============ ATTENDANCE ROUTES ============
let attendance = [];

app.post('/api/v1/attendance', authenticate, authorize('instructor'), (req, res) => {
    const { courseId, date, studentIds, status } = req.body;
    
    const records = studentIds.map(studentId => ({
        id: attendance.length + 1,
        courseId,
        studentId,
        date,
        status,
        marked_by: req.user.id,
        marked_at: new Date()
    }));
    
    attendance.push(...records);
    res.status(201).json({ message: 'Attendance recorded', count: records.length });
});

app.get('/api/v1/attendance/my-attendance', authenticate, (req, res) => {
    const myAttendance = attendance.filter(a => a.studentId === req.user.id);
    res.json(myAttendance);
});

// ============ FILE UPLOAD ============
app.post('/api/v1/upload', authenticate, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
    });
});

// ============ NOTIFICATIONS ============
let notifications = [];

app.get('/api/v1/notifications', authenticate, (req, res) => {
    const userNotifications = notifications.filter(n => n.userId === req.user.id);
    res.json(userNotifications);
});

app.post('/api/v1/notifications/mark-read/:id', authenticate, (req, res) => {
    const notification = notifications.find(n => n.id === parseInt(req.params.id));
    if (notification) {
        notification.is_read = true;
    }
    res.json({ message: 'Notification marked as read' });
});

// ============ SEARCH ============
app.get('/api/v1/search', authenticate, (req, res) => {
    const { q, type } = req.query;
    
    let results = [];
    
    if (!type || type === 'courses') {
        const matchedCourses = courses.filter(c => 
            c.title.toLowerCase().includes(q.toLowerCase()) ||
            c.course_code.toLowerCase().includes(q.toLowerCase())
        );
        results.push(...matchedCourses.map(c => ({ type: 'course', ...c })));
    }
    
    res.json(results);
});

// ============ 404 HANDLER ============
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// ============ ERROR HANDLER ============
app.use((err, req, res, next) => {
    console.error('❌ Error:', err);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: err.message });
    }
    
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.status(500).json({ 
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
});

export default app;