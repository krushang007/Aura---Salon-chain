import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, appointments, appointmentAuditLogs, staffProfiles, services } from '@/db/schema';
import { eq, or, sql } from 'drizzle-orm';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'STAFF' && user.role !== 'TENANT_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 403 });
    }

    const body = await request.json();
    const {
      storeId,
      staffId,
      serviceId,
      customerFullName,
      customerPhone,
      customerEmail,
      customerId,
      startTime,
      customerNotes,
    } = body;

    if (!storeId || !staffId || !serviceId || !customerFullName || !startTime) {
      return NextResponse.json({ error: 'Missing required quick-book fields' }, { status: 400 });
    }

    const normalizedEmail = customerEmail ? String(customerEmail).trim().toLowerCase() : null;
    const cleanPhone = customerPhone ? String(customerPhone).trim() : null;
    const cleanName = String(customerFullName).trim();

    // 1. Resolve Customer Account
    let customer: any = null;

    // Check by explicitly provided customerId
    if (customerId) {
      customer = await db.query.users.findFirst({
        where: eq(users.id, customerId),
      });
    }

    // Check by Email
    if (!customer && normalizedEmail) {
      customer = await db.query.users.findFirst({
        where: eq(users.email, normalizedEmail),
      });
    }

    // Check by Phone
    if (!customer && cleanPhone) {
      customer = await db.query.users.findFirst({
        where: eq(users.phone, cleanPhone),
      });
    }

    // If client does not exist, auto-create customer account with their real contact details
    if (!customer) {
      const emailToUse = normalizedEmail || `walkin.${cleanPhone?.replace(/[^0-9]/g, '') || Date.now()}@aurasurat.in`;
      const [newCustomer] = await db.insert(users).values({
        email: emailToUse,
        fullName: cleanName,
        phone: cleanPhone,
        passwordHash: hashPassword('Walkin@123'),
        role: 'CUSTOMER',
        tenantId: null,
        isActive: true,
      }).returning();
      customer = newCustomer;
    } else {
      // Update phone or name if missing
      if (!customer.phone && cleanPhone) {
        await db.update(users).set({ phone: cleanPhone, updatedAt: new Date() }).where(eq(users.id, customer.id));
      }
    }

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

    // 3. Insert appointment linked directly to client account
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
      customerNotes: customerNotes ? `[Walk-in] ${customerNotes}` : `[Walk-in Arrival: ${cleanName}]`,
    }).returning();

    // 4. Audit Log
    await db.insert(appointmentAuditLogs).values({
      appointmentId: booking.id,
      action: 'CREATED',
      actorRole: user.role === 'TENANT_ADMIN' ? 'ADMIN' : 'STAFF',
      actorId: user.id,
      newStatus: 'CONFIRMED',
      newStoreId: storeId,
      newStaffId: staffId,
      newSlotRange: sql`tstzrange(${startDate.toISOString()}, ${endDate.toISOString()}, '[)')`,
      notes: `Walk-in booking created by ${user.fullName} for client ${cleanName} (${customer.email})`,
    });

    return NextResponse.json({
      success: true,
      appointmentId: booking.id,
      customer: {
        id: customer.id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
      },
      message: `Walk-in booking confirmed for ${cleanName}. Associated with client account ${customer.email}.`,
    });
  } catch (error: any) {
    console.error('Quick book error:', error);
    if (error.code === '23P01') {
      return NextResponse.json({ error: 'Chair or Stylist slot overlap collision on floor' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create quick booking' }, { status: 500 });
  }
}
