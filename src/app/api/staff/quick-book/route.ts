import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, appointments, appointmentAuditLogs, notifications, staffProfiles, services } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'STAFF') {
      return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 403 });
    }

    const body = await request.json();
    const { storeId, staffId, serviceId, customerFullName, customerPhone, startTime, customerNotes } = body;

    if (!storeId || !staffId || !serviceId || !customerFullName || !startTime) {
      return NextResponse.json({ error: 'Missing required quick-book fields' }, { status: 400 });
    }

    // 1. Find or create walk-in customer account
    const walkinEmail = `walkin.${Date.now()}@aurasurat.in`;
    let [customer] = await db.insert(users).values({
      email: walkinEmail,
      fullName: String(customerFullName).trim(),
      phone: customerPhone ? String(customerPhone).trim() : null,
      passwordHash: hashPassword('Walkin@123'),
      role: 'CUSTOMER',
      tenantId: null,
      isActive: true,
    }).returning();

    // 2. Fetch service & staff chair
    const service = await db.query.services.findFirst({
      where: eq(services.id, serviceId),
    });
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    const staff = await db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.id, staffId),
    });
    if (!staff) return NextResponse.json({ error: 'Stylist not found' }, { status: 404 });

    const totalMinutes = service.durationMinutes + service.bufferMinutes;
    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + totalMinutes * 60 * 1000);

    // 3. Insert appointment
    const [booking] = await db.insert(appointments).values({
      tenantId: staff.tenantId,
      storeId,
      staffId,
      customerId: customer.id,
      bookedByUserId: user.id,
      serviceId,
      assignedChair: staff.assignedChair,
      slotRange: sql`tstzrange(${startDate.toISOString()}, ${endDate.toISOString()}, '[)')`,
      status: 'CONFIRMED',
      customerNotes: customerNotes ? `[Walk-in] ${customerNotes}` : '[Walk-in Arrival]',
    }).returning();

    // 4. Audit Log
    await db.insert(appointmentAuditLogs).values({
      appointmentId: booking.id,
      action: 'CREATED',
      actorRole: 'STAFF',
      actorId: user.id,
      newStatus: 'CONFIRMED',
      newStoreId: storeId,
      newStaffId: staffId,
      newSlotRange: sql`tstzrange(${startDate.toISOString()}, ${endDate.toISOString()}, '[)')`,
      notes: `Walk-in booking created at reception by stylist ${user.fullName}`,
    });

    return NextResponse.json({ success: true, appointmentId: booking.id });
  } catch (error: any) {
    console.error('Quick book error:', error);
    if (error.code === '23P01') {
      return NextResponse.json({ error: 'Chair or Stylist slot overlap collision on floor' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create quick booking' }, { status: 500 });
  }
}
