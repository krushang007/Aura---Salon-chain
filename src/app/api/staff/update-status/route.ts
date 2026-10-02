import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, appointmentAuditLogs, notifications, staffProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';
import { validateRequestBody, staffStatusUpdateSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 403 });
    }

    // M-3: Zod validation
    const validation = await validateRequestBody(request, staffStatusUpdateSchema);
    if ('error' in validation) return validation.error;
    const { appointmentId, status } = validation.data;

    // H-1: Fetch staff profile to scope appointment access to the correct store/tenant
    const staffProfile = await db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.userId, user.id),
    });

    if (!staffProfile) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }

    // H-1: Query scoped by staff's store to prevent cross-tenant access
    const apt = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.staffId, staffProfile.id)
      ),
    });

    if (!apt) {
      return NextResponse.json({ error: 'Appointment not found or not assigned to you' }, { status: 404 });
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

      const notificationMessages: Record<string, { title: string; message: string }> = {
        IN_PROGRESS: {
          title: 'Service In Progress',
          message: 'Your stylist has started your in-salon service. Enjoy your visit!',
        },
        COMPLETED: {
          title: 'Service Completed',
          message: 'Your appointment is marked complete. Thank you for visiting Aura Salon!',
        },
        NO_SHOW: {
          title: 'Appointment Marked No-Show',
          message: 'Your appointment was marked as no-show. Contact us for any questions.',
        },
      };

      const notifContent = notificationMessages[status];
      if (notifContent) {
        await tx.insert(notifications).values({
          tenantId: apt.tenantId,
          recipientUserId: apt.customerId,
          title: notifContent.title,
          message: notifContent.message,
          type: 'STATUS_UPDATED',
          entityId: appointmentId,
        });
      }
    });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
