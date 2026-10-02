import { MetadataRoute } from 'next';
import { db } from '@/db';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://kaibuild.space';

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/login',
    '/register',
    '/partner-register',
    '/forgot-password',
    '/help',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    const activeStores = await db.query.stores.findMany({
      where: (s, { eq }) => eq(s.isActive, true),
    });

    const storeRoutes: MetadataRoute.Sitemap = activeStores.map((store) => ({
      url: `${baseUrl}/book/${store.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    }));

    return [...staticRoutes, ...storeRoutes];
  } catch {
    return staticRoutes;
  }
}
