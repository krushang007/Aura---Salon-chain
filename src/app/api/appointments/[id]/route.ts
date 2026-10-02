export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, stores, services, staffProfiles, users } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apt = await db.query.appointments.findFirst({
      where: eq(appointments.id, params.id),
      with: {
        store: true,
        service: true,
        staff: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!apt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check cancellation cutoff window
    const [cutoffCheck] = await db.execute<{ canCancel: boolean; hoursRemaining: number }>(sql`
      SELECT 
        (lower(slot_range) >= NOW() + INTERVAL '2 hours') AS "canCancel",
        EXTRACT(EPOCH FROM (lower(slot_range) - NOW())) / 3600.0 AS "hoursRemaining"
      FROM appointments
      WHERE id = ${params.id}
    `);

    // Parse slotRange
    const match = apt.slotRange.match(/\["([^"]+)",\s*"([^"]+)"\)/);
    const startIso = match ? match[1] : new Date().toISOString();
    const endIso = match ? match[2] : new Date().toISOString();

    const startDate = new Date(startIso);
    const arrivalStart = new Date(startDate.getTime() - 10 * 60 * 1000); // 10 min before
    const arrivalWindow = `${arrivalStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;

    const cutoffDate = new Date(startDate.getTime() - 2 * 60 * 60 * 1000);
    const cancellationCutoffTime = cutoffDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return NextResponse.json({
      pass: {
        id: apt.id,
        passNumber: `#AURA-SURAT-${apt.id.slice(0, 4).toUpperCase()}`,
        status: apt.status,
        salonName: apt.store.name.split('—')[0]?.trim() || apt.store.name,
        branchName: apt.store.name,
        branchAddress: apt.store.address,
        deskPhone: apt.store.phone,
        serviceTitle: apt.service.title,
        servicePrice: Number(apt.service.price),
        durationMinutes: apt.service.durationMinutes,
        bufferMinutes: apt.service.bufferMinutes,
        stylistName: apt.staff.user.fullName,
        stylistTitle: apt.staff.title,
        assignedChair: apt.assignedChair,
        chairStationName: apt.staff.chairStationName,
        slotStartTime: startIso,
        slotEndTime: endIso,
        arrivalWindow,
        canCancel: Boolean(cutoffCheck?.canCancel && apt.status === 'CONFIRMED'),
        hoursUntilSlot: Number(cutoffCheck?.hoursRemaining || 0),
        cancellationCutoffTime,
        storeId: apt.storeId,
        staffId: apt.staffId,
        serviceId: apt.serviceId,
      },
    });
  } catch (error) {
    console.error('Error fetching appointment pass:', error);
    return NextResponse.json({ error: 'Failed to fetch appointment pass' }, { status: 500 });
  }
}
