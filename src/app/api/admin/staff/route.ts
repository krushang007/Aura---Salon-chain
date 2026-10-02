export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { staffProfiles, stores, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { validateRequestBody, adminStaffUpdateSchema } from '@/lib/validations';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TENANT_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized salon admin access' }, { status: 403 });
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
    }

    const staffList = await db.query.staffProfiles.findMany({
      where: eq(staffProfiles.tenantId, tenantId),
      with: {
        user: true,
        store: true,
      },
    });

    const formatted = staffList.map((st) => ({
      id: st.id,
      userId: st.userId,
      fullName: st.user.fullName,
      email: st.user.email,
      storeId: st.currentStoreId,
      branchName: st.store.name,
      title: st.title,
      assignedChair: st.assignedChair,
      chairStationName: st.chairStationName,
      ratingAverage: Number(st.ratingAverage),
      totalReviews: st.totalReviews,
      isActive: st.isActive,
    }));

    const storeList = await db.query.stores.findMany({
      where: eq(stores.tenantId, tenantId),
    });

    return NextResponse.json({
      staff: formatted,
      stores: storeList.map((s) => ({
        id: s.id,
        name: s.name,
        totalStylingChairs: s.totalStylingChairs || 5,
      })),
    });
  } catch (error) {
    console.error('Error fetching admin staff list:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'TENANT_ADMIN' || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized salon admin access' }, { status: 403 });
    }

    const validation = await validateRequestBody(request, adminStaffUpdateSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { staffId, fullName, title, assignedChair, storeId, newPassword, isActive } = validation.data;

    const existingProfile = await db.query.staffProfiles.findFirst({
      where: and(eq(staffProfiles.id, staffId), eq(staffProfiles.tenantId, user.tenantId)),
      with: { user: true },
    });

    if (!existingProfile) {
      return NextResponse.json({ error: 'Staff member profile not found' }, { status: 404 });
    }

    // 1. Update User Record (fullName, optional passwordHash, isActive)
    const userUpdates: Partial<typeof users.$inferInsert> = { updatedAt: new Date() };
    if (fullName) userUpdates.fullName = fullName;
    if (typeof isActive === 'boolean') userUpdates.isActive = isActive;
    if (newPassword && newPassword.length >= 6) {
      userUpdates.passwordHash = hashPassword(newPassword);
    }

    await db.update(users).set(userUpdates).where(eq(users.id, existingProfile.userId));

    // 2. Update Staff Profile (title, assignedChair, storeId)
    const profileUpdates: Partial<typeof staffProfiles.$inferInsert> = { updatedAt: new Date() };
    if (title) profileUpdates.title = title;
    if (assignedChair) {
      profileUpdates.assignedChair = assignedChair;
      profileUpdates.chairStationName = `Chair ${String(assignedChair).padStart(2, '0')}`;
    }
    if (storeId) profileUpdates.currentStoreId = storeId;
    if (typeof isActive === 'boolean') profileUpdates.isActive = isActive;

    const [updatedStaff] = await db
      .update(staffProfiles)
      .set(profileUpdates)
      .where(eq(staffProfiles.id, staffId))
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Stylist configuration updated successfully.',
      staff: updatedStaff,
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    return NextResponse.json({ error: 'Failed to update stylist configuration' }, { status: 500 });
  }
}
