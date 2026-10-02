import { eq, and, sql, inArray } from 'drizzle-orm';
import {
  stores,
  services,
  staffProfiles,
  appointments,
  tenants,
  staffShifts,
  storeClosures,
} from '@/db/schema';
import { GraphQLContext } from './context';

// ============================================================================
// AUTH GUARD — rejects unauthenticated requests on protected operations
// ============================================================================

function requireAuth(context: GraphQLContext) {
  if (!context.user) {
    throw new Error('Authentication required. Please sign in.');
  }
  return context.user;
}

// ============================================================================
// RESOLVERS
// ============================================================================

export const resolvers = {
  Query: {
    systemHealth: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      let dbStatus = 'healthy';
      try {
        await context.db.execute(sql`SELECT 1`);
      } catch (err) {
        dbStatus = `disconnected (${(err as Error).message})`;
      }

      return {
        status: 'online',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        version: '1.0.0-poc',
      };
    },

    stores: async (_parent: unknown, args: { city?: string }, context: GraphQLContext) => {
      if (args.city) {
        return await context.db.query.stores.findMany({
          where: and(eq(stores.city, args.city), eq(stores.isPublished, true)),
          with: {
            services: { where: eq(services.isActive, true) },
            staff: { where: eq(staffProfiles.isActive, true), with: { user: true } },
          },
        });
      }
      return await context.db.query.stores.findMany({
        where: eq(stores.isPublished, true),
        with: {
          services: { where: eq(services.isActive, true) },
          staff: { where: eq(staffProfiles.isActive, true), with: { user: true } },
        },
      });
    },

    store: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      return await context.db.query.stores.findFirst({
        where: eq(stores.id, args.id),
        with: {
          services: { where: eq(services.isActive, true) },
          staff: { where: eq(staffProfiles.isActive, true), with: { user: true } },
        },
      });
    },

    services: async (_parent: unknown, args: { storeId: string }, context: GraphQLContext) => {
      return await context.db.query.services.findMany({
        where: and(eq(services.storeId, args.storeId), eq(services.isActive, true)),
      });
    },

    staff: async (_parent: unknown, args: { storeId: string }, context: GraphQLContext) => {
      return await context.db.query.staffProfiles.findMany({
        where: and(eq(staffProfiles.currentStoreId, args.storeId), eq(staffProfiles.isActive, true)),
        with: { user: true },
      });
    },

    // H-6: Real slot calculation instead of hardcoded data
    availableSlots: async (
      _parent: unknown,
      args: { storeId: string; staffId: string; serviceId: string; date: string },
      context: GraphQLContext
    ) => {
      const { storeId, staffId, serviceId, date: dateStr } = args;

      const targetDate = new Date(dateStr);
      if (isNaN(targetDate.getTime())) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
      }

      const dayOfWeek = targetDate.getDay();

      // Check store closure
      const closure = await context.db.query.storeClosures.findFirst({
        where: and(eq(storeClosures.storeId, storeId), eq(storeClosures.closureDate, dateStr)),
      });
      if (closure) return [];

      // Fetch staff shift for the day
      const shift = await context.db.query.staffShifts.findFirst({
        where: and(
          eq(staffShifts.staffId, staffId),
          eq(staffShifts.storeId, storeId),
          eq(staffShifts.dayOfWeek, dayOfWeek),
          eq(staffShifts.isWorkingDay, true)
        ),
      });
      if (!shift) return [];

      // Fetch service duration
      const service = await context.db.query.services.findFirst({
        where: eq(services.id, serviceId),
      });
      if (!service) throw new Error('Service not found');

      const totalMinutes = service.durationMinutes + service.bufferMinutes;

      // Fetch existing bookings for the date
      const dayStart = `${dateStr}T00:00:00.000Z`;
      const dayEnd = `${dateStr}T23:59:59.999Z`;

      const existing = await context.db.query.appointments.findMany({
        where: and(
          eq(appointments.staffId, staffId),
          inArray(appointments.status, ['CONFIRMED', 'IN_PROGRESS']),
          sql`slot_range && tstzrange(${dayStart}, ${dayEnd}, '[]')`
        ),
      });

      // Generate 15-minute interval slots
      const [startH, startM] = shift.shiftStart.split(':').map(Number);
      const [endH, endM] = shift.shiftEnd.split(':').map(Number);
      const shiftStartMinutes = startH * 60 + startM;
      const shiftEndMinutes = endH * 60 + endM;

      const slots: { startTime: string; endTime: string }[] = [];

      for (let m = shiftStartMinutes; m + totalMinutes <= shiftEndMinutes; m += 15) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;

        const slotStartTime = new Date(`${dateStr}T${timeStr}:00.000Z`);
        const slotEndTime = new Date(slotStartTime.getTime() + totalMinutes * 60 * 1000);

        // Check collision with existing appointments
        const hasCollision = existing.some((apt) => {
          const match = apt.slotRange.match(/\["([^"]+)",\s*"([^"]+)"\)/);
          if (!match) return false;
          const bStart = new Date(match[1]);
          const bEnd = new Date(match[2]);
          return slotStartTime < bEnd && slotEndTime > bStart;
        });

        if (!hasCollision) {
          const endH2 = Math.floor((m + totalMinutes) / 60);
          const endMin2 = (m + totalMinutes) % 60;
          slots.push({
            startTime: timeStr,
            endTime: `${String(endH2).padStart(2, '0')}:${String(endMin2).padStart(2, '0')}`,
          });
        }
      }

      return slots;
    },

    // H-7: Scoped appointment access — require auth, scope by role
    appointments: async (
      _parent: unknown,
      args: { storeId?: string; customerId?: string },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      if (user.role === 'CUSTOMER') {
        // Customers can only see their own appointments
        return await context.db.query.appointments.findMany({
          where: eq(appointments.customerId, user.id),
          limit: 100,
        });
      }

      if (user.role === 'STAFF' && user.storeId) {
        // Staff can see appointments for their store
        return await context.db.query.appointments.findMany({
          where: eq(appointments.storeId, user.storeId),
          limit: 100,
        });
      }

      if (user.role === 'TENANT_ADMIN' && user.tenantId) {
        // Admin can see appointments for their tenant, optionally filtered by store
        const conditions = [eq(appointments.tenantId, user.tenantId)];
        if (args.storeId) {
          conditions.push(eq(appointments.storeId, args.storeId));
        }
        return await context.db.query.appointments.findMany({
          where: and(...conditions),
          limit: 100,
        });
      }

      return [];
    },
  },

  Mutation: {
    // C-3: All mutations require authentication
    createAppointment: async (
      _parent: unknown,
      args: {
        storeId: string;
        staffId: string;
        serviceId: string;
        customerId: string;
        startTime: string;
        customerNotes?: string;
      },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      // Customers can only book for themselves
      if (user.role === 'CUSTOMER' && args.customerId !== user.id) {
        throw new Error('Customers can only create appointments for themselves');
      }

      const staff = await context.db.query.staffProfiles.findFirst({
        where: eq(staffProfiles.id, args.staffId),
      });
      if (!staff) throw new Error('Stylist not found');

      const service = await context.db.query.services.findFirst({
        where: eq(services.id, args.serviceId),
      });
      if (!service) throw new Error('Service not found');

      const totalMinutes = service.durationMinutes + service.bufferMinutes;
      const start = new Date(args.startTime);

      if (start < new Date()) {
        throw new Error('Cannot book an appointment in the past');
      }

      const end = new Date(start.getTime() + totalMinutes * 60 * 1000);

      const [newAppointment] = await context.db.insert(appointments).values({
        tenantId: staff.tenantId,
        storeId: args.storeId,
        staffId: args.staffId,
        customerId: args.customerId,
        bookedByUserId: user.id,
        serviceId: args.serviceId,
        assignedChair: staff.assignedChair,
        slotRange: sql`tstzrange(${start.toISOString()}, ${end.toISOString()}, '[)')`,
        status: 'CONFIRMED',
        customerNotes: args.customerNotes || null,
      }).returning();

      return newAppointment;
    },

    updateAppointmentStatus: async (
      _parent: unknown,
      args: {
        appointmentId: string;
        status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULE_NEEDED';
      },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      // Only staff and admin can update status
      if (user.role === 'CUSTOMER') {
        throw new Error('Customers cannot update appointment status directly');
      }

      // Scope to user's tenant to prevent cross-tenant access
      const apt = await context.db.query.appointments.findFirst({
        where: eq(appointments.id, args.appointmentId),
      });

      if (!apt) throw new Error('Appointment not found');
      if (user.tenantId && apt.tenantId !== user.tenantId) {
        throw new Error('Unauthorized: appointment belongs to a different tenant');
      }

      const [updated] = await context.db
        .update(appointments)
        .set({ status: args.status, updatedAt: new Date() })
        .where(eq(appointments.id, args.appointmentId))
        .returning();

      return updated;
    },

    cloneServices: async (
      _parent: unknown,
      args: { sourceStoreId: string; targetStoreId: string },
      context: GraphQLContext
    ) => {
      const user = requireAuth(context);

      // Only tenant admins can clone services
      if (user.role !== 'TENANT_ADMIN' || !user.tenantId) {
        throw new Error('Only tenant admins can clone services');
      }

      // Verify target store belongs to admin's tenant
      const targetStore = await context.db.query.stores.findFirst({
        where: and(eq(stores.id, args.targetStoreId), eq(stores.tenantId, user.tenantId)),
      });
      if (!targetStore) {
        throw new Error('Target store not found or unauthorized');
      }

      const sourceList = await context.db.query.services.findMany({
        where: and(eq(services.storeId, args.sourceStoreId), eq(services.isActive, true)),
      });

      if (sourceList.length === 0) return [];

      const clonedValues = sourceList.map((s) => ({
        tenantId: user.tenantId!,
        storeId: args.targetStoreId,
        title: s.title,
        category: s.category,
        description: s.description,
        durationMinutes: s.durationMinutes,
        bufferMinutes: s.bufferMinutes,
        price: s.price,
        isActive: true,
      }));

      return await context.db.insert(services).values(clonedValues).returning();
    },
  },
};
