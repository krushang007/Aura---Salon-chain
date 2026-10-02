import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://salon_admin:Kaibil%40123@localhost:5432/kaibil';

// Connection pool configuration for Next.js App Router (handles connection re-use)
declare global {
  // eslint-disable-next-line no-var
  var __dbClient: postgres.Sql | undefined;
}

const client = globalThis.__dbClient || postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__dbClient = client;
}

export const db = drizzle(client, { schema });
export type DrizzleDB = typeof db;
