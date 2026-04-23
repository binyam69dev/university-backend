
# 🎓 University Management System (UMS) — Backend API

A high-performance, modular RESTful API engineered to orchestrate complex university ecosystems. This system handles the intricate relationships between academic entities—students, faculty, and curricula—with a primary focus on  **modular decoupling** ,  **state-of-the-art security** , and  **linear scalability** .

---

## 🏗️ Architecture: Feature-Based (Modular) Design

Unlike traditional MVC monoliths that group files by technical role (placing all controllers in a single folder), this project utilizes a **Domain-Driven Vertical Slice** architecture.

### Why this approach?

* **Domain Encapsulation:** Each module in `src/modules` (e.g., `enrollments`) is a self-contained unit. It owns its logic, routes, and data access, preventing "spaghetti code."
* **Scalability:** Independent modules allow multiple developers to work on different features simultaneously with zero merge conflicts.
* **Predictable Maintenance:** Logical grouping ensures that a change in the `grading` logic is isolated and does not side-effect the `auth` module.

### 📁 Project Roadmap

**Plaintext**

```
university-backend/
│
├── src/
│   ├── config/              # Infrastructure: Database & Env Configuration
│   │
│   ├── modules/             # 🔥 Domain Engine (Vertical Slices)
│   │   ├── auth/            # Identity & Session Management
│   │   ├── users/           # RBAC & Profile Governance
│   │   ├── students/        # Academic Records
│   │   ├── instructors/     # Faculty Operations
│   │   ├── courses/         # Curricular Catalog
│   │   ├── enrollments/     # Registration State Machine
│   │   └── grades/          # Evaluation & GPA Calculation
│   │
│   ├── middlewares/         # 🛡️ Global Guards (Auth, Role-Checks, Error Interception)
│   ├── utils/               # 🛠️ Shared Helpers (Winston Logger, Data Parsers)
│   ├── app.js               # Express Middleware Pipeline
│   └── server.js            # Entry Point & Bootstrap
│
└── .env                     # Sensitive Configuration
```

---

## ✨ Core Engineering Features

### 🔐 Identity & Access Management (IAM)

* **Multi-Tenant RBAC:** Hierarchical permissions for  **Admins** ,  **Instructors** , and  **Students** .
* **Stateless Security:** Implementation of JWT (JSON Web Tokens) for secure, scalable session handling.
* **Cryptographic Integrity:** One-way password hashing using `bcrypt` and input sanitation to mitigate Injection attacks.

### 📚 Academic Logic Engine

* **Dynamic Course Management:** Comprehensive CRUD operations with complex instructor-to-course mapping.
* **Smart Enrollments:** Validates prerequisites and capacity constraints before committing to the database.
* **Automated Grading:** Secure submission portal for instructors with automated real-time GPA recalculation for students.

---

## 🛠️ Technology Stack

| **Layer**      | **Technology**         | **Rationale**                                            |
| -------------------- | ---------------------------- | -------------------------------------------------------------- |
| **Runtime**    | **Node.js (LTS)**      | Asynchronous event-loop for high-concurrency request handling. |
| **Framework**  | **Express.js**         | Minimalist overhead for custom middleware orchestration.       |
| **Database**   | **MySQL / PostgreSQL** | Relational integrity for complex linked academic data.         |
| **Validation** | **Joi / Zod**          | Schema-first request validation at the network edge.           |
| **Logging**    | **Winston**            | Structured JSON logging for production-level observability.    |

---

## 🚀 Rapid Deployment

### 1. Environment Initialization

**Bash**

```
git clone https://github.com/binyam69dev/university-backend.git
cd university-backend
npm install
```

### 2. Configuration

Create a `.env` file in the root directory:

**Code snippet**

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_secure_password
DB_NAME=university_db
JWT_SECRET=your_32_character_secret
```

### 3. Execution

**Bash**

```
# Development (Hot-Reload)
npm run dev

# Production
npm start
```

---

## 📡 API Interface (v1)

| **Module**   | **Endpoint**          | **Access Level** |
| ------------------ | --------------------------- | ---------------------- |
| **Auth**     | `POST /api/v1/auth/login` | **Public**       |
| **Users**    | `GET /api/v1/users`       | **Admin**        |
| **Students** | `GET /api/v1/students/me` | **Student**      |
| **Grades**   | `PUT /api/v1/grades/:id`  | **Instructor**   |

---

## 🛡️ Security & Reliability Implementation

* **Centralized Exception Filter:** A global error-handling middleware ensures that no sensitive stack traces are leaked to the client.
* **Audit Logging:** Every critical operation (Login, Grade Change, Enrollment) is tracked via the Winston logger for forensic auditing.
* **Request Sanitization:** All incoming payloads are strictly validated against schemas before reaching the service layer.
