import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const decision = formData.get('decision');
    const authorizationId = formData.get('authorization_id') as string;

    if (!authorizationId) {
      return NextResponse.json({ error: 'Missing authorization_id' }, { status: 400 });
    }

    const supabase = createClient();

    if (decision === 'approve') {
      const { data, error } = await (supabase.auth as any).oauth.approveAuthorization(authorizationId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.redirect(data.redirect_url);
    } else {
      const { data, error } = await (supabase.auth as any).oauth.denyAuthorization(authorizationId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.redirect(data.redirect_url);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'OAuth decision error' }, { status: 500 });
  }
}
