import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  integer, 
  numeric, 
  boolean, 
  time, 
  date, 
  timestamp, 
  customType,
  uniqueIndex,
  index
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================================================
// CUSTOM POSTGRESQL EXTENSION TYPES
// ============================================================================

export const tstzrange = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'tstzrange';
  },
});

// ============================================================================
// 1. TENANTS & USERS (AUTHENTICATION & RBAC)
// ============================================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(), // e.g. "salon-bonanza"
  logoUrl: text('logo_url'),
  supportPhone: varchar('support_phone', { length: 30 }),
  supportEmail: varchar('support_email', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
  phone: varchar('phone', { length: 30 }),
  role: varchar('role', { length: 30 })
    .$type<'TENANT_ADMIN' | 'STAFF' | 'CUSTOMER'>()
    .notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  preferencesNotes: text('preferences_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantRoleIdx: index('idx_users_tenant_role').on(table.tenantId, table.role),
  emailUnique: uniqueIndex('uq_users_email_global').on(table.email),
  tenantEmailIdx: index('idx_users_tenant_email').on(table.tenantId, table.email),
}));

// ============================================================================
// 2. STORES / BRANCHES, CLOSURES & BREAKS
// ============================================================================

export const stores = pgTable('stores', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 150 }).notNull(), // e.g. "Salon Bonanza — Althan Branch"
  slug: varchar('slug', { length: 100 }).notNull(), // e.g. "althan-branch"
  city: varchar('city', { length: 100 }).default('Surat').notNull(),
  locality: varchar('locality', { length: 100 }).notNull(), // e.g. "Althan", "Adajan", "Vesu"
  address: text('address').notNull(),
  landmark: varchar('landmark', { length: 150 }),
  phone: varchar('phone', { length: 30 }).notNull(),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Kolkata').notNull(),
  openingTime: time('opening_time').default('09:00:00').notNull(),
  closingTime: time('closing_time').default('21:00:00').notNull(),
  weeklyOffDay: integer('weekly_off_day'),
  totalStylingChairs: integer('total_styling_chairs').default(5).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isPublished: boolean('is_published').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index('idx_stores_tenant').on(table.tenantId),
  localityCityIdx: index('idx_stores_locality_city').on(table.city, table.locality),
  tenantSlugUnique: uniqueIndex('uq_store_tenant_slug').on(table.tenantId, table.slug),
}));

export const storeClosures = pgTable('store_closures', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  closureDate: date('closure_date').notNull(),
  reason: varchar('reason', { length: 200 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  storeClosureUnique: uniqueIndex('uq_store_closure_date').on(table.storeId, table.closureDate),
  closureLookupIdx: index('idx_store_closures_lookup').on(table.storeId, table.closureDate),
}));

export const storeStandardBreaks = pgTable('store_standard_breaks', {
  id: uuid('id').defaultRandom().primaryKey(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 100 }).default('Standard Lunch Break').notNull(),
  breakStart: time('break_start').notNull(),
  breakEnd: time('break_end').notNull(),
}, (table) => ({
  storeBreakIdx: index('idx_store_breaks_store').on(table.storeId),
}));

// ============================================================================
// 3. SERVICES (CATALOG & CROSS-BRANCH CLONING)
// ============================================================================

export const services = pgTable('services', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  category: varchar('category', { length: 100 }).default('Haircut').notNull(),
  title: varchar('title', { length: 150 }).notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull(),
  bufferMinutes: integer('buffer_minutes').default(5).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  storeIdx: index('idx_services_store').on(table.storeId),
  tenantIdx: index('idx_services_tenant').on(table.tenantId),
  categoryIdx: index('idx_services_category').on(table.storeId, table.category),
}));

// ============================================================================
// 4. STAFF PROFILES, CHAIR ASSIGNMENTS, SHIFTS, BREAKS & LEAVES
// ============================================================================

export const staffProfiles = pgTable('staff_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  currentStoreId: uuid('current_store_id').references(() => stores.id).notNull(),
  title: varchar('title', { length: 100 }).default('Stylist').notNull(),
  assignedChair: integer('assigned_chair').default(1).notNull(),
  chairStationName: varchar('chair_station_name', { length: 50 }).default('Chair 01').notNull(),
  bio: text('bio'),
  ratingAverage: numeric('rating_average', { precision: 3, scale: 2 }).default('4.90').notNull(),
  totalReviews: integer('total_reviews').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  storeIdx: index('idx_staff_store').on(table.currentStoreId),
  tenantIdx: index('idx_staff_tenant').on(table.tenantId),
}));

export const staffShifts = pgTable('staff_shifts', {
  id: uuid('id').defaultRandom().primaryKey(),
  staffId: uuid('staff_id').references(() => staffProfiles.id, { onDelete: 'cascade' }).notNull(),
  storeId: uuid('store_id').references(() => stores.id, { onDelete: 'cascade' }).notNull(),
  dayOfWeek: integer('day_of_week').notNull(),
  shiftStart: time('shift_start').notNull(),
  shiftEnd: time('shift_end').notNull(),
  isWorkingDay: boolean('is_working_day').default(true).notNull(),
}, (table) => ({
  staffDayUnique: uniqueIndex('uq_staff_shift_day').on(table.staffId, table.dayOfWeek),
  storeDayIdx: index('idx_staff_shifts_store_day').on(table.storeId, table.dayOfWeek),
}));

export const staffBreakOverrides = pgTable('staff_break_overrides', {
  id: uuid('id').defaultRandom().primaryKey(),
  staffId: uuid('staff_id').references(() => staffProfiles.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 100 }).default('Custom Break').notNull(),
  dayOfWeek: integer('day_of_week'),
  breakStart: time('break_start').notNull(),
  breakEnd: time('break_end').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => ({
  staffBreakIdx: index('idx_staff_breaks_staff').on(table.staffId),
}));

export const staffLeaves = pgTable('staff_leaves', {
  id: uuid('id').defaultRandom().primaryKey(),
  staffId: uuid('staff_id').references(() => staffProfiles.id, { onDelete: 'cascade' }).notNull(),
  leaveDate: date('leave_date').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  staffLeaveUnique: uniqueIndex('uq_staff_leave_date').on(table.staffId, table.leaveDate),
  leaveLookupIdx: index('idx_staff_leaves_lookup').on(table.staffId, table.leaveDate),
}));

// ============================================================================
// 5. APPOINTMENTS (WITH HARD POSTGRESQL CONCURRENCY LOCK)
// ============================================================================

export const appointments = pgTable('appointments', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  storeId: uuid('store_id').references(() => stores.id).notNull(),
  staffId: uuid('staff_id').references(() => staffProfiles.id).notNull(),
  customerId: uuid('customer_id').references(() => users.id).notNull(),
  bookedByUserId: uuid('booked_by_user_id').references(() => users.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id).notNull(),
  assignedChair: integer('assigned_chair').notNull(),
  slotRange: tstzrange('slot_range').notNull(),
  status: varchar('status', { length: 30 })
    .$type<'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULE_NEEDED'>()
    .default('CONFIRMED')
    .notNull(),
  customerNotes: text('customer_notes'),
  staffInternalNotes: text('staff_internal_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  lookupIdx: index('idx_appointments_lookup').on(table.staffId, table.storeId, table.status),
  customerIdx: index('idx_appointments_customer').on(table.customerId),
  storeStatusIdx: index('idx_appointments_store_status').on(table.storeId, table.status),
}));

// ============================================================================
// 6. IN-APP NOTIFICATIONS & AUDIT TRAIL
// ============================================================================

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }).notNull(),
  recipientUserId: uuid('recipient_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 })
    .$type<'BOOKING_CONFIRMED' | 'STATUS_UPDATED' | 'APPOINTMENT_CANCELLED' | 'RESCHEDULE_NEEDED' | 'STAFF_PROVISIONED'>()
    .notNull(),
  entityId: uuid('entity_id'),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  recipientIdx: index('idx_notifications_recipient').on(table.recipientUserId, table.isRead, table.createdAt),
}));

export const appointmentAuditLogs = pgTable('appointment_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointmentId: uuid('appointment_id').references(() => appointments.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  actorRole: varchar('actor_role', { length: 30 }).$type<'CUSTOMER' | 'STAFF' | 'ADMIN' | 'SYSTEM'>().notNull(),
  actorId: uuid('actor_id').references(() => users.id).notNull(),
  oldStatus: varchar('old_status', { length: 30 }),
  newStatus: varchar('new_status', { length: 30 }),
  oldStoreId: uuid('old_store_id').references(() => stores.id),
  newStoreId: uuid('new_store_id').references(() => stores.id),
  oldStaffId: uuid('old_staff_id').references(() => staffProfiles.id),
  newStaffId: uuid('new_staff_id').references(() => staffProfiles.id),
  oldSlotRange: tstzrange('old_slot_range'),
  newSlotRange: tstzrange('new_slot_range'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  auditAptIdx: index('idx_audit_logs_appointment').on(table.appointmentId, table.createdAt),
}));

// ============================================================================
// 7. DRIZZLE RELATIONS GRAPH
// ============================================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  stores: many(stores),
  users: many(users),
  services: many(services),
}));

export const storesRelations = relations(stores, ({ many, one }) => ({
  tenant: one(tenants, { fields: [stores.tenantId], references: [tenants.id] }),
  services: many(services),
  staff: many(staffProfiles),
  appointments: many(appointments),
  closures: many(storeClosures),
  standardBreaks: many(storeStandardBreaks),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  staffProfile: one(staffProfiles, { fields: [users.id], references: [staffProfiles.userId] }),
  customerAppointments: many(appointments, { relationName: 'customerAppointments' }),
  staffBookedAppointments: many(appointments, { relationName: 'staffBookedAppointments' }),
  notifications: many(notifications),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  store: one(stores, { fields: [services.storeId], references: [stores.id] }),
  tenant: one(tenants, { fields: [services.tenantId], references: [tenants.id] }),
}));

export const staffProfilesRelations = relations(staffProfiles, ({ one, many }) => ({
  user: one(users, { fields: [staffProfiles.userId], references: [users.id] }),
  store: one(stores, { fields: [staffProfiles.currentStoreId], references: [stores.id] }),
  tenant: one(tenants, { fields: [staffProfiles.tenantId], references: [tenants.id] }),
  shifts: many(staffShifts),
  breakOverrides: many(staffBreakOverrides),
  leaves: many(staffLeaves),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  customer: one(users, { fields: [appointments.customerId], references: [users.id], relationName: 'customerAppointments' }),
  bookedBy: one(users, { fields: [appointments.bookedByUserId], references: [users.id], relationName: 'staffBookedAppointments' }),
  staff: one(staffProfiles, { fields: [appointments.staffId], references: [staffProfiles.id] }),
  store: one(stores, { fields: [appointments.storeId], references: [stores.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
  auditLogs: many(appointmentAuditLogs),
}));

export const appointmentAuditLogsRelations = relations(appointmentAuditLogs, ({ one }) => ({
  appointment: one(appointments, { fields: [appointmentAuditLogs.appointmentId], references: [appointments.id] }),
  actor: one(users, { fields: [appointmentAuditLogs.actorId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, { fields: [notifications.recipientUserId], references: [users.id] }),
}));
