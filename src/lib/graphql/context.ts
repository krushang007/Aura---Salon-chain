import { db, DrizzleDB } from '@/db';
import { verifySession, SessionUser } from '@/lib/auth';

export interface GraphQLContext {
  db: DrizzleDB;
  tenantSlug: string;
  user: SessionUser | null;
}

/**
 * Extracts and verifies the aura_session cookie from the raw request.
 * Populates context.user if the session is valid, otherwise null.
 */
export async function createContext(request: Request): Promise<GraphQLContext> {
  const tenantSlug =
    request.headers.get('x-tenant-slug') || process.env.DEFAULT_TENANT_SLUG || 'bonanza';

  // Parse cookies from the raw Cookie header
  let user: SessionUser | null = null;
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)aura_session=([^;]+)/);
    if (match) {
      user = verifySession(match[1]);
    }
  }

  return { db, tenantSlug, user };
}
