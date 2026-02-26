# Bataknese Wedding Budget Tracker - Jakarta Edition

A full-stack web application to help Bataknese couples living in Jakarta track and manage their wedding budget. Built with React, Express, PostgreSQL, and Prisma.

## Features

- Create and manage wedding projects with Bataknese ceremony cost categories
- Default categories: Sinamot, Ulos, Jambar, Gondang, Gedung, Catering, and more
- Dashboard with budget stats and bar chart visualization
- Add, edit, delete budget categories with planned vs actual tracking
- Finalize projects to lock editing
- Export reports as PDF or Excel
- JWT authentication
- Responsive mobile-friendly UI

## Tech Stack

| Layer      | Technology           |
|------------|---------------------|
| Frontend   | React 19 + Vite     |
| Backend    | Node.js + Express   |
| Database   | PostgreSQL           |
| ORM        | Prisma               |
| Charts     | Recharts             |
| PDF        | PDFKit               |
| Excel      | ExcelJS              |
| Auth       | JWT + bcryptjs       |

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14 (running locally or remotely)
- **npm** (comes with Node.js)

## Setup Instructions

### 1. Clone and enter the project

```bash
cd bataknese-wedding-budget
```

### 2. Set up the database

Create a PostgreSQL database:

```bash
createdb bataknese_wedding
```

Or via psql:

```sql
CREATE DATABASE bataknese_wedding;
```

### 3. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/bataknese_wedding?schema=public"
JWT_SECRET="pick-a-strong-random-secret"
PORT=3001
```

### 4. Install dependencies and set up the database

```bash
# Backend
cd backend
npm install
npx prisma migrate dev --name init
npm run db:seed

# Frontend
cd ../frontend
npm install
```

### 5. Run the application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The app will be available at **http://localhost:5173**

### 6. Demo login

Use the seeded demo account:
- **Email:** demo@example.com
- **Password:** password123

## Project Structure

```
bataknese-wedding-budget/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js            # Sample seed data
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js        # Login, register, me
│   │   │   ├── projects.js    # CRUD for wedding projects
│   │   │   ├── categories.js  # CRUD for budget categories
│   │   │   └── export.js      # PDF and Excel export
│   │   ├── services/
│   │   │   ├── pdf.js         # PDF report generation
│   │   │   └── excel.js       # Excel report generation
│   │   └── index.js           # Express server entry
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js      # API client with auth
│   │   ├── components/
│   │   │   └── Navbar.jsx     # Navigation bar
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state management
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ProjectsPage.jsx
│   │   │   ├── NewProjectPage.jsx
│   │   │   └── ProjectDetailPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
| Method | Endpoint         | Description       |
|--------|-----------------|-------------------|
| POST   | /api/auth/register | Create account  |
| POST   | /api/auth/login    | Sign in         |
| GET    | /api/auth/me       | Get current user|

### Wedding Projects
| Method | Endpoint                     | Description              |
|--------|------------------------------|--------------------------|
| GET    | /api/projects                | List user's projects     |
| GET    | /api/projects/:id            | Get project detail       |
| POST   | /api/projects                | Create new project       |
| PUT    | /api/projects/:id            | Update project           |
| POST   | /api/projects/:id/finalize   | Finalize (lock) project  |
| DELETE | /api/projects/:id            | Delete project           |

### Budget Categories
| Method | Endpoint                                    | Description        |
|--------|---------------------------------------------|--------------------|
| POST   | /api/projects/:projectId/categories         | Add category       |
| PUT    | /api/projects/:projectId/categories/:id     | Update category    |
| DELETE | /api/projects/:projectId/categories/:id     | Delete category    |

### Export
| Method | Endpoint                          | Description      |
|--------|-----------------------------------|------------------|
| GET    | /api/projects/:id/export/pdf      | Download PDF     |
| GET    | /api/projects/:id/export/excel    | Download Excel   |

## Default Bataknese Wedding Categories

1. **Sinamot** (Bride Price) - Traditional marriage payment
2. **Ulos** (Traditional Cloth) - Sacred Batak textiles
3. **Jambar** (Ceremonial Gifts) - Tulang, hata, juhut portions
4. **Gondang** (Traditional Music) - Gondang sabangunan ensemble
5. **Gedung** (Venue - Jakarta) - Wedding venue and decoration
6. **Catering** - Food including traditional dishes (arsik, saksang)
7. **Dokumentasi** (Photo & Video) - Wedding documentation
8. **Wedding Organizer** - Full WO service
9. **Transport** - Guest shuttle and logistics
10. **Souvenir** - Wedding favors
11. **Others** - Miscellaneous / customizable
