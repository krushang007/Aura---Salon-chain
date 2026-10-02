import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/db';
import { users, appointments, appointmentAuditLogs, staffProfiles, services } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { validateRequestBody, staffQuickBookSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'STAFF' && user.role !== 'TENANT_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 403 });
    }

    const validation = await validateRequestBody(request, staffQuickBookSchema);
    if ('error' in validation) {
      return validation.error;
    }

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
    } = validation.data;

    const normalizedEmail = customerEmail || null;
    const cleanPhone = customerPhone || null;
    const cleanName = customerFullName;

    // 1. Resolve Customer Account
    let customer: typeof users.$inferSelect | null = null;

    // Check by explicitly provided customerId
    if (customerId) {
      const found = await db.query.users.findFirst({
        where: eq(users.id, customerId),
      });
      if (found) customer = found;
    }

    // Check by Email
    if (!customer && normalizedEmail) {
      const found = await db.query.users.findFirst({
        where: eq(users.email, normalizedEmail),
      });
      if (found) customer = found;
    }

    // Check by Phone
    if (!customer && cleanPhone) {
      const found = await db.query.users.findFirst({
        where: eq(users.phone, cleanPhone),
      });
      if (found) customer = found;
    }

    // If client does not exist, auto-create customer account with secure random password
    if (!customer) {
      const emailToUse = normalizedEmail || `walkin.${crypto.randomUUID().slice(0, 8)}@aurasurat.in`;
      const randomSecret = crypto.randomBytes(16).toString('hex');
      const [newCustomer] = await db.insert(users).values({
        email: emailToUse,
        fullName: cleanName,
        phone: cleanPhone,
        passwordHash: hashPassword(randomSecret),
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
  } catch (error: unknown) {
    console.error('Quick book error:', error);
    const pgError = error as { code?: string };
    if (pgError.code === '23P01') {
      return NextResponse.json({ error: 'Chair or Stylist slot overlap collision on floor' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create quick booking' }, { status: 500 });
  }
}
