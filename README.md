# Sistema de Asistencia UCSM

Production-grade attendance tracking system built for academic events at Universidad Católica de Santa María. Currently deployed for the **IV Seminario Internacional de Costos y Gestión de Operaciones** (Aug 1–3, 2026).

## Features

- **Barcode scanning** — Real-time PDF417 DNI scanning via device camera for frictionless check-in/check-out
- **Multi-day, multi-session** — Supports arbitrary event schedules with per-day, per-session granularity
- **Attendee classification** — Tag-based segmentation (participante / organizador) with bulk import support
- **Analytics dashboard** — KPIs, temporal distribution charts, retention rates, and data quality metrics
- **Export pipeline** — One-click export to Excel (.xlsx), CSV, and PDF with full filter support
- **Security hardened** — Rate limiting, account lockout, security headers (HSTS, CSP concepts, X-Frame-Options)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Next.js 16 (App Router, Turbopack) |
| UI | React 19, TypeScript 5, Tailwind CSS 4 |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Database | PostgreSQL (Neon serverless) |
| Auth | JWT via `jose` + `bcryptjs` (httpOnly cookies) |
| Scanner | `html5-qrcode` (PDF417 barcode decoder) |
| Exports | ExcelJS, jsPDF, native CSV generation |
| Validation | Zod schema validation on all inputs |
| Deployment | Vercel (auto-deploy on push to main) |

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Public routes (login)
│   ├── (dashboard)/        # Protected routes
│   │   ├── registro/       # Attendance registration (scanner)
│   │   ├── historial/      # History with filters & search
│   │   └── analitica/      # Analytics dashboard
│   └── api/                # REST endpoints
│       ├── auth/           # Login + session management
│       ├── asistencias/    # CRUD + exports + bulk operations
│       ├── analytics/      # Aggregated metrics
│       └── health/         # Connection warmup endpoint
├── components/             # React components (UI + domain)
├── context/                # Auth context (JWT state)
├── hooks/                  # Custom hooks (useAsistencias)
├── interfaces/             # TypeScript type definitions
├── lib/                    # Core utilities
│   ├── auth.ts             # JWT sign/verify + cookie config
│   ├── db.ts               # Prisma client singleton (pg Pool)
│   └── rate-limiter.ts     # In-memory fixed-window rate limiter
├── repositories/           # Data access layer (Prisma queries)
├── services/               # Business logic layer
└── validators/             # Zod schemas for input validation
```

**Request flow:** Client → Middleware (auth + rate limit + security headers) → API Route → Service → Repository → Prisma → PostgreSQL

## Getting Started

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Set DATABASE_URL and JWT_SECRET

# Setup database
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Signing key for JWT tokens | Yes |
| `APIPERU_TOKEN` | API Peru token for DNI lookup | Optional |

## Security

- **Rate limiting** — Per-IP limits on auth (5/min), API reads (60/min), writes (30/min), exports (3/min)
- **Account lockout** — 10 failed login attempts triggers 15-minute lockout
- **Security headers** — HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **Input validation** — Zod schemas on every endpoint
- **Auth** — JWT stored in httpOnly secure cookies with SameSite=Lax

## Seed Data

The seed script (`prisma/seed.ts`) provisions:
- Event: IV Seminario Internacional de Costos y Gestión de Operaciones (Aug 1–3)
- Admin user: `seminario`
- 25 organizing committee members with full attendance records across all days and sessions

## Author

**Gian Cruz** — Systems Engineering, Universidad Católica de Santa María
