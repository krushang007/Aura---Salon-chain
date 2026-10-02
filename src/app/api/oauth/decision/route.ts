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

    interface OAuthDecisionResponse {
      data?: { redirect_url: string };
      error?: { message: string };
    }

    const authClient = supabase.auth as unknown as {
      oauth?: {
        approveAuthorization: (id: string) => Promise<OAuthDecisionResponse>;
        denyAuthorization: (id: string) => Promise<OAuthDecisionResponse>;
      };
    };

    if (decision === 'approve') {
      const res = await authClient.oauth?.approveAuthorization(authorizationId);

      if (res?.error || !res?.data) {
        return NextResponse.json({ error: res?.error?.message || 'Approval failed' }, { status: 400 });
      }

      return NextResponse.redirect(res.data.redirect_url);
    } else {
      const res = await authClient.oauth?.denyAuthorization(authorizationId);

      if (res?.error || !res?.data) {
        return NextResponse.json({ error: res?.error?.message || 'Denial failed' }, { status: 400 });
      }

      return NextResponse.redirect(res.data.redirect_url);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'OAuth decision error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
