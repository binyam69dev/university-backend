# University Management System — Backend API v3.0

> A production-ready, containerized RESTful API engineered for modern university ecosystems — featuring modular domain-driven architecture, enterprise-grade security, and horizontal scalability.

[![Node](https://img.shields.io/badge/node-20+-brightgreen)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/express-4.18-blue)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/mysql-8.0-orange)](https://mysql.com/)
[![Redis](https://img.shields.io/badge/redis-7.0-red)](https://redis.io/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://docker.com/)
[![License](https://img.shields.io/badge/license-ISC-yellow)](https://opensource.org/licenses/ISC)

## Overview

The **University Management System (UMS)** is a comprehensive backend solution built to handle the full complexity of a modern academic institution. It manages students, faculty, courses, enrollments, grades, examinations, attendance, library resources, and internal communications — all through a unified, secure REST API.

Built with **Node.js** and  **Express.js** , it uses a modular vertical-slice architecture that makes each domain independently scalable and maintainable.

| Property               | Value            |
| ---------------------- | ---------------- |
| **Version**      | 3.0.0            |
| **Release Date** | April 25, 2026   |
| **Status**       | Production Ready |

### Key Highlights

* Containerized with Docker and docker-compose for seamless multi-service deployment
* JWT authentication with hierarchical role-based access control (Admin / Instructor / Student)
* Redis caching for sub-millisecond response times on hot data
* MySQL 8.0 with optimized schemas, indexes, and connection pooling
* Real-time capabilities via Socket.IO service
* Structured logging with Winston
* Automated report generation and analytics dashboard

---

## Architecture

This project uses a **Domain-Driven Vertical Slice** architecture. Unlike traditional MVC monoliths, each feature module owns its own routes, controller, and data access logic — making the codebase easy to navigate, test, and scale independently.

```
university-backend/
│
├── src/
│   ├── app.js                        # Express middleware pipeline
│   ├── server.js                     # Server entry point and bootstrap
│   ├── working-app.js                # Alternate app entry (dev/testing)
│   │
│   ├── config/                       # Infrastructure configuration
│   │   ├── database.js               # MySQL connection pool
│   │   ├── redis.js                  # Redis client setup
│   │   ├── env.js                    # Environment variable loader
│   │   ├── schema.js                 # Database schema definitions
│   │   ├── migrate.js                # Migration runner
│   │   └── complete-migration.js     # Full schema migration script
│   │
│   ├── models/
│   │   └── BaseModel.js              # Shared base model with query helpers
│   │
│   ├── middlewares/                  # Global request guards
│   │   ├── auth.js                   # JWT verification
│   │   ├── role.middleware.js        # RBAC role enforcement
│   │   ├── security.js               # Helmet, CORS, rate limiting
│   │   ├── validation.js             # Joi schema validation
│   │   └── errorHandler.js           # Centralized error handling
│   │
│   ├── modules/                      # Domain modules (vertical slices)
│   │   ├── auth/                     # Authentication and token management
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.routes.js
│   │   │
│   │   ├── users/                    # User accounts and profile management
│   │   ├── students/                 # Student records and data
│   │   ├── faculty/                  # Instructor profiles and assignments
│   │   ├── courses/                  # Course catalog and management
│   │   ├── enrollments/              # Student-course registration
│   │   ├── grades/                   # Grade entry and GPA calculation
│   │   ├── attendance/               # Attendance tracking and reports
│   │   ├── examinations/             # Exam scheduling and results
│   │   ├── library/                  # Library resource management
│   │   ├── reports/                  # Analytics and report generation
│   │   ├── communications/           # Announcements and notifications
│   │   └── academics/                # Academic structure
│   │       ├── departments/          # Department management
│   │       ├── faculties/            # Faculty/school management
│   │       └── programs/             # Degree program management
│   │
│   ├── services/                     # Shared application services
│   │   ├── EnrollmentService.js      # Enrollment business logic
│   │   ├── ReportingService.js       # Report generation engine
│   │   └── SocketService.js          # Real-time Socket.IO events
│   │
│   └── utils/
│       └── logger.js                 # Winston structured logging
│
├── logs/                             # Application log output
├── uploads/                          # Uploaded files and media
├── docker-compose.yml                # Multi-container orchestration
├── Dockerfile                        # Container build configuration
├── .env                              # Local environment variables
├── .env.docker                       # Docker-specific environment
├── .env.example                      # Environment variable template
├── .dockerignore                     # Docker build exclusions
└── package.json
```

### Why This Architecture?

| Principle                         | Benefit                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| **Domain Encapsulation**    | Each module owns its routes, controller, and data access        |
| **Horizontal Scalability**  | Modules can be extracted into microservices independently       |
| **Predictable Maintenance** | Changes are isolated — no ripple effects across the codebase   |
| **Team Productivity**       | Multiple developers can work on separate modules simultaneously |
| **Testability**             | Each slice can be unit and integration tested in isolation      |

---

## Features

### Identity and Access Management

* Hierarchical RBAC with Admin, Instructor, and Student roles
* Stateless JWT authentication with configurable token expiry
* bcrypt password hashing (10+ rounds)
* Redis-backed token blacklisting for secure logout

### Academic Management

* Full course catalog with CRUD operations and instructor mapping
* Smart enrollment with capacity validation
* Grade entry, GPA calculation, and transcript generation
* Examination scheduling and result tracking
* Attendance marking and monitoring per course

### Institutional Management

* Department, faculty, and degree program management
* Library resource cataloging and access control
* Internal announcements and communications system
* Role-scoped dashboard statistics

### Analytics and Reporting

* Real-time admin dashboard metrics
* Course completion rates and grade distribution reports
* Automated report generation via ReportingService
* Export-ready data structures

### DevOps and Infrastructure

* Docker multi-service orchestration (API, MySQL, Redis, phpMyAdmin)
* Automated container health checks
* Persistent volume configuration for data durability
* Structured JSON logging with Winston
* Real-time event layer via Socket.IO

---

## Technology Stack

| Layer      | Technology   | Version | Purpose                              |
| ---------- | ------------ | ------- | ------------------------------------ |
| Runtime    | Node.js      | 20+     | High-concurrency event loop          |
| Framework  | Express.js   | 4.18    | Web framework and routing            |
| Database   | MySQL        | 8.0     | Relational data persistence          |
| Cache      | Redis        | 7.0     | Session storage and hot-data caching |
| Auth       | JWT + bcrypt | —      | Stateless authentication             |
| Validation | Joi          | 17.9    | Request schema validation            |
| Logging    | Winston      | 3.10    | Structured application logging       |
| Real-time  | Socket.IO    | —      | Live event broadcasting              |
| Container  | Docker       | 24+     | Service containerization             |
| DB Driver  | mysql2       | 3.6     | Async MySQL client                   |

### Key Dependencies

```json
{
  "express": "^4.18.2",
  "mysql2": "^3.6.0",
  "ioredis": "^5.10.1",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0",
  "joi": "^17.9.0",
  "winston": "^3.10.0",
  "helmet": "^7.2.0",
  "cors": "^2.8.6",
  "compression": "^1.8.1"
}
```

---

## Quick Start

### Prerequisites

* Node.js 20+ or Docker Desktop
* MySQL 8.0 (or use Docker)
* Redis 7.0 (or use Docker)
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/binyam69dev/university-backend.git
cd university-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Then edit `.env` with your values:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=university_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your_super_secret_key_min_32_chars
BCRYPT_ROUNDS=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Initialize the Database

```bash
mysql -u root -p -e "CREATE DATABASE university_db;"
npm run db:migrate
```

### 5. Start the Server

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

### Default Credentials

> Change all default passwords immediately in a production environment.

| Role       | Email                     | Password      |
| ---------- | ------------------------- | ------------- |
| Admin      | admin@university.com      | admin123      |
| Instructor | instructor@university.com | instructor123 |
| Student    | student@university.com    | student123    |

---

## Docker Deployment

### Prerequisites

* Docker Desktop 4.25+ (Windows/Mac) or Docker Engine 24+ (Linux)
* 4GB RAM minimum

### Start All Services

```bash
# Clone and enter the project
git clone https://github.com/binyam69dev/university-backend.git
cd university-backend

# Copy Docker environment file
cp .env.docker .env

# Start all containers
docker-compose up -d

# Stream logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Docker Services

| Service    | Container             | Port | Purpose             |
| ---------- | --------------------- | ---- | ------------------- |
| API        | university-app        | 5000 | Express application |
| MySQL      | university-mysql      | 3306 | Primary database    |
| Redis      | university-redis      | 6379 | Cache and sessions  |
| phpMyAdmin | university-phpmyadmin | 8080 | Database GUI        |

### Useful Docker Commands

```bash
# View running containers
docker ps

# Tail API logs
docker logs university-app -f

# Open a shell inside the API container
docker exec -it university-app sh

# Connect to MySQL inside Docker
docker exec -it university-mysql mysql -uroot -proot123

# Rebuild after code changes
docker-compose up -d --build

# Remove all containers and volumes
docker-compose down -v
```

---

## API Documentation

### Base URL

```
http://localhost:5000
```

### Interactive Docs

```
http://localhost:5000/api/docs
```

### Public Endpoints

| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| GET    | `/`                  | API info and version           |
| GET    | `/health`            | Health check                   |
| GET    | `/api/docs`          | Interactive API documentation  |
| POST   | `/api/v1/auth/login` | Authenticate and receive token |

### Protected Endpoints (authentication required)

| Method | Endpoint                                 | Role             | Description               |
| ------ | ---------------------------------------- | ---------------- | ------------------------- |
| GET    | `/api/v1/courses`                      | All              | List all courses          |
| GET    | `/api/v1/courses/:id`                  | All              | Get course details        |
| POST   | `/api/v1/courses`                      | Admin            | Create a course           |
| PUT    | `/api/v1/courses/:id`                  | Admin            | Update a course           |
| DELETE | `/api/v1/courses/:id`                  | Admin            | Delete a course           |
| GET    | `/api/v1/users`                        | Admin            | List all users            |
| POST   | `/api/v1/users`                        | Admin            | Create a user             |
| GET    | `/api/v1/students`                     | Admin            | List all students         |
| GET    | `/api/v1/enrollments/my-courses`       | Student          | Get enrolled courses      |
| POST   | `/api/v1/enrollments`                  | Student/Admin    | Enroll in a course        |
| DELETE | `/api/v1/enrollments/:id`              | Student/Admin    | Drop a course             |
| PUT    | `/api/v1/grades/:enrollmentId`         | Instructor       | Submit or update grade    |
| GET    | `/api/v1/grades/my-grades`             | Student          | View personal grades      |
| GET    | `/api/v1/attendance`                   | Instructor/Admin | View attendance records   |
| POST   | `/api/v1/attendance`                   | Instructor       | Mark attendance           |
| GET    | `/api/v1/examinations`                 | All              | View examination schedule |
| GET    | `/api/v1/library`                      | All              | Browse library resources  |
| GET    | `/api/v1/reports`                      | Admin            | Generate system reports   |
| GET    | `/api/v1/communications/announcements` | All              | View announcements        |
| GET    | `/api/v1/academics/departments`        | All              | List departments          |
| GET    | `/api/v1/academics/programs`           | All              | List degree programs      |
| GET    | `/api/v1/dashboard/stats`              | Admin            | Dashboard statistics      |

### Request Examples

#### Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@university.com","password":"admin123"}'
```

#### Get All Courses

```bash
curl -X GET http://localhost:5000/api/v1/courses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create a Course (Admin)

```bash
curl -X POST http://localhost:5000/api/v1/courses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_code": "CS301",
    "title": "Database Systems",
    "credits": 3,
    "capacity": 30,
    "semester": "Fall",
    "year": 2025
  }'
```

#### Enroll in a Course

```bash
curl -X POST http://localhost:5000/api/v1/enrollments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"courseId": 1}'
```

#### Test with PowerShell

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:5000/health"

# Login
$body = '{"email":"admin@university.com","password":"admin123"}'
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method POST -Body $body -ContentType "application/json"

# Get courses with token
$courses = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/courses" -Headers @{Authorization = "Bearer $($login.token)"}
```

---

## Environment Variables

| Variable                    | Required | Default       | Description                       |
| --------------------------- | -------- | ------------- | --------------------------------- |
| `PORT`                    | No       | 5000          | Server port                       |
| `NODE_ENV`                | No       | development   | Environment mode                  |
| `DB_HOST`                 | Yes      | localhost     | MySQL host                        |
| `DB_PORT`                 | No       | 3306          | MySQL port                        |
| `DB_USER`                 | Yes      | root          | MySQL username                    |
| `DB_PASSWORD`             | Yes      | —            | MySQL password                    |
| `DB_NAME`                 | Yes      | university_db | Database name                     |
| `REDIS_HOST`              | Yes      | localhost     | Redis host                        |
| `REDIS_PORT`              | No       | 6379          | Redis port                        |
| `JWT_SECRET`              | Yes      | —            | JWT signing secret (min 32 chars) |
| `BCRYPT_ROUNDS`           | No       | 10            | Password hash rounds              |
| `RATE_LIMIT_WINDOW_MS`    | No       | 900000        | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | No       | 100           | Max requests per window           |

---

## Database Schema

### Core Tables

| Table                 | Description                                 |
| --------------------- | ------------------------------------------- |
| `users`             | All user accounts with roles                |
| `students`          | Student-specific records and academic info  |
| `instructors`       | Faculty profiles and department assignments |
| `courses`           | Course catalog with capacity and scheduling |
| `enrollments`       | Student-course registration records         |
| `grades`            | Grade entries linked to enrollments         |
| `attendance`        | Per-session attendance records              |
| `examinations`      | Exam schedules and result entries           |
| `departments`       | Academic department structure               |
| `faculties`         | Faculty/school groupings                    |
| `programs`          | Degree program definitions                  |
| `library_resources` | Library catalog entries                     |
| `announcements`     | Institution-wide communications             |
| `audit_logs`        | Critical operation audit trail              |

### Entity Relationships

```
users (id, email, password_hash, role, first_name, last_name)
    ↓
students (id, user_id, student_id, program_id, enrollment_year)
    ↓
enrollments (id, student_id, course_id, status)
    ↓
grades (id, enrollment_id, score, letter_grade, gpa_points)

courses (id, course_code, title, credits, capacity, department_id)
    ↓
examinations (id, course_id, date, type, max_score)

departments (id, name, faculty_id)
    ↓
programs (id, name, department_id, duration_years)
```

---

## Security

| Measure          | Implementation                               |
| ---------------- | -------------------------------------------- |
| Password hashing | bcrypt with 10 rounds                        |
| Authentication   | Stateless JWT with configurable expiry       |
| Authorization    | Role middleware enforced per route           |
| Input validation | Joi schema validation on all request bodies  |
| SQL injection    | Parameterized queries via mysql2             |
| XSS protection   | Input sanitization middleware                |
| Security headers | Helmet.js                                    |
| CORS             | Configurable origin whitelist                |
| Rate limiting    | Per-role request limits                      |
| Audit trail      | Critical operations logged to `audit_logs` |

### Rate Limits by Role

| Role       | Max Requests | Window     |
| ---------- | ------------ | ---------- |
| Admin      | 100          | 15 minutes |
| Instructor | 200          | 15 minutes |
| Student    | 50           | 15 minutes |
| Public     | 30           | 15 minutes |

---

## Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage
```

---

## Performance

| Metric                     | Value  |
| -------------------------- | ------ |
| API response time (cached) | < 50ms |
| Database query time        | < 10ms |
| Redis operations           | < 1ms  |
| Concurrent users supported | 1,000+ |
| Container startup time     | < 30s  |

---

## Roadmap

### v3.0 — Current

* Docker containerization
* Redis caching layer
* Interactive API documentation
* Admin dashboard analytics
* Real-time Socket.IO service

### v3.1 — Planned

* WebSocket push notifications
* Email notification service
* File upload improvements
* Payment and fee integration

### v4.0 — Future

* Full microservices extraction
* GraphQL API layer
* Mobile API gateway
* AI-powered grade and enrollment recommendations

---

## Contributing

Contributions are welcome. Please follow this workflow:

```bash
git checkout -b feature/your-feature
git commit -m "feat: describe your change"
git push origin feature/your-feature
```

Then open a Pull Request against `main`.

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

* `feat:` — new feature
* `fix:` — bug fix
* `docs:` — documentation update
* `refactor:` — code restructure without behavior change
* `test:` — test additions or updates
* `chore:` — maintenance and tooling

---

|  |  |
| - | - |
