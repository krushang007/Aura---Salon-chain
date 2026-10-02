export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { staffProfiles, appointments, services, users, stores } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 403 });
    }

    const staff = await db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.userId, user.id),
      with: {
        store: true,
      },
    });

    if (!staff) {
      return NextResponse.json({ error: 'Staff profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const dayStart = `${dateStr}T00:00:00.000Z`;
    const dayEnd = `${dateStr}T23:59:59.999Z`;

    const list = await db.query.appointments.findMany({
      where: and(
        eq(appointments.staffId, staff.id),
        sql`slot_range && tstzrange(${dayStart}, ${dayEnd}, '[]')`
      ),
      with: {
        customer: true,
        service: true,
      },
      orderBy: [appointments.slotRange],
    });

    const bookings = list.map((apt) => {
      const match = apt.slotRange.match(/\["([^"]+)",\s*"([^"]+)"\)/);
      const start = match ? new Date(match[1]) : new Date();
      const timeDisplay = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

      return {
        id: apt.id,
        timeDisplay,
        durationMinutes: apt.service.durationMinutes,
        customerName: apt.customer.fullName,
        customerPhone: apt.customer.phone || undefined,
        serviceTitle: apt.service.title,
        assignedChair: apt.assignedChair,
        chairStationName: staff.chairStationName,
        status: apt.status,
      };
    });

    return NextResponse.json({
      stylistName: user.fullName,
      chairName: staff.chairStationName,
      branchName: staff.store.name,
      dateFormatted: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
      bookings,
    });
  } catch (error) {
    console.error('Error fetching roster:', error);
    return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 });
  }
}
