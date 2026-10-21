# Original User Request

## 2026-09-15T14:17:36Z

Build a production-ready, full-stack MERN (MongoDB, Express.js, React.js, Node.js) web application called "Digital Academic Document Workflow System" that digitizes the approval process for academic documents through automated multi-level workflows. The system replaces manual paper-based processes in colleges — students submit requests online, requests route automatically through configurable approval chains (e.g., Class Advisor → HOD → Dean → Admin), and approved documents are generated digitally with QR code verification. The platform serves multiple user roles (Student, Faculty/Advisor, HOD, Dean, Admin, Super Admin) with role-specific dashboards, real-time status tracking, email + in-app notifications, and an analytics admin panel. The UI should be modern, clean, and professional — impressive enough for college project reviews.

Working directory: C:\Users\imgk3\.gemini\antigravity\scratch\digital-academic-doc-workflow

Integrity mode: development

## Requirements

### R1. Core MERN Platform

A full-stack web application using MongoDB (with Mongoose ODM), Express.js REST API backend, React.js frontend (using Vite), and Node.js runtime. The frontend must be responsive (works on desktop, tablet, and mobile browsers) with a modern, professional dashboard UI. The backend must expose a clean RESTful API with proper HTTP methods, status codes, and error handling. Environment variables must be used for all configuration (DB URI, JWT secret, SMTP credentials, port). The project must have a clear folder structure separating concerns (models, controllers, routes, middleware, services on backend; components, pages, hooks, context, api on frontend).

### R2. Authentication & Role-Based Access Control

JWT-based authentication with secure registration, login, logout, and password reset flows. Six user roles: Student, Class Advisor, HOD, Dean, Admin Staff, and Super Admin — each with distinct permissions and dashboard views. Protected routes on both frontend and backend that enforce role-based access. Super Admin can manage users, assign roles, and configure the system. Student registration should capture department, year, section, and roll number.

### R3. Dynamic Document Workflow Engine

An admin-configurable system where Super Admin can create document types (e.g., Bonafide Certificate, Transcript, NOC) with custom form fields and define the approval chain for each type. Students submit requests by selecting a document type and filling out the dynamic form. Requests automatically route through the defined approval chain — each approver can approve (forwards to next stage), reject (with reason, notifies student), or request revision. The system must track complete request history with timestamps at every stage. Each role's dashboard shows their pending, approved, and rejected items with filters and search.

### R4. Notification System

Real email notifications via SMTP (Nodemailer) triggered at key workflow events: request submitted, request approved at each stage, request rejected, request completed, revision requested. In-app notification system with a notification bell/dropdown showing unread count and notification list. Notifications must be persistent (stored in DB) and markable as read.

### R5. Digital Document Generation & Verification

When a request completes all approvals, the system generates a PDF document with institutional branding, a unique document ID, and an embedded QR code. The QR code encodes a verification URL that anyone can scan to verify the document's authenticity against the database. A public verification page (no login required) that displays document details when a valid QR/document ID is provided.

## Acceptance Criteria

### Authentication & Access
- [ ] A new student can register, login, and access only their own dashboard
- [ ] Login with invalid credentials returns a proper error (not a crash)
- [ ] Each of the 6 roles sees a different dashboard with role-appropriate data
- [ ] A student cannot access admin routes (API returns 403, frontend redirects)
- [ ] JWT tokens expire and refresh correctly; expired tokens are rejected
- [ ] Super Admin can create, edit, deactivate users and assign roles

### Document Request Workflow
- [ ] Super Admin can create a new document type with custom fields and a multi-step approval chain
- [ ] A student can submit a request for any available document type
- [ ] The request appears in the correct first-level approver's pending queue
- [ ] After approval at stage N, the request automatically moves to stage N+1's queue
- [ ] Rejection at any stage stops the chain and notifies the student with the reason
- [ ] The student's dashboard shows real-time status of all their requests
- [ ] Complete request history (who approved/rejected, when, comments) is viewable

### Notifications
- [ ] Email is sent (via SMTP) when a request is submitted, approved, rejected, or completed
- [ ] In-app notification bell shows unread count that updates when new notifications arrive
- [ ] Clicking a notification marks it as read and navigates to the relevant request

### Document Generation
- [ ] A completed request triggers PDF generation with the institution name, document content, unique ID, and QR code
- [ ] The student can download the generated PDF from their dashboard
- [ ] Scanning the QR code opens a public verification page confirming document authenticity
- [ ] Entering a document ID on the verification page also works (no login needed)

### Technical Quality
- [ ] The app starts with `npm install` + `npm run dev` (both server and client) with no crashes
- [ ] Environment variables are used for all secrets and configuration (no hardcoded credentials)
- [ ] API errors return appropriate HTTP status codes and JSON error messages
- [ ] MongoDB collections use proper Mongoose schemas with validation
- [ ] The frontend is responsive — usable on a 375px mobile viewport and a 1920px desktop
