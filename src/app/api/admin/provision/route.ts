import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, staffProfiles, staffShifts, notifications } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'TENANT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized salon admin access' }, { status: 403 });
    }

    const tenantId = admin.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const body = await request.json();
    const {
      fullName,
      email,
      temporaryPassword = 'Password@123',
      storeId,
      primaryRoleTitle = 'Senior Stylist',
      assignedChair = 2,
      chairStationName = 'Chair 02',
      shiftDays = [1, 2, 3, 4, 5],
      shiftStart = '09:00:00',
      shiftEnd = '18:00:00',
    } = body;

    if (!fullName || !email || !storeId) {
      return NextResponse.json({ error: 'Full name, email, and store are required' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // 1. Transaction to provision staff without third-party email invites
    const result = await db.transaction(async (tx) => {
      // Create user or update existing
      let [staffUser] = await tx.insert(users).values({
        tenantId,
        email: normalizedEmail,
        passwordHash: hashPassword(temporaryPassword),
        fullName: String(fullName).trim(),
        role: 'STAFF',
        isActive: true,
      }).onConflictDoUpdate({
        target: users.email,
        set: { role: 'STAFF', tenantId, updatedAt: new Date() },
      }).returning();

      // Create staff profile
      let [profile] = await tx.insert(staffProfiles).values({
        userId: staffUser.id,
        tenantId,
        currentStoreId: storeId,
        title: primaryRoleTitle,
        assignedChair,
        chairStationName,
        ratingAverage: '4.90',
        totalReviews: 0,
        isActive: true,
      }).onConflictDoUpdate({
        target: staffProfiles.userId,
        set: { currentStoreId: storeId, title: primaryRoleTitle, assignedChair, chairStationName },
      }).returning();

      // Insert shifts
      const shifts = shiftDays.map((d: number) => ({
        staffId: profile.id,
        storeId,
        dayOfWeek: d,
        shiftStart,
        shiftEnd,
        isWorkingDay: true,
      }));
      await tx.insert(staffShifts).values(shifts);

      // In-app Notification for stylist upon their first login
      await tx.insert(notifications).values({
        tenantId,
        recipientUserId: staffUser.id,
        title: 'Stylist Seat Provisioned',
        message: `Welcome to Salon Bonanza. Your station (${chairStationName}) and weekly shift schedule are now active.`,
        type: 'STAFF_PROVISIONED',
        entityId: profile.id,
      });

      return { staffUser, profile };
    });

    return NextResponse.json({
      success: true,
      message: `Staff member ${fullName} (${normalizedEmail}) provisioned successfully for ${chairStationName}. Zero invite email needed.`,
      profileId: result.profile.id,
    });
  } catch (error) {
    console.error('Staff provisioning error:', error);
    return NextResponse.json({ error: 'Failed to provision staff member' }, { status: 500 });
  }
}
