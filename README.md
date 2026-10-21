# Digital Academic Document Workflow System 🎓

Welcome to the Digital Academic Document Workflow System! This is a complete software project built by **GOKUL R (Roll No: 310624148027)** for **Easwari Engineering College**.

## Live frontend links

- **Permanent GitHub Pages frontend:** https://gokzz-glitch.github.io/Digital-Academic-Document-Workflow-System/
- **Local frontend:** http://127.0.0.1:5173 (start it with ./start-app.ps1 from PowerShell)
- **GitHub source:** https://github.com/Gokzz-glitch/Digital-Academic-Document-Workflow-System

The Pages frontend calls the API at http://localhost:5000/api on the device opening the page. Start the app locally first; the public link cannot reach the project owner's computer or its data. To use the public page on another computer, that computer needs its own local backend running. The project is a local academic demo, not a publicly hosted college service.


If you are new to programming, don't worry! This guide is written so that anyone can understand what this project is and how to run it.

---

## 🤔 What is this project?
In a typical college, if a student needs a document (like a Bonafide Certificate or a Transcript), they have to write a letter, physically take it to their Class Advisor, then to the HOD, and finally to the Dean or Admin. This manual process is slow, paper-heavy, and hard to track.

**This project solves that problem.** It is a web application where:
1. A student logs in and requests a document online.
2. The request automatically travels to the right professors for approval.
3. Once fully approved, the system automatically generates a professional PDF document.
4. The PDF has a secure QR code on it so anyone can scan it to verify it's a real document!

---

## 🌐 What is "Full Stack"?
A "Full Stack" application means we built both the **Frontend** (what the user sees) and the **Backend** (the hidden engine that does the heavy lifting).
- **Frontend (The Face):** Buttons, forms, colors, text, and screens that the user clicks on.
- **Backend (The Brain & Memory):** The server that processes logins, decides who gets to approve what, generates the PDFs, and saves all data to a database.

## 🥞 What is "MERN"?
This project was built using the **MERN** stack, which is one of the most popular ways to build web apps today. MERN stands for:
- **M (MongoDB):** The Database. It stores all our users, passwords, and document requests like an organized digital filing cabinet.
- **E (Express.js):** The Backend Framework. It acts as the traffic cop, receiving requests from the user's browser and deciding what data to send back.
- **R (React.js):** The Frontend Library. It builds the beautiful, interactive screens you see in your browser.
- **N (Node.js):** The Engine. It's the environment that allows all the backend code (Express and MongoDB connections) to run on a computer.

---

## 🚀 Start on Windows

Open PowerShell and run:

```powershell
cd "J:\My Drive\GOKUL LEARNING\Digital-Academic-Document-Workflow-System"
.\start-app.ps1
```

The launcher starts the API and website, opens the app at `http://127.0.0.1:5173`, and installs missing packages when needed. It runs the app from a local copy under `%LOCALAPPDATA%` so the live database is not stored in a Google Drive syncing folder. The local database and generated PDFs are retained between restarts.

The app uses a configured `MONGO_URI` when available. If no MongoDB server is reachable, it starts a local persistent database automatically.

### Academic setup

Sign in as the initial administrator, create active Class Advisor, HOD, and Academic Office accounts under **Manage Users**, then review the approval stages under **Document Types**. Student sign-up is limited to student accounts. A request pauses with a clear message if its next approver is not configured.

---

## 🔑 How to Test the Application

On the first local launch, the seed step creates the Super Admin account at admin@easwari.edu. If BOOTSTRAP_ADMIN_PASSWORD is not set in server/.env, a random one-time password is printed in the local server startup log. Save it and change the password after signing in. Never publish a real .env file.


### What to do next:
1. As the Admin, you can click on **"Users"** in the sidebar to create new Student and Professor accounts.
2. Log out, and log back in as a **Student** to request a "Bonafide Certificate".
3. Log out, and log in as the **Class Advisor** to approve the student's request.
4. Watch the document automatically generate a PDF with a QR code!

---

## 📦 Dependencies & Versions Used
For the technical readers, here is exactly what is running under the hood:

**Backend (`server/package.json`):**
- Node.js environment
- `express` (^4.18.2) - Web framework
- `mongoose` (^8.0.3) - MongoDB object modeling
- `bcryptjs` (^2.4.3) - Password encryption
- `jsonwebtoken` (^9.0.2) - Secure login tokens
- `pdfkit` (^0.14.0) - PDF generation
- `qrcode` (^1.5.3) - QR code generation
- `nodemailer` (^6.9.7) - Email notifications

**Frontend (`client/package.json`):**
- React (`react` ^18.2.0)
- Vite (`vite` ^5.0.8) - Build tool
- React Router (`react-router-dom` ^6.21.1) - Page navigation
- Axios (`axios` ^1.6.3) - Talking to the backend API

---

### 🎉 Congratulations!
You now understand what Full Stack and MERN mean, and you have successfully run a modern, complex web application!
