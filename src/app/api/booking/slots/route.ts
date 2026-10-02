export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { staffShifts, storeClosures, appointments, services } from '@/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const staffId = searchParams.get('staffId');
    const serviceId = searchParams.get('serviceId');
    const dateStr = searchParams.get('date'); // 'YYYY-MM-DD'

    if (!storeId || !staffId || !serviceId || !dateStr) {
      return NextResponse.json(
        { error: 'storeId, staffId, serviceId, and date are required', slots: [] },
        { status: 400 }
      );
    }

    // Guard against invalid UUID strings (prevents Postgres 22P02 string_to_uuid error)
    if (!UUID_REGEX.test(storeId) || !UUID_REGEX.test(staffId) || !UUID_REGEX.test(serviceId)) {
      return NextResponse.json(
        {
          available: false,
          error: 'Invalid salon, stylist, or service identifier. Must be a valid UUID.',
          slots: [],
        },
        { status: 400 }
      );
    }

    const targetDate = new Date(dateStr);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD', slots: [] },
        { status: 400 }
      );
    }

    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

    // 1. Check Store Closure
    const closure = await db.query.storeClosures.findFirst({
      where: and(eq(storeClosures.storeId, storeId), eq(storeClosures.closureDate, dateStr)),
    });
    if (closure) {
      return NextResponse.json({
        available: false,
        reason: `Store closed: ${closure.reason}`,
        slots: [],
      });
    }

    // 2. Fetch Shift for this Stylist
    const shift = await db.query.staffShifts.findFirst({
      where: and(
        eq(staffShifts.staffId, staffId),
        eq(staffShifts.storeId, storeId),
        eq(staffShifts.dayOfWeek, dayOfWeek),
        eq(staffShifts.isWorkingDay, true)
      ),
    });

    if (!shift) {
      return NextResponse.json({
        available: false,
        reason: 'Stylist regular day off',
        slots: [],
      });
    }

    // 3. Fetch Service for Duration & Buffer
    const service = await db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });
    if (!service) {
      return NextResponse.json({ error: 'Service not found', slots: [] }, { status: 404 });
    }

    const totalMinutes = service.durationMinutes + service.bufferMinutes; // e.g. 45 + 5 = 50 min

    // 4. Fetch Existing Bookings on that Date
    const dayStart = `${dateStr}T00:00:00.000Z`;
    const dayEnd = `${dateStr}T23:59:59.999Z`;

    const existing = await db.query.appointments.findMany({
      where: and(
        eq(appointments.staffId, staffId),
        inArray(appointments.status, ['CONFIRMED', 'IN_PROGRESS']),
        sql`slot_range && tstzrange(${dayStart}, ${dayEnd}, '[]')`
      ),
    });

    // 5. Generate Candidate 15-Minute Slots
    const [startH, startM] = shift.shiftStart.split(':').map(Number);
    const [endH, endM] = shift.shiftEnd.split(':').map(Number);

    const shiftStartMinutes = startH * 60 + startM;
    const shiftEndMinutes = endH * 60 + endM;

    const slots = [];

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

      // Format display 12-hour e.g. '2:30 PM'
      const displayHour = h % 12 || 12;
      const ampm = h >= 12 ? 'PM' : 'AM';
      const display = `${displayHour}:${String(min).padStart(2, '0')} ${ampm}`;

      slots.push({
        time: timeStr,
        display,
        isAvailable: !hasCollision,
        bookedReason: hasCollision ? 'Stylist already booked for this interval' : undefined,
      });
    }

    return NextResponse.json({
      available: true,
      serviceTitle: service.title,
      totalDurationMinutes: totalMinutes,
      slots,
    });
  } catch (error) {
    console.error('Error calculating slots:', error);
    return NextResponse.json({ error: 'Failed to calculate slots', slots: [] }, { status: 500 });
  }
}
