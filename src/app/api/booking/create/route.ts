import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, appointmentAuditLogs, notifications, staffProfiles, services } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json();
    const { storeId, staffId, serviceId, date, slotTime, customerNotes } = body;

    if (!storeId || !staffId || !serviceId || !date || !slotTime) {
      return NextResponse.json(
        { error: 'storeId, staffId, serviceId, date, and slotTime are required' },
        { status: 400 }
      );
    }

    // 1. Fetch Service for duration & buffer
    const service = await db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // 2. Fetch Stylist & Assigned Chair
    const staff = await db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.id, staffId),
    });
    if (!staff) {
      return NextResponse.json({ error: 'Stylist not found' }, { status: 404 });
    }

    const totalMinutes = service.durationMinutes + service.bufferMinutes;
    const startIso = `${date}T${slotTime}:00.000Z`;
    const startDate = new Date(startIso);
    const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);

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
  } catch (error: any) {
    console.error('Booking creation error:', error);
    // Handle Postgres GiST exclusion error (code 23P01)
    if (error.code === '23P01' || error.message?.includes('exclusion')) {
      return NextResponse.json(
        { error: 'Slot conflict: This stylist or chair was just booked by another client. Please select an alternate slot.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
