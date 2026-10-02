# Multi-Tenant Salon Appointment Booking System - Architecture Document

## 1. Architectural Overview & Philosophy

For this Proof of Concept (POC) supporting **~500 active concurrent users**, the system uses a **Modular Monolith** with **Next.js (App Router) + GraphQL + Drizzle ORM + PostgreSQL**.

* **Front-End:** Next.js React Server Components & Client Components styled with **Shadcn UI (Radix Primitives + Tailwind CSS + Lucide Icons)**.
* **API Layer (GraphQL):** Unified GraphQL Route Handler (`/api/graphql` via GraphQL Yoga on Next.js) for type-safe queries, mutations, and fine-grained data fetching.
* **Data Access Layer (Drizzle ORM):** 100% type-safe SQL queries, transactions, and schema management via **Drizzle ORM**. Raw SQL is strictly limited to PostgreSQL-specific range operators.
* **Storage & Consistency Engine:** PostgreSQL with native `tstzrange` range types and `EXCLUDE USING GIST` constraints.
* **Live Visual Tracking & Event Bus:** Delivery-style visual status timeline (`BOOKED` $\to$ `CONFIRMED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED`) with immutable audit trails directly in PostgreSQL.
* **DevOps & Deployment:** AWS EC2 containerized deployment with GitHub Actions CI/CD and Docker Compose (see [deployment_and_devops.md](file:///Users/krushang/Desktop/Test/Booking/deployment_and_devops.md)).

```
┌────────────────────────────────────────────────────────────────────────┐
│             Next.js Web Client UI (Shadcn UI + Radix UI)               │
│  ┌────────────────────┬──────────────────────┬──────────────────────┐  │
│  │   Customer App     │     Staff Portal     │   Admin Dashboard    │  │
│  │  - Branch Locator  │  - Roster & Schedule │  - Multi-Store Mgmt  │  │
│  │  - Dynamic Slots   │  - Book for Customer │  - Staff Onboarding  │  │
│  │  - Booking History │  - Mark Leave / Off  │  - Transfer Stylists │  │
│  │  - Notifications   │  - Custom Breaks     │  - Service Cloning   │  │
│  │  - Live Status Bar │  - Reschedule Client │  - Buffer Config     │  │
│  │  - Notes / Allergy │  - Attendance Status │  - Workload & Revenue│  │
│  └────────────────────┴──────────────────────┴──────────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ GraphQL Queries & Mutations
┌───────────────────────────────────▼────────────────────────────────────┐
│              Next.js Middleware (Auth & RBAC Context)                  │
│  - Extracts JWT session from secure HTTP-only cookies                  │
│  - Injects tenant_id, user_id, and role into GraphQL Context           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│               GraphQL API Layer (/api/graphql Route Handler)           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Resolvers (Queries, Mutations):                                  │  │
│  │  - stores, services, cloneServices                               │  │
│  │  - staffAvailability, calculateSlots (incl. buffer)              │  │
│  │  - createAppointment, rescheduleAppointment (>1h cutoff guard)   │  │
│  │  - transferStaff, markStaffLeave                                 │  │
│  │  - adminAnalytics, notifications, markNotificationRead           │  │
│  └──────────────────────────────┬───────────────────────────────────┘  │
│                                 ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Design Patterns Core:                                            │  │
│  │  • Chain of Responsibility: Validation & Cutoff Pipeline         │  │
│  │  • Strategy Pattern: Slot Finder & Duration Calculator           │  │
│  │  • State Pattern: Live Visual Tracking & State Machine           │  │
│  │  • Observer Pattern: Notification & Audit Event Dispatcher       │  │
│  │  • Repository / Unit of Work: Drizzle Transactions & Range Locks │  │
│  └──────────────────────────────┬───────────────────────────────────┘  │
└─────────────────────────────────┼──────────────────────────────────────┘
                                  │ Type-safe Drizzle ORM Client
┌─────────────────────────────────▼──────────────────────────────────────┐
│                       PostgreSQL Database                              │
│  - Multi-tenant discriminator (tenant_id)                              │
│  - GIST Range Exclusion Locks (Prevent double-booking)                 │
│  - Store Closures, Staff Shifts, Breaks, Leaves, & Chair Limits        │
│  - In-App Notifications & Audit Logs                                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Software Design Patterns in the Architecture

### 2.1 Chain of Responsibility Pattern: Booking & Reschedule Validation Pipeline
Requests pass through sequential validation handlers before hitting the database:

```
Incoming Reschedule / Cancel Request
       │
       ▼
[RoleCheckHandler] ── If Actor == 'CUSTOMER':
       │               Check if (AppointmentStartTime - NOW()) > 60 mins.
       │               If <= 60 mins -> Reject: "Must call salon to modify within 1 hour"
       │
       ▼
[StoreOpenCheckHandler] ── (Fail: "Store closed on this date / holiday")
       │
       ▼
[StaffLeaveCheckHandler] ── (Fail: "Staff member is on leave")
       │
       ▼
[ShiftHoursCheckHandler] ── (Fail: "Slot outside staff working shift")
       │
       ▼
[StaffBreakCheckHandler] ── (Fail: "Slot intersects staff lunch/tea break")
       │
       ▼
[ChairCapacityHandler] ── (Fail: "All styling chairs in store are full at this hour")
       │
       ▼
[SlotConflictHandler] ── (Fail: "Staff member already booked for this time")
       │
       ▼
[Commit Booking / Reschedule to DB]
```

### 2.2 State Pattern & Visual Delivery-Style Tracker
Appointments transition through strict states. The front-end renders a visual progress stepper:

```
  [1] BOOKED        [2] CONFIRMED         [3] IN_PROGRESS        [4] COMPLETED
 (Slot reserved)   (Staff assigned)      (Client in chair)      (Service finished)
       ●─────────────────●───────────────────────●──────────────────────●
       
  * Exception States:
    - [ RESCHEDULE_NEEDED ]: Stylist transferred or on leave -> Prompts client/staff
    - [ NO_SHOW ]: Client failed to show up after 15 mins
    - [ CANCELLED ]: Cancelled (> 1 hr prior by customer, or by staff)
```

### 2.3 Strategy Pattern: Dynamic Slot Sizing with Admin-Configurable Buffers
* Dynamic slot calculation automatically appends `buffer_minutes` (configured by Admin on the service or store, e.g. 10 mins).
* For a 50-minute service with 10-minute buffer:
  $$\text{Effective Block} = 50 + 10 = 60\text{ minutes}$$
* The slot engine finds continuous free windows $\ge 60\text{ min}$, ensuring the stylist's station is sanitised before the next client arrives.

### 2.4 Observer / Pub-Sub Pattern: Event-Driven Notifications & Audit Logs
Every state transition (`BOOKED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `RESCHEDULED`, `STAFF_TRANSFERRED`, `LEAVE_TAKEN`) publishes a domain event:
* `InAppNotificationObserver`: Inserts notification rows with unread badges.
* `AuditTrailObserver`: Inserts an immutable row into `appointment_audit_logs`.

---

## 3. GraphQL Schema Design (`schema.graphql`)

```graphql
enum UserRole {
  TENANT_ADMIN
  STAFF
  CUSTOMER
}

enum AppointmentStatus {
  BOOKED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
  RESCHEDULE_NEEDED
}

type Store {
  id: ID!
  name: String!
  city: String!
  address: String
  timezone: String!
  openingTime: String!
  closingTime: String!
  weeklyOffDay: Int
  totalStylingChairs: Int!
  services: [Service!]!
  staff: [StaffProfile!]!
}

type Service {
  id: ID!
  title: String!
  description: String
  durationMinutes: Int!
  bufferMinutes: Int!
  price: Float!
  isActive: Boolean!
}

type StaffProfile {
  id: ID!
  user: User!
  currentStore: Store!
  title: String
  isActive: Boolean!
  shifts: [StaffShift!]!
  breakOverrides: [StaffBreakOverride!]!
}

type TimeSlot {
  startTime: String!
  endTime: String!
}

type Appointment {
  id: ID!
  store: Store!
  staff: StaffProfile!
  customer: User!
  service: Service!
  startTime: String!
  endTime: String!
  status: AppointmentStatus!
  customerNotes: String
  canCustomerModify: Boolean! # False if <= 60 minutes remaining
  createdAt: String!
}

type Notification {
  id: ID!
  title: String!
  message: String!
  type: String!
  isRead: Boolean!
  createdAt: String!
}

type AnalyticsSummary {
  totalBookings: Int!
  realizedRevenue: Float!
  projectedRevenue: Float!
  noShowCount: Int!
  cancellationCount: Int!
}

# Root Queries
type Query {
  stores(city: String): [Store!]!
  store(id: ID!): Store
  availableSlots(storeId: ID!, staffId: ID!, serviceId: ID!, date: String!): [TimeSlot!]!
  myAppointments: [Appointment!]!
  adminAppointments(storeId: ID, date: String, status: AppointmentStatus): [Appointment!]!
  notifications: [Notification!]!
  unreadNotificationCount: Int!
  adminAnalytics(storeId: ID, startDate: String!, endDate: String!): AnalyticsSummary!
}

# Root Mutations
type Mutation {
  createAppointment(
    storeId: ID!
    staffId: ID!
    serviceId: ID!
    customerId: ID
    startTime: String!
    customerNotes: String
  ): Appointment!

  # Enforces > 1 hour cutoff for customers
  rescheduleAppointment(
    appointmentId: ID!
    newStaffId: ID!
    newStartTime: String!
  ): Appointment!

  cancelAppointment(appointmentId: ID!, reason: String): Appointment!

  # Staff Operations
  markStaffLeave(staffId: ID!, leaveDate: String!, reason: String): Boolean!
  setStaffBreakOverride(staffId: ID!, breakStart: String!, breakEnd: String!): StaffBreakOverride!
  updateAppointmentStatus(appointmentId: ID!, status: AppointmentStatus!): Appointment!

  # Admin Operations
  updateServiceBuffer(serviceId: ID!, bufferMinutes: Int!): Service!
  cloneServices(sourceStoreId: ID!, targetStoreId: ID!): [Service!]!
  transferStaff(staffId: ID!, newStoreId: ID!, effectiveDate: String!): Boolean!
  createStaffAccount(storeId: ID!, email: String!, fullName: String!, title: String!): StaffProfile!

  # Notifications
  markNotificationRead(notificationId: ID!): Boolean!
  markAllNotificationsRead: Boolean!
}
```

---

## 4. UI/UX Component Library & Aesthetic Direction

### Selected Component Library: **Shadcn UI (Radix UI Primitives + Tailwind CSS + Lucide Icons)**
* **Why Shadcn UI?**
  * **Headless & Accessible:** Built on Radix UI primitives, ensuring 100% WAI-ARIA compliant dialogs, popovers, dropdowns, and date pickers.
  * **No Runtime CSS Bloat:** Code lives directly in the repository as standard React components rather than an opaque `node_modules` dependency.
  * **Calendar & Date-Time Picking:** Seamless integration with `react-day-picker` for salon date selection and slot picking.
  * **Data Tables:** Powerful table components powered by TanStack Table for admin appointment lists and staff rosters.

### Aesthetic Theme Guidelines (Luxury Salon Feel)
* **Color Palette:**
  * Background: Deep Slate / Obsidian Dark (`#0B0F17`) with crisp White/Off-white cards in Light mode.
  * Primary Accent: Champagne Gold (`#D4AF37`) or Warm Amber (`#F59E0B`) conveying premium luxury.
  * Secondary / Neutral: Subtle zinc borders (`#27272A`) and muted typography.
* **Component Styling:**
  * Visual status tracking stepper with smooth glow animations.
  * Glassmorphism navigation bars (`backdrop-blur-md bg-background/80`).
  * Micro-animations for slot selection and status pills.
  * Typography using Google Font **Inter** or **Outfit**.
