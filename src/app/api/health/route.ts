import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  let dbStatus = 'connected';
  let latencyMs = 0;

  try {
    const start = performance.now();
    await db.execute(sql`SELECT 1`);
    latencyMs = Math.round(performance.now() - start);
  } catch (error) {
    dbStatus = `disconnected: ${(error as Error).message}`;
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'salon-appointment-booking',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      latencyMs: latencyMs > 0 ? `${latencyMs}ms` : undefined,
    },
    api: {
      graphql: '/api/graphql',
      health: '/api/health',
    },
  });
}
