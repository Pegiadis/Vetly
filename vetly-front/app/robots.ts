import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // The longer Allow paths win over the dashboard prefixes below.
      allow: ['/', '/owner/login', '/vet/login', '/vet/register'],
      disallow: ['/admin', '/owner/', '/vet/', '/invite/', '/verify-email', '/reset-password', '/forgot-password', '/mobile-auth', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
