# Multi-Tenant Salon Appointment Booking Marketplace - Requirements Specification

## 1. Executive Summary & Problem Scope
The goal of this system is to provide an appointment booking marketplace platform for salon businesses operating multiple physical store branches across cities and local neighborhoods (e.g., Surat - Athwa Lines, Punagam, Pal, Adajan, Althan; Ahmedabad - Bodakdev, Satellite; Vadodara - Alkapuri).

### Marketplace Discovery & Multi-Salon Tenant Model
* **Open Salon Directory:** The platform functions as a localized salon appointment discovery and booking marketplace (similar to Booksy, Fresha, or Airbnb).
* **Multi-Tenant Salon Listing:** Multiple independent salon businesses (e.g., *Salon Bonanza*, *The Barber King*, *Envi Salon*, *Luxe Studio*) list their businesses on the platform.
* **Multi-Store Management per Salon:** Each salon business owner/tenant can add and manage multiple physical store branches across city neighborhoods.
* **Customer Proximity Discovery:** Customers browsing the platform see a list of salons and branches available near them in their city (e.g., *"Salon Bonanza - Althan (1.2 km away)"*, *"The Barber King - Adajan"*), with search capability across salon brands and service names (e.g., "Haircut", "Balayage", "Beard Trim").

### UI/UX Design System Standard (Aura Minimalist Design System - DESIGN.md)
* **Visual Aesthetic:** Friendly modern SaaS anchored on a clean **pure white canvas (`#ffffff`)** with **solid black primary CTAs (`#111111`)**, subtle hairline borders (`#e5e7eb`), and soft-rounded cards (`12px`).
* **Typography:** Modern display headings (Plus Jakarta Sans / Inter) paired with crisp Inter for interface elements and JetBrains Mono for codes/timestamps.
* **Negative Design Constraints:**
  - **No Geeky Jargon in End-User UI:** Absolutely NO technical jargon shown to customers or staff (NO "256-bit SSL encryption", NO "bcrypt secure", NO "Tenant isolation" badges, NO "ISO approved" labels).
  - **No VIP / Diamond Badges:** No loyalty tier gamification, no diamond badges.
  - **No Clinical / Trichological Profiling:** Pure appointment booking; NO microscopic follicle diagnostics or medical questionnaires.
  - **No Footer Clutter:** No bulky legal copyright or privacy policy footers on customer booking views.
  - **No Operational Micromanagement:** No physical station cleaning timers or room turnaround countdowns.

### Target Scale & Technology Stack (POC)
* **Concurrent Users:** ~500 active users browsing and booking appointments simultaneously.
* **Architecture Style:** Monolithic / Modular Monolith using **Next.js (App Router) + GraphQL API + Drizzle ORM + PostgreSQL**.
* **Query Approach:** Strict usage of **GraphQL** operations and **Drizzle ORM** type-safe schema and relational queries (no raw queries except for Postgres GiST exclusion range constraints).
* **UI/UX Stack:** Next.js with **Shadcn UI (Radix UI Primitives + Tailwind CSS + Lucide Icons)** strictly styled to the **Aura design system tokens**.

---

## 2. User Roles & Personas

| Role | Responsibilities & Capabilities |
|---|---|
| **Salon Tenant Admin** | • Onboard and configure store branches (name, neighborhood, city, address, operating hours, closed days/holidays, chair/station count, timezone).<br>• Create and manage services per store with **configurable buffer times (5–10 mins)**.<br>• Ability to **clone/copy services from other branches** with single-click.<br>• **Create staff accounts** and assign them to primary store branches.<br>• Configure store default operating hours and default break times.<br>• **Executive & Operational Analytics:** View real-time dashboards for staff workload, revenue trends, booking volume, and peak hours.<br>• View comprehensive calendars and global booking history across all branches.<br>• Reschedule or cancel appointments on behalf of customers at any time. |
| **Staff Member** | • View personal daily and weekly appointment rosters.<br>• **Manage personal availability & leaves:** Mark specific days as on-leave / unavailable.<br>• **Custom break override:** Override standard store break hours (e.g. shift lunch from 1–2 PM to 3–4 PM).<br>• **Book appointments on behalf of customers** (e.g., walk-ins or phone reservations).<br>• Update appointment status through the real-time tracker (`IN_PROGRESS`, `COMPLETED`, or `NO_SHOW`).<br>• Reschedule appointments on behalf of customers (including within the 1-hour cutoff window).<br>• View in-app notifications regarding transfer updates and schedule changes. |
| **Customer** | • Browse salons and branches near them with **city and neighborhood filters** (e.g., Surat - Athwa, Althan, Adajan).<br>• Search for salons by brand or search for services across salons (e.g., "Haircut", "Beard Sculpting").<br>• View services offered at each branch (duration, price, cleanup buffer).<br>• Select a preferred staff member.<br>• View dynamically calculated available time slots based on service duration and admin-configured buffer cleaning times.<br>• Book appointments (instant confirmation without payment in POC).<br>• **Visual Appointment Tracking:** Live status timeline/stepper tracking the journey (`BOOKED` $\to$ `CONFIRMED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED`).<br>• **View personal booking history** (upcoming, completed, and rescheduled appointments).<br>• Record simple service preferences, styling notes, or allergies.<br>• **Self-reschedule / Cancel:** Allowed if greater than **1 hour** before appointment start (`> 60 mins`).<br>• In-app notification center for booking updates and reschedule requests. |

---

## 3. Functional Requirements (FR)

### FR-1: Multi-Tenancy & Store Management
* **FR-1.1 (Marketplace Multi-Tenancy):** Multi-tenant architecture isolating data by `tenant_id`. Multiple salon brands (*Salon Bonanza*, *The Barber King*, *Envi Salon*) operate independently on the platform.
* **FR-1.2:** A salon business can create and manage multiple store branches across different city zones (e.g., Athwa, Punagam, Pal, Adajan, Althan).
* **FR-1.3:** Store operating configuration includes opening time, closing time, operating days of the week, and timezone.
* **FR-1.4 (Store Closures & Holidays):** Configurable store-level closed days (weekly off, e.g. every Tuesday) and specific holiday dates. On closed days, all booking slots are automatically unavailable.
* **FR-1.5 (Physical Station / Chair Capacity):** Each branch has a maximum number of physical styling chairs/stations. Even if staff are free, concurrent bookings cannot exceed store chair capacity.

### FR-2: Service Catalog & Cross-Branch Service Cloning
* **FR-2.1:** Services belong to a store branch and specify title, duration (in minutes: 15, 30, 45, 120 mins), price, and description.
* **FR-2.2 (Admin-Configurable Buffer Time):** Configurable cleanup/turnaround buffer time (e.g., 5–10 minutes) managed by the Admin per service or store default. Automatically appended to the appointment interval.
* **FR-2.3 (Combo & Variable Duration):** Services can have variable durations, including long multi-hour combos (e.g., 2 hours).
* **FR-2.4 (Service Cloning):** When configuring a store branch, the Admin can browse services from other branches of the same salon brand and clone/copy them into the current branch with a single action, avoiding redundant data entry.
* **FR-2.5 (Store-Wide Staff Capability):** All staff members assigned to a store branch are qualified to deliver all active services offered by that store.

### FR-3: Staff Management, Shifts, Breaks & Leave Management
* **FR-3.1 (Admin Provisioning):** Salon Admin creates user accounts for staff members and assigns them to a specific branch.
* **FR-3.2 (Shift Schedules):** Configurable weekly shifts per staff member (e.g., Monday to Friday: 09:00 - 18:00).
* **FR-3.3 (Standard Breaks & Custom Overrides):**
  * Store-level standard break hours (e.g., 13:00 - 14:00).
  * Staff members can override their individual break hours (e.g., 15:00 - 16:00).
* **FR-3.4 (Staff Leaves & Ad-hoc Unavailability):**
  * Staff can mark themselves on leave for specific dates.
  * If a staff member marks leave on a day with existing confirmed appointments, the system flags those appointments as `RESCHEDULE_NEEDED` and triggers notifications to both customer and staff for rescheduling.

### FR-4: Dynamic Slot Generation Engine
* **FR-4.1:** Dynamic real-time calculation of available start times for a chosen date, staff member, and service duration + buffer.
* **FR-4.2 (Algorithm Rule):** A slot $[T_{\text{start}}, T_{\text{start}} + D + B)$ is valid if and only if:
  1. Store is open on that date (not a store weekly off or holiday).
  2. Staff is active and not on leave on that date.
  3. $[T_{\text{start}}, T_{\text{start}} + D + B) \subseteq [\text{Staff Shift Start}, \text{Staff Shift End}]$.
  4. $[T_{\text{start}}, T_{\text{start}} + D + B) \cap \text{Staff Breaks (Standard or Overridden)} = \emptyset$.
  5. $[T_{\text{start}}, T_{\text{start}} + D + B) \cap \text{Existing Confirmed Bookings} = \emptyset$.
  6. Total concurrent active store bookings during $[T_{\text{start}}, T_{\text{start}} + D) < \text{Store Chair Capacity}$.

### FR-5: Booking Creation, Live Tracking & 1-Hour Cutoff Policy
* **FR-5.1 (Customer Booking):** Customers can book a specific staff member, service, and timeslot at a branch.
* **FR-5.2 (Staff Booking on Behalf of Customer):** Staff or Admin can create a booking for a walk-in or phone customer (selecting customer name/phone, service, and timeslot).
* **FR-5.3 (Double-Booking Prevention):** Strict transactional concurrency control (`409 Conflict` if collision occurs).
* **FR-5.4 (Live Visual Status Tracking):** 
  Interactive visual timeline showing:
  `BOOKED` $\to$ `CONFIRMED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED` (or `CANCELLED` / `NO_SHOW` / `RESCHEDULE_NEEDED`).
* **FR-5.5 (1-Hour Cutoff Policy for Reschedule / Cancellation):** 
  * Customers can self-reschedule or cancel an appointment only if the scheduled start time is **more than 1 hour away** ($> 60\text{ minutes}$).
  * If less than 1 hour remains, customer self-service buttons are locked with a prompt: *"Please call the salon directly to reschedule."*
  * Staff and Admins retain full authority to reschedule or cancel at any time.

### FR-6: Staff Location Transfer & Reschedule Workflow
* **FR-6.1:** Staff can be transferred from Store A to Store B effective from a specific date.
* **FR-6.2 (No Automatic Reassignment):** Existing appointments are **not** automatically transferred to another staff member.
* **FR-6.3 (State Flagging):** Future appointments at the old store are automatically marked as `RESCHEDULE_NEEDED`.
* **FR-6.4 (Dual Rescheduling Path):**
  * **Customer Self-Reschedule:** Customers receive an in-app notification and can reschedule their appointment.
  * **Staff/Admin Reschedule:** Staff or Admin can contact the customer and reschedule/adjust the appointment on behalf of the customer.

### FR-7: In-App Notification Center
* **FR-7.1:** Persistent in-app notifications stored in the database.
* **FR-7.2:** Triggered events:
  * Appointment booked / confirmed (by customer or staff).
  * Staff transferred $\to$ notification sent to customer, staff, and admin.
  * Staff takes leave $\to$ notification sent to customers with affected bookings.
  * Appointment status updates (`IN_PROGRESS`, `COMPLETED`, `RESCHEDULE_NEEDED`, `CANCELLED`).
* **FR-7.3:** Notification center UI in Next.js showing unread counts and complete notification history.

### FR-8: Audit Logging & Customer Preferences
* **FR-8.1:** Full audit trail for every appointment modification (`CREATED`, `RESCHEDULED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`, `STAFF_TRANSFERRED`, `STAFF_LEAVE`).
* **FR-8.2:** Historical views:
  * Customer can view their personal appointment history.
  * Admin can view complete appointment history and audit logs across all stores.
* **FR-8.3 (Customer Notes & Allergies):** Simple styling notes (e.g. "scissor cut on top, low taper fade") and product allergy tags (e.g. "sensitive to ammonia bleach"). Strictly NO clinical/medical diagnosis questionnaires.

### FR-9: Authentication & Role-Based Access Control (RBAC)
* **FR-9.1:** Simple email & password authentication (passwords hashed using bcrypt/Argon2). Strictly NO Google OAuth, NO Phone/OTP login on sign-in.
* **FR-9.2:** Next.js Middleware-enforced RBAC:
  * `/admin/*` $\to$ `TENANT_ADMIN` only.
  * `/staff/*` $\to$ `STAFF` (and `TENANT_ADMIN`).
  * `/customer/*` $\to$ Authenticated Customers.

### FR-10: Tenant Admin Analytics & Executive Dashboard
* **FR-10.1 (Workload & Utilization Metrics):** Total hours booked vs. available shift hours per staff member (utilization percentage).
* **FR-10.2 (Revenue Metrics):** Estimated & completed revenue breakdown by branch, service category, and time period.
* **FR-10.3 (Peak Hour Heatmaps):** Visual distribution of busiest booking hours and days across store branches.
* **FR-10.4 (No-Show & Cancellation Rates):** Percentage of appointments completed vs. cancelled vs. marked as no-show.

---

## 4. Non-Functional Requirements (NFR)

* **Design Purity:** Strict implementation of the Aura design system tokens (`DESIGN.md`) across all screens.
* **Consistency:** Absolute prevention of overlapping bookings for the same staff member using database-level range exclusion constraints.
* **Type-Safety & ORM Purity:** 100% type-safe query execution using Drizzle ORM and GraphQL; no ad-hoc raw SQL strings.
* **Low Latency:** Dynamic slot availability query latency $< 100\text{ ms}$.
* **Throughput Capacity:** Sized for 500 active concurrent users (~25–50 RPS), fully performant on a single Next.js + PostgreSQL deployment.
