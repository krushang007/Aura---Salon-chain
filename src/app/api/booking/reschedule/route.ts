import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, appointmentAuditLogs, notifications, staffProfiles, services } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { validateRequestBody, bookingRescheduleSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateRequestBody(request, bookingRescheduleSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { appointmentId, newDate, newSlotTime, newStaffId } = validation.data;

    // 1. Fetch appointment
    const apt = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
      with: {
        service: true,
        staff: true,
      },
    });

    if (!apt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Must be customer themselves or staff/admin
    if (user.role === 'CUSTOMER' && apt.customerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to reschedule this appointment' }, { status: 403 });
    }

    if (apt.status === 'CANCELLED' || apt.status === 'COMPLETED') {
      return NextResponse.json(
        { error: `Cannot reschedule a ${apt.status.toLowerCase()} appointment` },
        { status: 400 }
      );
    }

    // 2. Strict 2-Hour Cutoff Verification in PostgreSQL
    const [windowCheck] = await db.execute<{ canReschedule: boolean; hoursRemaining: number }>(sql`
      SELECT 
        (lower(slot_range) >= NOW() + INTERVAL '2 hours') AS "canReschedule",
        EXTRACT(EPOCH FROM (lower(slot_range) - NOW())) / 3600.0 AS "hoursRemaining"
      FROM appointments
      WHERE id = ${appointmentId}
    `);

    if (!windowCheck?.canReschedule) {
      return NextResponse.json(
        {
          error:
            'Reschedule locked: Appointments within 2 hours of scheduled start time cannot be rescheduled self-service. Please contact the salon front desk directly.',
        },
        { status: 403 }
      );
    }

    // 3. Resolve Target Staff
    const targetStaffId = newStaffId || apt.staffId;
    const targetStaff = await db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.id, targetStaffId),
    });

    if (!targetStaff) {
      return NextResponse.json({ error: 'Assigned stylist not found' }, { status: 404 });
    }

    // 4. Calculate new time range (including buffer)
    const service = apt.service;
    const totalMinutes = (service?.durationMinutes || 45) + (service?.bufferMinutes || 5);
    const startIso = `${newDate}T${newSlotTime}:00.000Z`;
    const startDate = new Date(startIso);

    if (startDate < new Date()) {
      return NextResponse.json({ error: 'Cannot reschedule to a past date or time' }, { status: 400 });
    }

    const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);

    // 5. Update Appointment & Audit Log in transaction
    await db.transaction(async (tx) => {
      await tx
        .update(appointments)
        .set({
          staffId: targetStaff.id,
          assignedChair: targetStaff.assignedChair,
          slotRange: sql`tstzrange(${startDate.toISOString()}, ${endDate.toISOString()}, '[)')`,
          updatedAt: new Date(),
        })
        .where(eq(appointments.id, appointmentId));

      await tx.insert(appointmentAuditLogs).values({
        appointmentId,
        action: 'RESCHEDULED',
        actorRole: user.role === 'TENANT_ADMIN' ? 'ADMIN' : user.role === 'STAFF' ? 'STAFF' : 'CUSTOMER',
        actorId: user.id,
        oldStatus: apt.status,
        newStatus: apt.status,
        newStaffId: targetStaff.id,
        newSlotRange: sql`tstzrange(${startDate.toISOString()}, ${endDate.toISOString()}, '[)')`,
        notes: `Rescheduled to ${newDate} at ${newSlotTime}`,
      });

      await tx.insert(notifications).values({
        tenantId: apt.tenantId,
        recipientUserId: apt.customerId,
        title: 'Appointment Rescheduled',
        message: `Your appointment for ${service?.title || 'Salon Service'} has been rescheduled to ${newDate} at ${newSlotTime}.`,
        type: 'STATUS_UPDATED',
        entityId: appointmentId,
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment successfully rescheduled.',
      appointmentId,
    });
  } catch (error: unknown) {
    console.error('Reschedule error:', error);
    const pgError = error as { code?: string; message?: string };
    if (pgError.code === '23P01' || pgError.message?.includes('exclusion')) {
      return NextResponse.json(
        { error: 'Slot conflict: The selected slot or stylist chair is already occupied. Please choose another slot.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to reschedule appointment' }, { status: 500 });
  }
}
