export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { appointments, stores, services, staffProfiles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// M-2: Typed appointment format
interface FormattedAppointment {
  id: string;
  dateFormatted: string;
  salonAndBranch: string;
  stylistName: string;
  serviceTitle: string;
  price: number;
  status: string;
  slotStartTime: string;
  canCancelOnline: boolean;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // M-9: Parse pagination params
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 50));
    const offset = (page - 1) * limit;

    let list: Array<{
      id: string;
      status: string;
      slotRange: string;
      createdAt: Date;
      tenantId: string;
      customerId: string;
      store: { name: string };
      service: { title: string; price: string };
      staff: { user: { fullName: string } };
    }> = [];

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
          limit,
          offset,
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
        limit,
        offset,
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
        limit,
        offset,
      });
    }

    const now = new Date();

    const formatted: FormattedAppointment[] = list.map((apt) => {
      const match = apt.slotRange.match(/\["([^"]+)",\s*"([^"]+)"/);
      const startIso = match ? match[1] : apt.createdAt.toISOString();
      const startDate = new Date(startIso);

      const hoursUntilSlot = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const canCancelOnline = hoursUntilSlot >= 2 && apt.status === 'CONFIRMED';

      return {
        id: apt.id,
        dateFormatted: `${startDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Kolkata' })} at ${startDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })}`,
        salonAndBranch: apt.store.name,
        stylistName: apt.staff.user.fullName,
        serviceTitle: apt.service.title,
        price: Number(apt.service.price),
        status: apt.status,
        slotStartTime: startIso,
        canCancelOnline,
      };
    });

    const upcoming = formatted.filter((a) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS');
    const past = formatted.filter((a) => a.status !== 'CONFIRMED' && a.status !== 'IN_PROGRESS');

    return NextResponse.json({ upcoming, past, page, limit });
  } catch (error) {
    console.error('Error fetching appointments list:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}
