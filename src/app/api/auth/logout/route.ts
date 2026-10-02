import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookieName } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

  // 1. Delete Aura session cookie
  response.cookies.delete(getSessionCookieName());

  // 2. Delete all Supabase auth cookies present on request
  const allCookies = request.cookies.getAll();
  for (const c of allCookies) {
    if (c.name.startsWith('sb-') || c.name.includes('token') || c.name.includes('auth')) {
      response.cookies.delete(c.name);
      response.cookies.set({
        name: c.name,
        value: '',
        path: '/',
        maxAge: 0,
      });
    }
  }

  return response;
}
