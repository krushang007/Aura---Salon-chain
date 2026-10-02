export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, stores, services, staffProfiles, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let list: any[] = [];

    if (user.role === 'STAFF') {
      const staff = await db.query.staffProfiles.findFirst({
        where: eq(staffProfiles.userId, user.id),
      });

      if (staff) {
        list = await db.query.appointments.findMany({
          where: eq(appointments.staffId, staff.id),
          with: {
            store: true,
            service: true,
            staff: {
              with: {
                user: true,
              },
            },
          },
          orderBy: [desc(appointments.createdAt)],
        });
      }
    } else if (user.role === 'TENANT_ADMIN' && user.tenantId) {
      list = await db.query.appointments.findMany({
        where: eq(appointments.tenantId, user.tenantId),
        with: {
          store: true,
          service: true,
          staff: {
            with: {
              user: true,
            },
          },
        },
        orderBy: [desc(appointments.createdAt)],
      });
    } else {
      // Default: CUSTOMER
      list = await db.query.appointments.findMany({
        where: eq(appointments.customerId, user.id),
        with: {
          store: true,
          service: true,
          staff: {
            with: {
              user: true,
            },
          },
        },
        orderBy: [desc(appointments.createdAt)],
      });
    }

    const now = new Date();

    const formatted = await Promise.all(
      list.map(async (apt) => {
        const match = apt.slotRange.match(/\["([^"]+)",\s*"([^"]+)"/);
        const startIso = match ? match[1] : apt.createdAt.toISOString();
        const startDate = new Date(startIso);

        const hoursUntilSlot = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const canCancelOnline = hoursUntilSlot >= 2 && apt.status === 'CONFIRMED';

        return {
          id: apt.id,
          dateFormatted: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`,
          salonAndBranch: apt.store.name,
          stylistName: apt.staff.user.fullName,
          serviceTitle: apt.service.title,
          price: Number(apt.service.price),
          status: apt.status,
          slotStartTime: startIso,
          canCancelOnline,
        };
      })
    );

    const upcoming = formatted.filter((a) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS');
    const past = formatted.filter((a) => a.status !== 'CONFIRMED' && a.status !== 'IN_PROGRESS');

    return NextResponse.json({ upcoming, past });
  } catch (error) {
    console.error('Error fetching appointments list:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}
