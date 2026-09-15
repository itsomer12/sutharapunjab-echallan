# Suthra Punjab — e-Challan Management System

A full-stack e-Challan issuance system for the Suthra Punjab Waste Management
Company. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma,
and PostgreSQL.

## Prerequisites

- Node.js 18+
- PostgreSQL database

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your real values:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` — your PostgreSQL connection string
- `DIRECT_URL` — direct PostgreSQL connection used by Prisma migrations
- `JWT_SECRET` — a long random string (at least 32 characters)
- `BLOB_READ_WRITE_TOKEN` — required for challan-photo uploads on Vercel

### 3. Run database migration

```bash
npx prisma migrate dev --name init
```

### 4. Seed the database

```bash
npm run db:seed
```

Before seeding, set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your shell or
`.env`. This creates the initial admin user without a committed default password.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Security note

The seed command requires an explicit administrator username and password. Do
not commit those values or add them to a browser-accessible environment variable.

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin dashboard routes (role-protected)
│   ├── inspector/       # Inspector routes (role-protected)
│   ├── login/           # Login page
│   └── api/auth/        # Auth API routes (login, logout)
├── components/          # Shared UI components
├── lib/                 # Utilities (db client, auth helpers)
└── middleware.ts         # Role-based route protection
prisma/
├── schema.prisma        # Database schema
└── seed.ts              # Seed script
```

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: bcrypt + JWT (httpOnly cookies)
- **Charts**: Recharts
- **Validation**: react-hook-form + zod
