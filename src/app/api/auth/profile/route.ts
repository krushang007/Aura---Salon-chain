export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, signSession, getSessionCookieName } from '@/lib/auth';
import { validateRequestBody, profileUpdateSchema } from '@/lib/validations';

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        fullName: dbUser.fullName,
        email: dbUser.email,
        phone: dbUser.phone || '',
        role: dbUser.role,
        createdAt: dbUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await validateRequestBody(request, profileUpdateSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { fullName, phone } = validation.data;

    // Update User in DB
    const [updated] = await db
      .update(users)
      .set({
        fullName,
        phone: phone || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.id))
      .returning();

    // Re-sign session cookie with updated name
    const newSessionToken = signSession({
      id: updated.id,
      email: updated.email,
      fullName: updated.fullName,
      role: updated.role,
      tenantId: updated.tenantId,
      storeId: session.storeId,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone || '',
        role: updated.role,
        createdAt: updated.createdAt,
      },
    });

    response.cookies.set({
      name: getSessionCookieName(),
      value: newSessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
