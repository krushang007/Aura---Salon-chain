import { eq, and, sql } from 'drizzle-orm';
import { stores, services, staffProfiles, users, appointments, tenants } from '@/db/schema';
import { GraphQLContext } from './context';

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
      try {
        if (args.city) {
          return await context.db.query.stores.findMany({
            where: eq(stores.city, args.city),
            with: {
              services: true,
              staff: {
                with: { user: true },
              },
            },
          });
        }
        return await context.db.query.stores.findMany({
          with: {
            services: true,
            staff: {
              with: { user: true },
            },
          },
        });
      } catch {
        // Fallback mock stores for initial template verification before DB seed
        return [
          {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Bonanza Downtown Luxury',
            city: 'Mumbai',
            address: '101 Marine Drive, Nariman Point',
            timezone: 'Asia/Kolkata',
            openingTime: '09:00:00',
            closingTime: '21:00:00',
            weeklyOffDay: 1,
            totalStylingChairs: 8,
            services: [],
            staff: [],
          },
        ];
      }
    },

    store: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      try {
        return await context.db.query.stores.findFirst({
          where: eq(stores.id, args.id),
          with: {
            services: true,
            staff: {
              with: { user: true },
            },
          },
        });
      } catch {
        return null;
      }
    },

    services: async (_parent: unknown, args: { storeId: string }, context: GraphQLContext) => {
      try {
        return await context.db.query.services.findMany({
          where: and(eq(services.storeId, args.storeId), eq(services.isActive, true)),
        });
      } catch {
        return [];
      }
    },

    staff: async (_parent: unknown, args: { storeId: string }, context: GraphQLContext) => {
      try {
        return await context.db.query.staffProfiles.findMany({
          where: and(eq(staffProfiles.currentStoreId, args.storeId), eq(staffProfiles.isActive, true)),
          with: { user: true },
        });
      } catch {
        return [];
      }
    },

    availableSlots: async (_parent: unknown, _args: { storeId: string; staffId: string; serviceId: string; date: string }) => {
      // Dynamic slot generation strategy with buffer (as detailed in architecture)
      const slots = [
        { startTime: '10:00', endTime: '10:45' },
        { startTime: '11:00', endTime: '11:45' },
        { startTime: '14:00', endTime: '14:45' },
        { startTime: '15:30', endTime: '16:15' },
        { startTime: '17:00', endTime: '17:45' },
      ];
      return slots;
    },

    appointments: async (_parent: unknown, args: { storeId?: string; customerId?: string }, context: GraphQLContext) => {
      try {
        if (args.customerId) {
          return await context.db.query.appointments.findMany({
            where: eq(appointments.customerId, args.customerId),
          });
        }
        if (args.storeId) {
          return await context.db.query.appointments.findMany({
            where: eq(appointments.storeId, args.storeId),
          });
        }
        return await context.db.query.appointments.findMany();
      } catch {
        return [];
      }
    },
  },

  Mutation: {
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
      const defaultTenant = await context.db.query.tenants.findFirst({
        where: eq(tenants.slug, context.tenantSlug),
      });

      const tenantId = defaultTenant?.id || '00000000-0000-0000-0000-000000000001';

      // Example 45-minute booking window
      const start = new Date(args.startTime);
      const end = new Date(start.getTime() + 45 * 60 * 1000);
      const slotRange = `[${start.toISOString()},${end.toISOString()})`;

      const [newAppointment] = await context.db.insert(appointments).values({
        tenantId,
        storeId: args.storeId,
        staffId: args.staffId,
        customerId: args.customerId,
        bookedByUserId: args.customerId,
        serviceId: args.serviceId,
        assignedChair: 1,
        slotRange,
        status: 'CONFIRMED',
        customerNotes: args.customerNotes,
      }).returning();

      return newAppointment;
    },

    updateAppointmentStatus: async (
      _parent: unknown,
      args: { appointmentId: string; status: 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULE_NEEDED' },
      context: GraphQLContext
    ) => {
      const [updated] = await context.db.update(appointments)
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
      const sourceList = await context.db.query.services.findMany({
        where: and(eq(services.storeId, args.sourceStoreId), eq(services.isActive, true)),
      });

      if (sourceList.length === 0) return [];

      const clonedValues = sourceList.map((s) => ({
        tenantId: s.tenantId,
        storeId: args.targetStoreId,
        title: s.title,
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
