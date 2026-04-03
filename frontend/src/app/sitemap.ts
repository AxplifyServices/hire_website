import type {MetadataRoute} from 'next';

const routes = ['', '/agences', '/flotte', '/connexion', '/compte', '/compte/reservations', '/gestion-reservation'];
const locales = ['fr', 'en', 'ar'];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://hire-automotive.local';

  return locales.flatMap((locale) =>
    routes.map((route) => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: new Date(),
      changeFrequency: route === '' ? 'daily' : 'weekly',
      priority: route === '' ? 1 : 0.7
    }))
  );
}
