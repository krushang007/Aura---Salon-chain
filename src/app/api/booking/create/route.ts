import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, appointmentAuditLogs, notifications, staffProfiles, services } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { validateRequestBody, bookingCreateSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    // M-3: Zod validation
    const validation = await validateRequestBody(request, bookingCreateSchema);
    if ('error' in validation) return validation.error;
    const { storeId, staffId, serviceId, date, slotTime, customerNotes } = validation.data;

    // 1. Fetch Service for duration & buffer — M-8: verify it belongs to the requested store
    const service = await db.query.services.findFirst({
      where: and(eq(services.id, serviceId), eq(services.storeId, storeId), eq(services.isActive, true)),
    });
    if (!service) {
      return NextResponse.json({ error: 'Service not found or not available at this store' }, { status: 404 });
    }

    // 2. Fetch Stylist & Assigned Chair — M-8: verify they are at the requested store
    const staff = await db.query.staffProfiles.findFirst({
      where: and(eq(staffProfiles.id, staffId), eq(staffProfiles.currentStoreId, storeId), eq(staffProfiles.isActive, true)),
    });
    if (!staff) {
      return NextResponse.json({ error: 'Stylist not found or not available at this store' }, { status: 404 });
    }

    const totalMinutes = service.durationMinutes + service.bufferMinutes;
    const startIso = `${date}T${slotTime}:00.000Z`;
    const startDate = new Date(startIso);
    const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);

    // M-7: Validate booking is in the future
    if (startDate <= new Date()) {
      return NextResponse.json({ error: 'Cannot book an appointment in the past' }, { status: 400 });
    }

    // 3. Insert Appointment Transaction
    const booking = await db.transaction(async (tx) => {
      const [apt] = await tx.insert(appointments).values({
        tenantId: staff.tenantId,
        storeId,
        staffId,
        customerId: user.id,
        bookedByUserId: user.id,
        serviceId,
        assignedChair: staff.assignedChair,
        slotRange: sql`tstzrange(${startDate.toISOString()}, ${endDate.toISOString()}, '[)')`,
        status: 'CONFIRMED',
        customerNotes: customerNotes ? String(customerNotes).trim() : null,
      }).returning();

      // Audit Log
      await tx.insert(appointmentAuditLogs).values({
        appointmentId: apt.id,
        action: 'CREATED',
        actorRole: user.role === 'STAFF' ? 'STAFF' : 'CUSTOMER',
        actorId: user.id,
        newStatus: 'CONFIRMED',
        newStoreId: storeId,
        newStaffId: staffId,
        newSlotRange: sql`tstzrange(${startDate.toISOString()}, ${endDate.toISOString()}, '[)')`,
        notes: user.role === 'STAFF' ? 'Booked via staff on behalf of customer' : 'Booked online via Aura Marketplace',
      });

      // In-App Notification
      await tx.insert(notifications).values({
        tenantId: staff.tenantId,
        recipientUserId: user.id,
        title: 'Appointment Confirmed',
        message: `Your booking for ${service.title} is locked for ${date} at ${slotTime}. Chair & slot guaranteed.`,
        type: 'BOOKING_CONFIRMED',
        entityId: apt.id,
      });

      return apt;
    });

    return NextResponse.json({ success: true, appointmentId: booking.id });
  } catch (error: unknown) {
    const pgError = error as { code?: string; message?: string };
    console.error('Booking creation error:', error);
    // Handle Postgres GiST exclusion error (code 23P01)
    if (pgError.code === '23P01' || pgError.message?.includes('exclusion')) {
      return NextResponse.json(
        { error: 'Slot conflict: This stylist or chair was just booked by another client. Please select an alternate slot.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
