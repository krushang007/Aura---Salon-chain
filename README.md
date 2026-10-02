<div align="center">

# ✂️ Aura — Enterprise Salon Appointment Marketplace & Multi-Branch Engine

**A production-grade, multi-tenant salon appointment booking and operations engine built with Next.js 14 App Router, PostgreSQL, Drizzle ORM, and Supabase.**

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend%20Ready-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=for-the-badge&logo=drizzle)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%203.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Playwright Tests](https://img.shields.io/badge/Playwright-55%2F55%20Passed-green?style=for-the-badge&logo=playwright)](https://playwright.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

[Features](#-key-capabilities) •
[Architecture](#-system-architecture) •
[Quickstart](#-quickstart-guide) •
[Demo Credentials](#-demo-accounts) •
[Things to Remember](#-things-to-remember--critical-constraints) •
[Troubleshooting](#-troubleshooting--faq) •
[Contributing](#-contributing) •
[Documentation](#-documentation-index)

</div>

---

## 📖 Overview

**Aura** is an open-source, multi-tenant salon appointment marketplace and branch management platform engineered for multi-outlet salon chains. It solves the critical operational challenge of **physical chair double-booking** by combining PostgreSQL `btree_gist` exclusion constraints with dynamic interval scheduling, seamless staff roster operations, and unified Google OAuth 2.1 authentication.

Designed for high-concurrency salon environments across city localities (featuring a canonical pilot deployment in Surat: Althan, Adajan, Vesu, and Athwa), Aura provides three dedicated, role-aware user experiences:
1. **Consumers**: Discover nearby salon outlets, pick stylists, reserve guaranteed physical styling chairs, and track their visit via a contactless digital appointment pass.
2. **Stylists & Staff**: Real-time daily station roster, break-time adjustments, and 1-click on-the-spot walk-in booking desk.
3. **Salon Admins**: Command center for cold-start branch creation, cross-outlet service cloning, custom staff provisioning, dynamic station allocation, and live operational analytics.

---

## 🌟 Key Capabilities

### 🏢 Multi-Tenant Marketplace & Neighborhood Discovery
- **Surat Pilot Directory**: Explore neighborhood branches (Althan, Adajan, Athwa, Vesu) with active styling chair counters, real-time availability badges, and curated service catalogs.
- **Uniform Card Grid & Fallback Containers**: Symmetrically aligned salon cards with responsive flex containers ensuring zero visual displacement regardless of service count.

### 🛡️ Concurrency Guard: GiST Physical Chair Lock Engine
- **Mathematical Zero Double-Booking**: Leverages PostgreSQL `tstzrange` with `EXCLUDE USING GIST` constraints (`uq_no_chair_double_booking`). Even during concurrent burst traffic, two appointments can never lock the same physical styling chair at overlapping intervals.
- **Dynamic 15-Minute Slot Calculator**: Computes service durations with dedicated station preparation buffers (5–10 mins) and stylist shift schedules.

### 🎫 Contactless Digital Appointment Pass
- **Live 4-Step Visual Tracker**: Real-time delivery-style timeline (`BOOKED` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED`).
- **Geometric In-App QR Code**: Contactless salon desk check-in with assigned physical station details (e.g. `Chair 03 — Wash Bay A`).
- **Strict 2-Hour Cutoff Guard**: Self-service rescheduling and cancellations strictly enforced outside the 2-hour policy window to protect salon chair utilization.

### 💈 Stylist Command Center & Quick Walk-ins
- **Daily Appointments Roster**: Chronological client timeline with service durations, client notes, and status transition buttons.
- **1-Click Walk-in Desk**: On-the-spot walk-in modal that instantly locks chair stations without calendar friction.

### 📊 Admin Operations & Cold-Start Provisioning
- **Zero-Store Cold Start**: Create brand-new salon branches (`POST /api/admin/outlets`) with locality picker, address, contact details, and physical chair capacity.
- **Service Catalog Synchronization**: Clone entire service catalogs between branch outlets with one click.
- **Dynamic Staff Management**: Support for custom roles, dynamic station assignment up to store capacity, visible password generation, and real-time profile editing (`PATCH /api/admin/staff`).
- **Operational KPI Dashboard**: Real-time metrics for daily revenue, active chair utilization, on-duty stylists, and active branch outlets.

### 🔔 Modern Toast Notifications & Accessible UX
- **Zero Native Alerts**: Replaced all native `window.alert()` calls with an accessible, auto-dismissing Toast notification system (`ToastProvider` + `useToast`).
- **Scrollable Modal Architecture**: Guaranteed viewport ceilings (`max-h-[90vh]`) and scrollable containers preventing clipped action buttons on mobile and laptop screens.
- **Direct Password Reset**: 2-step in-app security passcode reset (`4892`) eliminating SMTP email delivery dependencies.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Clients [Client Layer - Next.js 14 App Router]
        CustomerApp["Customer Marketplace & Booking Engine"]
        StaffApp["Stylist Daily Operations & Walk-ins"]
        AdminApp["Multi-Branch Operations & Analytics"]
    end

    subgraph SecurityLayer [Security & Session Boundary]
        EdgeMiddleware["Next.js Edge Middleware (Auth Guard)"]
        RBAC["Role-Based Access Control"]
        SessionGovernance["HMAC-SHA256 Session & Supabase Cookie Sync"]
    end

    subgraph APILayer [API & Business Logic Layer]
        GraphQLYoga["GraphQL Yoga Engine (/api/graphql)"]
        RESTEndpoints["Next.js REST Handlers (/api/*)"]
        SlotCalculator["15-Min Dynamic Slot & Buffer Engine"]
        CutoffPipeline["2-Hour Strict Cutoff Pipeline"]
    end

    subgraph DataLayer [PostgreSQL Consistency Layer]
        DrizzleORM["Drizzle ORM Query & Transaction Layer"]
        PostgresDB[("PostgreSQL Managed Database (Supabase)")]
        GiSTConstraint["btree_gist Physical Chair Exclusion Locks"]
    end

    CustomerApp --> EdgeMiddleware
    StaffApp --> EdgeMiddleware
    AdminApp --> EdgeMiddleware

    EdgeMiddleware --> RBAC
    RBAC --> SessionGovernance
    RBAC --> RESTEndpoints
    RBAC --> GraphQLYoga

    RESTEndpoints --> SlotCalculator
    RESTEndpoints --> CutoffPipeline
    RESTEndpoints --> DrizzleORM
    GraphQLYoga --> DrizzleORM

    SlotCalculator --> GiSTConstraint
    DrizzleORM --> PostgresDB
    PostgresDB --> GiSTConstraint
```

---

## 👥 Demo Accounts

The database comes pre-seeded with canonical demo credentials across all platform roles:

| Role | Email | Password | Assigned Branch / Chair | Destination Portal |
| :--- | :--- | :--- | :--- | :--- |
| **Customer** | `sarah@example.com` | `Password@123` | Surat Pilot Marketplace | `/appointments` |
| **Stylist** | `rahul@salonbonanza.com` | `Password@123` | Althan Branch • Chair 03 | `/staff` |
| **Stylist** | `priya@salonbonanza.com` | `Password@123` | Althan Branch • Chair 01 | `/staff` |
| **Staff (Direct)** | `abc@gmail.com` | `Password@123` | Althan Branch • Chair 02 | `/staff` |
| **Salon Admin** | `admin@salonbonanza.com` | `Password@123` | Multi-Branch Executive | `/admin` |

---

## 📱 Multi-Device Visual Directory

Aura is responsive across Mobile (375 × 812) and Desktop (1440 × 900) viewports:

| View / Screen | Desktop View (1440 × 900) | Mobile View (375 × 812) |
| :--- | :--- | :--- |
| **Marketplace Discovery** | [Desktop Preview](docs/screenshots/home_desktop.png) | [Mobile Preview](docs/screenshots/home_mobile.png) |
| **Store Booking Engine** | [Desktop Preview](docs/screenshots/book_store_desktop.png) | [Mobile Preview](docs/screenshots/book_store_mobile.png) |
| **Admin Command Center** | [Desktop Preview](docs/screenshots/admin_dashboard_desktop.png) | *Responsive Dashboard Layout* |
| **Authentication Portal** | [Desktop Preview](docs/screenshots/login_desktop.png) | [Mobile Preview](docs/screenshots/login_mobile.png) |
| **Direct Password Reset** | [Desktop Preview](docs/screenshots/forgot_password_desktop.png) | [Mobile Preview](docs/screenshots/forgot_password_mobile.png) |
| **Partner Registration** | [Desktop Preview](docs/screenshots/partner_register_desktop.png) | [Mobile Preview](docs/screenshots/partner_register_mobile.png) |
| **Help & Concierge** | [Desktop Preview](docs/screenshots/help_desktop.png) | [Mobile Preview](docs/screenshots/help_mobile.png) |
| **Terms of Service** | [Desktop Preview](docs/screenshots/terms_desktop.png) | [Mobile Preview](docs/screenshots/terms_mobile.png) |
| **Privacy Policy** | [Desktop Preview](docs/screenshots/privacy_desktop.png) | [Mobile Preview](docs/screenshots/privacy_mobile.png) |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.17.0+ or v20.x
- **Package Manager**: `npm` (included with Node.js)
- **PostgreSQL Database**: Supabase Managed Postgres (recommended) or local PostgreSQL v15+

### 2. Clone Repository
```bash
git clone https://github.com/krushang007/Aura---Salon-chain.git
cd Aura---Salon-chain
```

### 3. Environment Configuration
Copy `.env.example` to create your local `.env.local`:
```bash
cp .env.example .env.local
```

Configure your credentials inside `.env.local`:
```env
# Database Connection (Requires btree_gist extension)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase Project Credentials
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication Secret (32+ character random string)
AUTH_SECRET=your_32_character_random_hex_secret_here

# Application Defaults
DEFAULT_TENANT_SLUG=bonanza
DEFAULT_TIMEZONE=Asia/Kolkata
PORT=3000
```
> For complete instructions on provisioning a Supabase project, refer to the [Supabase Setup Guide](docs/SUPABASE_SETUP.md).

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Database Migrations & Multi-Branch Seed
Initialize the PostgreSQL schema and populate the Surat pilot dataset:
```bash
# Push Drizzle schema migrations
npm run db:migrate

# Seed branches, stylists, services, and chairs
npm run db:seed
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Quality Assurance

Aura maintains a comprehensive 98-test verification suite covering end-to-end user journeys, database GiST exclusion constraints, and API RBAC fault tolerance:

```bash
# Run all 55 Playwright End-to-End tests
npm test

# Run backend full-stack workflow test suite (23 tests)
npm run test:workflows

# Run concurrency, GiST locks, and edge-case test suite (20 tests)
npm run test:edge-cases

# Run all test suites sequentially
npm run test:all
```

### Test Suite Matrix (98 / 98 Passed — 100%)
| Suite Name | Scope | Tests | Pass Rate |
| :--- | :--- | :---: | :---: |
| **Playwright E2E** | Authentication, discovery, booking, digital pass, reschedule modal, staff portal, admin operations | 55 | 100% |
| **Backend Workflows** | Unified auth, HMAC tokens, Surat branch discovery, chair allocation, GiST locks, cancellation cutoff | 23 | 100% |
| **Concurrency & Edge Cases** | Postgres GiST overlap constraint, slot reclamation, 2-hr cutoff rejection, malformed UUIDs, RBAC guards | 20 | 100% |
| **Total Test Coverage** | **All System Verifications** | **98** | **100%** |

---

## 📌 Things to Remember & Critical Constraints

1. **PostgreSQL `btree_gist` Extension**:
   - The double-booking prevention engine strictly requires the `btree_gist` extension.
   - Run `CREATE EXTENSION IF NOT EXISTS btree_gist;` in your Supabase SQL editor before applying migrations.
2. **2-Hour Cancellation & Reschedule Guard**:
   - Customers cannot self-reschedule or cancel appointments within 2 hours of the scheduled start time.
   - Stylists and Salon Admins retain operational override privileges to reschedule appointments at any time.
3. **Session Cookie Governance**:
   - User authentication synchronizes an HMAC-signed `aura_session` cookie alongside Supabase `sb-*` auth cookies.
   - On logout, both cookie families and browser `localStorage` / `sessionStorage` tokens are purged to prevent phantom sessions.
4. **Dedicated Station Prep Buffers**:
   - Every service includes an admin-configurable preparation and cleanup buffer (5–10 mins).
   - The slot calculator automatically appends this buffer to prevent overlapping station bookings.
5. **No Email Server Dependency**:
   - For environments without active SMTP credentials, password resets use an instant in-app security passcode (`4892`) or manager desk assistance.

---

## 🔧 Troubleshooting & FAQ

### Q1: `PostgresError: type "tstzrange" does not exist` or `operator class does not exist`
**Cause**: The PostgreSQL `btree_gist` extension is not enabled in your database.
**Solution**: Open your Supabase SQL Editor or `psql` console and execute:
```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

### Q2: "No available slots for this date" appears on the booking page
**Cause**: The selected stylist may not have a working shift configured for that specific day of the week, the branch is marked closed on that date, or all daily chair stations are booked.
**Solution**: Try selecting an alternate day, another stylist, or check staff shift assignments in the Admin Dashboard (`/admin`).

### Q3: `22P02: invalid input syntax for type uuid`
**Cause**: An endpoint was called with a malformed non-UUID identifier.
**Solution**: Aura Route Handlers include a strict regex guard (`UUID_REGEX`). If a malformed ID is supplied, the API returns a clean HTTP 400 response with natural language feedback rather than crashing the database connection.

### Q4: Modal buttons are cut off on small laptop screens or mobile devices
**Cause**: Content inside modal dialogs exceeding viewport height.
**Solution**: All Aura modals are wrapped in `<Modal>` with `max-h-[90vh] flex flex-col` and an inner `overflow-y-auto` scrollable container. Action buttons remain sticky and accessible on all screen heights.

---

## 🤝 Contributing

We welcome community contributions! Please follow these guidelines:

1. **Fork the Repository**:
   ```bash
   git checkout -b feature/amazing-feature
   ```
2. **Adhere to Code Standards**:
   - Follow the [Aura Minimalist Design System](DESIGN.md).
   - Strictly avoid raw `window.alert()` calls; use the centralized Toast system (`useToast()`).
   - Use Tailwind CSS design tokens rather than arbitrary ad-hoc classes.
   - Maintain a single `<h1>` per page for SEO and accessibility.
3. **Validate Tests**:
   Ensure all 98 tests pass before submitting your PR:
   ```bash
   npm run test:all
   ```
4. **Commit & Pull Request**:
   Use conventional commits (`feat:`, `fix:`, `docs:`, `chore:`):
   ```bash
   git commit -m "feat: add multi-service appointment bundling"
   git push origin feature/amazing-feature
   ```

---

## 📚 Documentation Index

- **[DESIGN.md](DESIGN.md)**: Aura minimalist design tokens, color palette, typography, and UI primitives.
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: System topology, modular monolith architecture, and security boundaries.
- **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)**: Step-by-step production setup for Supabase Auth, Google OAuth, and database migrations.
- **[docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)**: Relational schema, GiST exclusion constraints, and index strategy.
- **[docs/REQUIREMENTS.md](docs/REQUIREMENTS.md)**: Comprehensive business requirements and user persona journeys.
- **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**: Production deployment, Docker Compose, and CI/CD pipelines.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built with precision by the Aura Core Engineering Team • Contact: <a href="mailto:contact@kaibuild.space">contact@kaibuild.space</a></sub>
</div>
