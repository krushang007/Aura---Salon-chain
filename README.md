# Aura - Multi-Tenant Salon Appointment Marketplace

A modern, high-performance salon appointment booking and multi-store management platform built with **Next.js 14 (App Router)**, **PostgreSQL**, **Drizzle ORM**, and **Tailwind CSS**, designed for direct deployment with **Supabase Backend Services**.

---

## 🌟 Key Features

- **Multi-Tenant Marketplace Discovery**: Neighborhood-level search across Surat (Althan, Adajan, Athwa, Vesu) with live chair capacity indicators and service menus.
- **Unified Authentication with Google SSO**: Single sign-in card with zero role selector tabs, automatically routing Customers, Stylists, and Salon Admins to their respective portals.
- **Deterministic GiST Slot Lock Engine**: PostgreSQL `btree_gist` exclusion constraints guaranteeing mathematically zero simultaneous double-bookings on physical chair stations.
- **Dynamic 15-Minute Slot Calculator**: Computes service durations with configurable buffer cleanup windows (5–10 mins) and store operating hours.
- **Contactless Digital Appointment Pass**: In-app pass featuring custom geometric QR codes, arrival guidance, and live 4-step visual delivery tracker (`BOOKED` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED`).
- **Staff Operations Roster & Quick Walk-ins**: Daily chair schedule management, break-time adjustments, and 1-click walk-in/phone booking desks.
- **Salon Partner Multi-Branch Administration**: Cross-branch service catalog cloning, stylist relocation workflows, capacity adjustments, and performance metrics.
- **Automated Customer Self-Service**: In-app rescheduling and cancellations strictly enforced outside the 2-hour policy window.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router, Server & Client Components), React 18, TypeScript |
| **Styling** | Tailwind CSS, Aura Minimalist Design System, Lucide Icons |
| **Database** | PostgreSQL (v15+) with `btree_gist` extensions |
| **Backend & ORM** | Drizzle ORM, GraphQL Yoga, Next.js Route Handlers |
| **Cloud Target** | [Supabase](https://supabase.com) (Auth, Managed Postgres, Realtime WAL, Storage) |
| **Testing** | Playwright E2E Test Suite (51 canonical user journeys) |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18.17+ or Node.js 20+
- PostgreSQL database (Local or Cloud Supabase / Neon instance)

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and configure your database connection:
```bash
cp .env.example .env.local
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Multi-Branch Seed
Run migrations and populate the canonical Surat demo dataset (Salon Bonanza branches, stylists, services, and chairs):
```bash
npm run db:migrate
npm run db:seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the marketplace.

---

## 🧪 Testing

The platform includes a comprehensive Playwright test suite validating all 51 canonical user journeys:

```bash
# Run all end-to-end tests
npx playwright test

# Run tests with UI runner
npx playwright test --ui
```

---

## 📚 Architectural & Design Documentation

- **[requirements.md](requirements.md)**: Comprehensive functional specifications and user personas.
- **[architecture.md](architecture.md)**: System architecture, component topology, and data flow.
- **[DESIGN.md](DESIGN.md)**: Aura minimalist design system tokens, typography, and UI primitives.
- **[postgres_db_design.md](postgres_db_design.md)**: Relational schema, GiST exclusion constraints, and index strategy.
- **[supabase_migration_roadmap.md](supabase_migration_roadmap.md)**: Full-stack Supabase transition plan, Google OAuth / SSO PKCE setup, and open-source bootstrap.

---

## 📄 License
MIT License. Open-source and ready for production deployment.
