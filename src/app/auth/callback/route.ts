import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && session?.user) {
      // Query user role from public.users to determine destination
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'TENANT_ADMIN') {
        return NextResponse.redirect(`${origin}/admin`);
      }
      if (profile?.role === 'STAFF') {
        return NextResponse.redirect(`${origin}/staff`);
      }
      return NextResponse.redirect(`${origin}${next.startsWith('/') && next !== '/' ? next : '/appointments'}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
