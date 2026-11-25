import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Only real public pages. /terms and /privacy stay out while they are drafts (noindex),
// and there is deliberately no public list of vets, so vet profiles are not listed.
const PUBLIC_PATHS = ['/', '/for-vets', '/owner/login', '/vet/login', '/register'];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : 0.6,
  }));
}
