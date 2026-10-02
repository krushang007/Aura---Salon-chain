import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, appointmentAuditLogs, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 403 });
    }

    const body = await request.json();
    const { appointmentId, status } = body;

    if (!appointmentId || !['IN_PROGRESS', 'COMPLETED', 'NO_SHOW'].includes(status)) {
      return NextResponse.json({ error: 'Valid appointmentId and status required' }, { status: 400 });
    }

    const apt = await db.query.appointments.findFirst({
      where: eq(appointments.id, appointmentId),
    });

    if (!apt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      await tx.update(appointments)
        .set({ status, updatedAt: new Date() })
        .where(eq(appointments.id, appointmentId));

      await tx.insert(appointmentAuditLogs).values({
        appointmentId,
        action: 'STATUS_CHANGE',
        actorRole: 'STAFF',
        actorId: user.id,
        oldStatus: apt.status,
        newStatus: status,
        notes: `Status transitioned by stylist ${user.fullName}`,
      });

      await tx.insert(notifications).values({
        tenantId: apt.tenantId,
        recipientUserId: apt.customerId,
        title: status === 'IN_PROGRESS' ? 'Service In Progress' : 'Service Completed',
        message:
          status === 'IN_PROGRESS'
            ? 'Your stylist has started your in-salon service. Enjoy your visit!'
            : 'Your appointment is marked complete. Thank you for visiting Aura Salon!',
        type: 'STATUS_UPDATED',
        entityId: appointmentId,
      });
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
