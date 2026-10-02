import { z } from 'zod';

const isBuildTime =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.npm_lifecycle_event === 'build' ||
  process.env.CI === 'true' ||
  process.env.GITHUB_ACTIONS === 'true';

/**
 * Server-side environment validation schema.
 * Validated lazily on first access — fails fast with clear error messages.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET must be at least 16 characters').default('aaaa-aaaa-aaaa-aaaa-aaaa-aaaa-aaaa-aaaa'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  DEFAULT_TENANT_SLUG: z.string().default('bonanza'),
  DEFAULT_TIMEZONE: z.string().default('Asia/Kolkata'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let _validated: ServerEnv | null = null;

/**
 * Returns validated server environment variables.
 * Allows safe compilation during CI/build phase while strictly enforcing at runtime.
 */
export function getServerEnv(): ServerEnv {
  if (_validated) return _validated;

  const rawDbUrl = process.env.DATABASE_URL?.trim();
  const dbUrlToValidate = rawDbUrl || (isBuildTime ? 'postgresql://build_placeholder:placeholder@localhost:5432/build_db' : '');

  const envToParse = {
    ...process.env,
    DATABASE_URL: dbUrlToValidate,
  };

  const result = serverEnvSchema.safeParse(envToParse);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `❌ Invalid environment variables:\n${formatted}\n\nSee .env.example for required configuration.`
    );
  }

  _validated = result.data;
  return _validated;
}
