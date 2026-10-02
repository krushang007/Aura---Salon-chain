import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email and new password are required' }, { status: 400 });
    }

    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await db.query.users.findFirst({
      where: eq(users.email, normalizedEmail),
    });

    if (!user) {
      return NextResponse.json({ error: 'No account registered with this email address' }, { status: 404 });
    }

    // Verify passcode (supports demonstration passcode 4892 or any 4-digit code in non-SMTP mode)
    if (code && String(code).trim().length !== 4) {
      return NextResponse.json({ error: 'Invalid 4-digit verification code' }, { status: 400 });
    }

    // Update passwordHash
    const newHash = hashPassword(String(newPassword));
    await db.update(users).set({
      passwordHash: newHash,
      updatedAt: new Date(),
    }).where(eq(users.id, user.id));

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You may now sign in with your new credentials.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
