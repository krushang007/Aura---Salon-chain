import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, signSession, getSessionCookieName } from '@/lib/auth';
import { validateRequestBody, registerSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const validation = await validateRequestBody(request, registerSchema);
    if ('error' in validation) {
      return validation.error;
    }

    const { fullName, email, password, phone } = validation.data;

    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Insert marketplace customer (tenantId = null)
    const [newUser] = await db.insert(users).values({
      email,
      fullName,
      passwordHash: hashPassword(password),
      phone: phone || null,
      role: 'CUSTOMER',
      tenantId: null, // open marketplace
      isActive: true,
    }).returning();

    const sessionUser = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      tenantId: null,
      storeId: null,
    };

    const token = signSession(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      redirectUrl: '/',
    });

    response.cookies.set({
      name: getSessionCookieName(),
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
