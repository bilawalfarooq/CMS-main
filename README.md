# Institute Management System (EduCore CMS)

EduCore CMS is an enterprise-grade, modular web application designed for educational institutions to centralize and manage students, academic staff, courses, section allocations, and daily classroom operations.

---

## Table of Contents
- [1. Project Overview](#1-project-overview)
- [2. Core Feature Matrix](#2-core-feature-matrix)
- [3. Technology Stack](#3-technology-stack)
- [4. Developer & Team Skill Requirements](#4-developer--team-skill-requirements)
- [5. System Requirements](#5-system-requirements)
  - [Hardware Requirements](#hardware-requirements)
  - [Software & Infrastructure](#software--infrastructure)
- [6. Architecture & Data Flow](#6-architecture--data-flow)
- [7. System Constraints & Limitations](#7-system-constraints--limitations)
- [8. Getting Started](#8-getting-started)
- [9. Contribution & Coding Standards](#9-contribution--coding-standards)
- [10. License](#10-license)

---

## 1. Project Overview

The primary objective of this CMS is to eliminate manual administrative friction, prevent data duplication, and provide real-time visibility across three core institutional entities:

* **Students:** Enrollment, admissions, attendance tracking, and performance history.
* **Staff:** Employment records, department roles, teaching loads, and class-subject allocations.
* **Academics:** Multi-tiered class and section hierarchies, timetables, grading rubrics, and automated promotion pipelines across academic cycles.

---

## 2. Core Feature Matrix

| Module | Primary Capabilities |
| :--- | :--- |
| **Authentication & RBAC** | Granular role-based access for Super Admin, Principal/Dean, Teachers, Administrative Staff, Students, and Guardians. |
| **Student Information System (SIS)** | Profile lifecycle, unique admission tagging, family/guardian contact association, health/emergency contacts. |
| **Staff & Faculty Administration** | Profile repository, departmental assignments, contract terms, workload analytics, and schedule assignment. |
| **Academic Hierarchy** | Multi-year record isolation (`Academic Years`), class levels (Grades 1–12 / Semester 1–8), and section allocations. |
| **Attendance Engine** | Bulk section-based daily/period attendance entry, automated anomaly detection, and asynchronous guardian alerts. |
| **Gradebook & Reports** | Custom weight formulas, continuous assessments, term exam scheduling, automated report card compilation (PDF export). |

---

## 3. Technology Stack

* **Backend Framework:** Laravel 11.x (PHP 8.3+) or Node.js (NestJS / TypeScript)
* **Frontend Framework:** React 18+ / Vue 3 with Inertia.js or decoupled Vite SPA, styled with Tailwind CSS
* **Database Engine:** PostgreSQL 16+ or MySQL 8.0+
* **In-Memory Cache & Queue:** Redis 7.x
* **File Storage:** AWS S3, MinIO, or localized secure storage (for student photos, document uploads)
* **Job Processing:** Horizon / Celery / BullMQ for bulk notifications, PDF report generation, and CSV imports

---

## 4. Developer & Team Skill Requirements

To build, maintain, and scale this system, development personnel must possess the following domain proficiencies:

### A. Backend Engineering
* **Relational Schema Design & Optimization:** Deep understanding of foreign keys, cascade constraints, composite indexing (e.g., `(student_id, date)` for attendance), and execution plan optimization.
* **Role-Based Access Control (RBAC):** Proficiency with declarative policy-driven permissions (e.g., Laravel Policies/Gates, CASL, or Casbin).
* **Queue & Asynchronous Execution:** Experience dispatching background workers for high-volume transactions (SMS/email alerts, batch CSV imports, end-of-term PDF generation).
* **API Security & Hygiene:** OWASP Top 10 mitigation, token-based auth (Sanctum/JWT), strict input sanitization, rate-limiting, and parameter tampering prevention.

### B. Frontend Engineering
* **State Management & UI Performance:** Managing complex tabular datasets, inline data editing (e.g., quick-marking attendance for 50+ students in one grid), and form validation.
* **Responsive Dashboard UI:** Mastery of Tailwind CSS or UI libraries (Shadcn/UI, Ant Design) to maintain usability across desktop, tablet, and mobile browsers.

### C. DevOps & Infrastructure
* **Containerization:** Production Docker configurations, multi-stage builds, and Docker Compose orchestration.
* **Backup & Disaster Recovery:** Setting up automated snapshot routines for PostgreSQL/MySQL and document stores.
* **Environment Configuration:** Secure handling of secrets, SSL/TLS termination, reverse proxy routing (NGINX/Caddy), and CI/CD pipelines.

---

## 5. System Requirements

### Hardware Requirements

#### Minimum Development Environment
* **CPU:** Dual-core 2.0 GHz or higher (x86_64 or ARM64)
* **RAM:** 8 GB RAM minimum (16 GB recommended for concurrent Docker containers)
* **Storage:** 20 GB free disk space (SSD recommended)

#### Production Deployment (Small-to-Medium Institute: Up to 3,000 Students)
* **Application Server:** 2–4 vCPUs, 4–8 GB RAM
* **Database Server:** 2–4 vCPUs, 8 GB RAM, high IOPS SSD
* **Redis Server:** 1–2 vCPUs, 2 GB RAM
* **Storage Allocation:** 100 GB+ expandable block storage for student document attachments and backups

### Software & Infrastructure
* **Operating System:** Ubuntu Server 22.04 LTS / 24.04 LTS or Debian 12
* **RDBMS:** PostgreSQL 15+ / MySQL 8.0+
* **Runtime:** PHP 8.2+ (with `pdo`, `mbstring`, `openssl`, `tokenizer`, `xml`, `curl` extensions) or Node.js 20+ LTS
* **Web Server:** Nginx 1.24+ (configured with HTTP/2 and Gzip/Brotli)

---

## 6. Architecture & Data Flow

```
  [ Client Tier: Admin / Teacher / Student Portals ]
                         │
                         ▼
        [ Reverse Proxy / NGINX / SSL ]
                         │
                         ▼
          [ Application Logic / API Layer ]
          ├── Auth & Policy Middleware
          ├── Academic Controller Layer
          └── Service / Domain Layer
               │               │
        ┌──────┴──────┐ ┌──────┴───────────────┐
        ▼             ▼ ▼                      ▼
 [ PostgreSQL DB ] [ Redis Cache ]    [ Queue Worker: Notifications ]
 (Relational Core) (Sessions/Cache)   (Email, SMS, Bulk PDF Exporter)
```

---

## 7. System Constraints & Limitations

Every custom software architecture has operational trade-offs that must be planned for:

### 1. Concurrent Mark Submission Contention
* **Limitation:** When dozens of faculty members submit period attendance and terminal grades simultaneously (e.g., at the end of an examination week), locking can occur if the database is poorly indexed.
* **Mitigation:** Grade and attendance submissions must execute via batch updates wrapped in lightweight transactions, avoiding long table-level locks.

### 2. Multi-Year Historical Data Rollover
* **Limitation:** Naive schema designs that lack an explicit `academic_year_id` foreign key on class assignments will overwrite student records during end-of-year promotion.
* **Mitigation:** The system strictly separates active enrollments from historical records using an append-only archive strategy for past semesters.

### 3. Asynchronous Communication Delays
* **Limitation:** Direct third-party API calls (Twilio, WhatsApp Business, SendGrid) inside web request lifecycles will cause HTTP timeouts and degrade user experience.
* **Mitigation:** All outward alerts must strictly be queued into Redis and processed in the background with retry policies.

### 4. Storage Overhead for Uploads
* **Limitation:** Storing uncompressed medical forms, national identity cards, and birth certificates directly on the local web server filesystem causes disk exhaustion and hinders multi-server autoscaling.
* **Mitigation:** All binary assets must be streamed to S3-compatible object storage with presigned URLs and enforced upload file-size limits (max 2 MB per document).

---

## 8. Getting Started

### Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-org/educore-cms.git
   cd educore-cms
   ```

2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   # Update DB_CONNECTION, DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD
   ```

3. **Install Dependencies:**
   ```bash
   composer install       # For backend dependencies
   npm install            # For frontend dependencies
   ```

4. **Run Migrations & Seeders:**
   ```bash
   php artisan key:generate
   php artisan migrate --seed
   ```

5. **Start Development Servers:**
   ```bash
   php artisan serve
   npm run dev
   ```

---

## 9. Contribution & Coding Standards

* **Commit Style:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`).
* **Testing:** Maintain minimum 80% test coverage for all billing, grading, and authentication logic (`php artisan test` or `npm run test`).
* **Code Formatting:** Adhere to PSR-12 for PHP backend or Prettier/ESLint rules for TypeScript/JavaScript frontend.

---

## 10. License

This project is licensed under the [MIT License](LICENSE).
