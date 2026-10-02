# Aura — Multi-Tenant Salon Appointment Booking Marketplace: Requirements & Functional Specification

## 1. Executive Summary & Problem Scope

Aura is a multi-tenant appointment booking marketplace platform for salon businesses operating multiple physical store branches across cities and local neighborhoods (pilot deployment: Surat — Althan, Adajan, Athwa, Vesu).

### Marketplace Discovery & Multi-Salon Tenant Model
* **Open Salon Directory:** The platform functions as a localized salon appointment discovery and booking marketplace.
* **Multi-Tenant Salon Listing:** Multiple independent salon businesses (e.g., *Salon Bonanza*, *The Barber King*, *Envi Salon*, *Luxe Studio*) list their businesses on the platform with strict data isolation by `tenant_id`.
* **Multi-Store Management per Salon:** Each salon business owner/tenant can add and manage multiple physical store branches across city neighborhoods.
* **Customer Proximity Discovery:** Customers browsing the platform see a list of salons and branches available in their city neighborhoods with live station capacity indicators.

### Concurrency Integrity Standard
* **Guaranteed Chair Allocation:** Scheduling is tied directly to physical styling chairs. The system enforces zero double-booking on chairs using PostgreSQL `btree_gist` exclusion constraints.
* **Dedicated Station Prep Buffers:** Every service automatically appends a buffer window (5–10 mins) for station preparation and sanitization.
* **2-Hour Cancellation & Reschedule Guard:** Self-service modifications are strictly locked within 2 hours of the scheduled start time to preserve salon chair utilization.

---

## 2. User Roles & Personas

| Role | Persona | Responsibilities & Capabilities |
| :--- | :--- | :--- |
| **Customer** | **Sarah Jenkins** | • Browse salons and branches near them with neighborhood filter chips.<br>• Search for salons by brand or service name (e.g., "Haircut", "Balayage", "Beard Trim").<br>• Select preferred stylists and view dynamically calculated 15-minute start slots.<br>• Instant booking confirmation with digital contactless appointment pass.<br>• Real-time 4-step delivery tracker (`BOOKED` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED`).<br>• Self-service cancellation and reschedule outside the 2-hour window.<br>• Notification center for schedule updates. |
| **Stylist / Staff** | **Rahul Mehta** | • View personal daily appointment roster with service durations and client notes.<br>• 1-Click Quick Walk-in desk for on-the-spot chair reservation.<br>• Update appointment status (`IN_PROGRESS`, `COMPLETED`, `NO_SHOW`).<br>• Manage station breaks and schedule adjustments.<br>• Operational override to reschedule appointments at any time. |
| **Salon Tenant Admin** | **Mehul Patel** | • Cold-start branch creation (`POST /api/admin/outlets`) with address, locality, and chair count.<br>• Clone service catalogs between branches with single-click synchronization.<br>• Direct staff provisioning with custom roles, dynamic station assignment, and instant login info.<br>• Real-time operational KPI dashboard (daily revenue, chair utilization, on-duty stylists).<br>• Edit staff profiles, titles, and assigned chairs (`PATCH /api/admin/staff`).<br>• Manage store operating hours and emergency closures. |

---

## 3. Functional Requirements (FR)

### FR-1: Multi-Tenancy & Store Management
- **FR-1.1 (Marketplace Multi-Tenancy):** Multi-tenant architecture isolating data by `tenant_id`. Multiple salon brands operate independently on the platform.
- **FR-1.2 (Cold-Start Branch Creation):** Salon Admins can create new physical branch outlets from scratch (`POST /api/admin/outlets`), specifying branch name, neighborhood locality, full address, contact details, operating hours, and physical chair count.
- **FR-1.3 (Store Capacity Configuration):** Each branch specifies its total physical styling chair count. Concurrent bookings cannot exceed active physical chair stations.
- **FR-1.4 (Store Operating Hours & Closures):** Operating hours and closed days (e.g., Tuesday weekly off or holiday closures) are configurable. Closed days automatically suppress slot generation.

### FR-2: Service Catalog & Cross-Branch Service Cloning
- **FR-2.1 (Service Definitions):** Services specify title, duration (in minutes: 15, 30, 45, 60, 120 mins), price, and customer description.
- **FR-2.2 (Preparation Buffer):** Configurable cleanup/prep buffer (5–10 minutes) appended to appointment ranges to ensure station turnover readiness.
- **FR-2.3 (Cross-Branch Cloning):** Admins can clone entire service catalogs from an existing branch to a new branch in a single transaction, eliminating redundant manual setup.

### FR-3: Staff Management & Dynamic Station Allocation
- **FR-3.1 (Direct Provisioning):** Admins create staff accounts with immediate active credentials (no email invite dependency), custom role entry (e.g. Master Stylist, Senior Colorist), and dynamic station selection up to store chair capacity.
- **FR-3.2 (Staff Profile Editing):** Admins can update staff names, role titles, chair station assignments, and passwords via `PATCH /api/admin/staff`.
- **FR-3.3 (Shifts & Working Days):** Shift configuration per stylist with assigned days of the week and operating hours.

### FR-4: Deterministic Concurrency Engine & Scheduling
- **FR-4.1 (PostgreSQL GiST Exclusion):** Appointments utilize PostgreSQL `tstzrange` intervals with `EXCLUDE USING GIST (store_id WITH =, assigned_chair WITH =, slot_range WITH &&)`. Overlapping reservations on the same physical chair are rejected at the database engine level.
- **FR-4.2 (15-Minute Slot Generation):** Generates candidate start intervals matching stylist working shifts, skipping slots that collide with existing bookings or store closures.
- **FR-4.3 (Instant Slot Reclamation):** When an appointment is cancelled, its physical chair and time range immediately become available for booking.

### FR-5: Contactless Digital Appointment Pass & Lifecycle
- **FR-5.1 (Digital Pass):** Displays booking reference (`#AURA-SURAT-...`), service breakdown, assigned physical chair station, and geometric QR code for desk check-in.
- **FR-5.2 (Live Visual Tracker):** 4-step delivery-style status stepper (`BOOKED` → `CONFIRMED` → `IN_PROGRESS` → `COMPLETED`).
- **FR-5.3 (2-Hour Guard):** Self-service reschedule and cancellation requests within 2 hours of appointment start are rejected with HTTP 403 and descriptive guidance.

### FR-6: Notifications & User Experience
- **FR-6.1 (Toast Notification System):** Accessible, animated, auto-dismissing toast notifications for all system feedback.
- **FR-6.2 (Notification Center):** In-app notification inbox with read/unread filtering for booking confirmations and schedule notices.
- **FR-6.3 (Direct Password Reset):** 2-step in-app security passcode reset (`4892`) enabling immediate account recovery without SMTP dependencies.

---

## 4. Verification & Quality Standards

- **Playwright E2E Suite**: 55 canonical tests covering all user journeys.
- **Backend Workflow Suite**: 23 full-stack tests validating authentication, discovery, and GiST overlap locks.
- **Concurrency & Edge-Case Suite**: 20 tests validating GiST exclusion constraints, instant slot reclamation, and API RBAC boundaries.
- **Total Test Coverage**: 98 tests passing with 100% success rate.
