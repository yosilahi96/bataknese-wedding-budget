# Bataknese Wedding Budget Tracker - Jakarta Edition

A full-stack web application to help Bataknese couples in Jakarta plan, track, and export wedding budgets. Built with React, Express, PostgreSQL, and Prisma.

## Features

- Create and manage wedding projects for Pesta Adat or 3M Ceremony workflows
- Wedding dates must be future dates when creating or editing project info
- Budget dashboard with planned vs actual tracking and Recharts visualizations
- Add, edit, and delete event-scoped budget categories
- Finalize projects to lock editing
- Vendor directory, vendor recommendations, vendor comparison, and selected-vendor budget integration
- Admin tools for vendors, vendor types, master categories, and users
- Export reports as PDF or Excel
- Friendly offline/network export error messages
- English and Bahasa Indonesia language switcher
- JWT authentication with password change support
- Responsive mobile-friendly UI

## Tech Stack

| Layer    | Technology         |
|----------|--------------------|
| Frontend | React 19 + Vite    |
| Backend  | Node.js + Express  |
| Database | PostgreSQL         |
| ORM      | Prisma             |
| Charts   | Recharts           |
| PDF      | PDFKit             |
| Excel    | ExcelJS            |
| Auth     | JWT + bcryptjs     |
| Tests    | Vitest + Jest      |

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm

## Setup

### 1. Enter the project

```bash
cd bataknese-wedding-budget-main
```

### 2. Create the database

```bash
createdb bataknese_wedding
```

Or with `psql`:

```sql
CREATE DATABASE bataknese_wedding;
```

### 3. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/bataknese_wedding?schema=public"
JWT_SECRET="pick-a-strong-random-secret"
PORT=3001
CORS_ORIGIN="http://localhost:5173"
ENABLE_API_DOCS=false
API_DOCS_SERVER_URL="http://localhost:3001"
API_DOCS_SERVER_DESCRIPTION="Local backend"
ENABLE_PUBLIC_REGISTRATION=true
```

For production, set `NODE_ENV=production`, use a unique `JWT_SECRET` of at least 32 characters, set `CORS_ORIGIN` to your deployed frontend URL, and leave `ENABLE_API_DOCS=false` unless you intentionally want public API docs.

### Render + Vercel + Supabase deployment

For the Render backend service, add these environment variables in **Render Dashboard > Service > Environment**:

```env
NODE_ENV=production
DATABASE_URL="your Supabase PostgreSQL connection string"
JWT_SECRET="a unique random secret of at least 32 characters"
CORS_ORIGIN="https://your-vercel-app.vercel.app"
ENABLE_API_DOCS=false
API_DOCS_SERVER_URL="https://your-render-service.onrender.com"
API_DOCS_SERVER_DESCRIPTION="Production backend"
ENABLE_PUBLIC_REGISTRATION=true
```

Render should use Node 20. The repository pinss this with `engines.node`, but you can also set `NODE_VERSION=20` in Render if needed.

If Render asks for commands, use:

```bash
Build Command: npm install && npm run build
Start Command: npm start
```

Do not build the frontend on Render when Vercel is hosting it. The root build script prepares the backend only, and the root install script installs the backend and runs Prisma from inside `backend`, where Prisma is pinned to this project's local version.

Supabase security lints require Row Level Security on tables exposed through the `public` schema. The Prisma migration `20260624000000_enable_supabase_rls` enables RLS for the app tables without adding anon/authenticated policies. This intentionally blocks direct Supabase REST access from public clients; the app should continue to access the database through the backend using the server-side `DATABASE_URL`. Apply it in production with `cd backend && npx prisma migrate deploy`.

For the Vercel frontend, add this environment variable in **Vercel Project > Settings > Environment Variables**:

```env
VITE_API_URL="https://your-render-service.onrender.com/api"
```

Redeploy Vercel after changing `VITE_API_URL`, because Vite reads this value at build time.

For Vercel, set the project root directory to `frontend`, or use:

```bash
Build Command: npm run build
Output Directory: dist
```

### 4. Install dependencies and prepare the database

From the repository root:

```bash
npm run install:all
cd backend
npx prisma migrate dev
npm run db:seed
```

You can also install each app manually:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 5. Run the app

Open two terminal windows.

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

The frontend runs at `http://localhost:5173`.

## Seeded Accounts

Demo accounts are for local development only. The seed script skips these users when `NODE_ENV=production`.

Local demo user:

- Email: `demo@example.com`
- Password: `password123`

Local admin user:

- Email: `admin@example.com`
- Password: `admin123`

For production, create your first admin account manually with a strong password, then do not publish or reuse the local demo credentials.

## Scripts

Root:

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install backend and frontend dependencies |
| `npm run build` | Build the frontend |
| `npm start` | Start the backend server |
| `npm run server` | Alias for backend start |

## Jenkins Pipeline

This repository includes a `Jenkinsfile` for CI plus post-deploy API automation triggering.

Required Jenkins setup:

- Install Node.js 20 and npm on the Jenkins agent.
- Create a Pipeline job that points to this repository and uses `Jenkinsfile`.
- Create a separate Jenkins job for the API automation repository, for example `api-automation`, using `C:\Users\yosil\OneDrive\Documents\api-automation` as its workspace/repository.
- After deployment, run this app pipeline with `API_BASE_URL` set to your deployed backend URL, for example `https://your-render-service.onrender.com`.
- Set `API_AUTOMATION_JOB` to the downstream Jenkins job name that runs the API automation repo.

Pipeline stages:

- Install backend dependencies and generate Prisma Client
- Run backend API route tests with Jest
- Install frontend dependencies
- Run frontend tests with Vitest
- Build the frontend
- Optionally run a deploy stage when `RUN_DEPLOY=true`
- Run a post-deploy smoke test against `GET /api/health` when `API_BASE_URL` is provided
- Trigger the separate API automation Jenkins job when `RUN_API_AUTOMATION=true`

If deployment is handled by Render/Vercel, keep `RUN_DEPLOY=false` and trigger this Jenkins job after deployment completes. If Jenkins should deploy too, replace the placeholder in the `Deploy` stage with your deployment command.

The downstream API automation job should accept an `API_BASE_URL` string parameter if the tests need to know which deployed API to target.

Backend:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Express with nodemon |
| `npm start` | Start Express |
| `npm test` | Run Jest tests |
| `npm run db:migrate` | Run Prisma migrate dev |
| `npm run db:seed` | Seed vendor/category data, plus local demo accounts outside production |
| `npm run db:reset` | Reset and reseed database |

Frontend:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite |
| `npm run build` | Build production frontend |
| `npm run preview` | Preview production build |
| `npm test` | Run Vitest tests |

## Project Structure

```text
bataknese-wedding-budget-main/
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma
|   |   |-- seed.js
|   |-- src/
|   |   |-- app.js
|   |   |-- index.js
|   |   |-- lib/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |   |-- admin.js
|   |   |   |-- auth.js
|   |   |   |-- categories.js
|   |   |   |-- export.js
|   |   |   |-- masterCategories.js
|   |   |   |-- projectVendors.js
|   |   |   |-- projects.js
|   |   |   |-- vendors.js
|   |   |   |-- vendorTypes.js
|   |   |-- services/
|   |   |-- __tests__/
|   |-- .env.example
|   |-- package.json
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |-- components/
|   |   |-- context/
|   |   |-- i18n/
|   |   |-- pages/
|   |   |-- utils/
|   |   |-- __tests__/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |   |-- index.css
|   |-- index.html
|   |-- vite.config.js
|   |-- package.json
|-- package.json
|-- README.md
```

## API Endpoints

Interactive Swagger docs are available after starting the backend:

- Swagger UI: `http://localhost:3001/api-docs`
- OpenAPI JSON: `http://localhost:3001/api-docs.json`

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/change-password` | Change password |

### Wedding Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| GET | `/api/projects/:id` | Get project detail |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| POST | `/api/projects/:id/finalize` | Finalize project |
| DELETE | `/api/projects/:id` | Delete project |

### Budget Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/projects/:projectId/events/:eventId/categories` | Add category |
| PUT | `/api/projects/:projectId/events/:eventId/categories/:id` | Update category |
| DELETE | `/api/projects/:projectId/events/:eventId/categories/:id` | Delete category |

### Exports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/export/pdf` | Download PDF |
| GET | `/api/projects/:id/export/excel` | Download Excel |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vendors` | List vendors with optional filters |
| GET | `/api/vendors/:id` | Get vendor detail |
| GET | `/api/vendors/recommend/:projectId` | Get recommendations for a project |
| GET | `/api/vendor-types` | List vendor types |
| GET | `/api/master-categories?eventType=PESTA_ADAT` | List master categories |

### Project Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:projectId/vendors` | List selected project vendors |
| POST | `/api/projects/:projectId/vendors` | Add vendor to project |
| DELETE | `/api/projects/:projectId/vendors/:vendorId` | Remove vendor from project |
| POST | `/api/projects/:projectId/vendors/:vendorId/add-to-budget` | Add vendor estimate to matching budget category |

### Admin

Admin endpoints require an authenticated admin user.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/vendors` | Create vendor |
| PUT | `/api/admin/vendors/:id` | Update vendor |
| DELETE | `/api/admin/vendors/:id` | Delete vendor |
| POST | `/api/admin/vendor-types` | Create vendor type |
| PUT | `/api/admin/vendor-types/:id` | Update vendor type |
| DELETE | `/api/admin/vendor-types/:id` | Delete vendor type |
| POST | `/api/admin/master-categories` | Create master category |
| PUT | `/api/admin/master-categories/:id` | Update master category |
| DELETE | `/api/admin/master-categories/:id` | Delete master category |
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/:id` | Update user |
| PUT | `/api/admin/users/:id/reset-password` | Reset user password |
| DELETE | `/api/admin/users/:id` | Delete user |

## Notes

- New and edited wedding projects must use a future wedding date.
- The frontend API client maps browser network failures, including offline export attempts, to user-friendly messages.
- The language selector currently covers the main user budget/export flow; some admin screens may still include English copy.
- The seed script creates vendor types, master budget categories, sample vendors, a demo user, and an admin user.
