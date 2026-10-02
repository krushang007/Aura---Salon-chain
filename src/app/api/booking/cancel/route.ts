import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, appointmentAuditLogs, notifications } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { validateRequestBody, bookingCancelSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateRequestBody(request, bookingCancelSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { appointmentId, reason } = validation.data;

    // 1. Fetch appointment
    const apt = await db.query.appointments.findFirst({
      where: and(eq(appointments.id, appointmentId), eq(appointments.customerId, user.id)),
    });

    if (!apt) {
      return NextResponse.json({ error: 'Appointment not found or unauthorized' }, { status: 404 });
    }

    if (apt.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Appointment is already cancelled' }, { status: 400 });
    }
    if (apt.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Completed appointments cannot be cancelled' }, { status: 400 });
    }

    // 2. Strict 2-Hour Cutoff Verification in PostgreSQL
    const [windowCheck] = await db.execute<{ canCancel: boolean; hoursRemaining: number }>(sql`
      SELECT 
        (lower(slot_range) >= NOW() + INTERVAL '2 hours') AS "canCancel",
        EXTRACT(EPOCH FROM (lower(slot_range) - NOW())) / 3600.0 AS "hoursRemaining"
      FROM appointments
      WHERE id = ${appointmentId}
    `);

    if (!windowCheck?.canCancel) {
      return NextResponse.json(
        {
          error:
            'Cancellation locked: Appointments within 2 hours of scheduled start time cannot be cancelled self-service. Please contact the salon front desk directly.',
        },
        { status: 403 }
      );
    }

    // 3. Update status to CANCELLED in a transaction (frees GiST constraint immediately)
    await db.transaction(async (tx) => {
      await tx.update(appointments)
        .set({ status: 'CANCELLED', updatedAt: new Date() })
        .where(eq(appointments.id, appointmentId));

      await tx.insert(appointmentAuditLogs).values({
        appointmentId,
        action: 'CANCELLED',
        actorRole: 'CUSTOMER',
        actorId: user.id,
        oldStatus: apt.status,
        newStatus: 'CANCELLED',
        notes: reason || 'Customer self-service cancellation (>2hr window)',
      });

      await tx.insert(notifications).values({
        tenantId: apt.tenantId,
        recipientUserId: user.id,
        title: 'Appointment Cancelled',
        message: 'Your appointment was successfully cancelled. Your reserved chair slot has been freed.',
        type: 'APPOINTMENT_CANCELLED',
        entityId: appointmentId,
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully. Chair slot has been freed.',
    });
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
  }
}
