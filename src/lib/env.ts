import { z } from 'zod';

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
 * Throws on first call if any required variable is missing or invalid.
 */
export function getServerEnv(): ServerEnv {
  if (_validated) return _validated;

  const result = serverEnvSchema.safeParse(process.env);
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
