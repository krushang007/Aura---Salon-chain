import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, staffProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPassword, signSession, getSessionCookieName } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // 1. Fetch user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 2. Verify Password
    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // 3. If Staff, get assigned storeId
    let storeId: string | null = null;
    if (user.role === 'STAFF') {
      const staff = await db.query.staffProfiles.findFirst({
        where: eq(staffProfiles.userId, user.id),
      });
      storeId = staff?.currentStoreId || null;
    }

    // 4. Create Session
    const sessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
      storeId,
    };

    const token = signSession(sessionUser);

    // 5. Determine Role-Based Routing
    let redirectUrl = '/';
    if (user.role === 'STAFF') {
      redirectUrl = '/staff';
    } else if (user.role === 'TENANT_ADMIN') {
      redirectUrl = '/admin';
    }

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      redirectUrl,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
