import { db, DrizzleDB } from '@/db';

export interface GraphQLContext {
  db: DrizzleDB;
  tenantSlug: string;
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

export async function createContext(request: Request): Promise<GraphQLContext> {
  const tenantSlug = request.headers.get('x-tenant-slug') || process.env.DEFAULT_TENANT_SLUG || 'bonanza';

  return {
    db,
    tenantSlug,
  };
}
