import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, staffProfiles } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { hashPassword, signSession, getSessionCookieName } from '@/lib/auth';

function getOrigin(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  const host = request.headers.get('host');
  if (host && !host.includes('localhost')) {
    return `https://${host}`;
  }
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getOrigin(request);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session?.user && session.user.email) {
      const email = session.user.email.toLowerCase();

      // Find user in database by ID or by email
      let dbUser = await db.query.users.findFirst({
        where: or(eq(users.id, session.user.id), eq(users.email, email)),
      });

      // If user does not exist in local DB, create them as CUSTOMER
      if (!dbUser) {
        const defaultTenant = await db.query.tenants.findFirst();
        const fullName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          email.split('@')[0] ||
          'Aura Guest';

        try {
          const [newUser] = await db.insert(users).values({
            id: session.user.id,
            email,
            passwordHash: hashPassword(session.user.id),
            fullName,
            role: 'CUSTOMER',
            tenantId: defaultTenant?.id || null,
            isActive: true,
          }).returning();
          dbUser = newUser;
        } catch {
          // In case ID already existed with a different email or race condition
          dbUser = await db.query.users.findFirst({
            where: eq(users.email, email),
          });
        }
      }

      if (dbUser && dbUser.isActive) {
        let storeId: string | null = null;
        if (dbUser.role === 'STAFF') {
          const staff = await db.query.staffProfiles.findFirst({
            where: eq(staffProfiles.userId, dbUser.id),
          });
          storeId = staff?.currentStoreId || null;
        }

        const sessionUser = {
          id: dbUser.id,
          email: dbUser.email,
          fullName: dbUser.fullName,
          role: dbUser.role,
          tenantId: dbUser.tenantId,
          storeId,
        };

        const token = signSession(sessionUser);

        // Determine destination
        let destination = `${origin}/appointments`;
        if (next && next.startsWith('/') && next !== '/') {
          destination = `${origin}${next}`;
        } else if (dbUser.role === 'TENANT_ADMIN') {
          destination = `${origin}/admin`;
        } else if (dbUser.role === 'STAFF') {
          destination = `${origin}/staff`;
        }

        const response = NextResponse.redirect(destination);
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
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
