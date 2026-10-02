import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { or, ilike } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== 'STAFF' && user.role !== 'TENANT_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized staff access' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ customers: [] });
    }

    const matchedUsers = await db.query.users.findMany({
      where: or(
        ilike(users.fullName, `%${q}%`),
        ilike(users.email, `%${q}%`),
        ilike(users.phone, `%${q}%`)
      ),
      limit: 10,
    });

    const customers = matchedUsers
      .filter((u) => u.role === 'CUSTOMER')
      .map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
      }));

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Error searching customers:', error);
    return NextResponse.json({ error: 'Failed to search customers' }, { status: 500 });
  }
}
