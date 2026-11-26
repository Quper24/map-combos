import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAllCombos } from '../data';
import { combinedPresetCombos } from '../data/builderCatalogs';
import { mods } from '../lib/mods';
import site from '../../content/site.json';
import { metadataForPath, metadataTags } from '../lib/pageMetadata';
import { useTranslation } from '../i18n/Language';

export default function PageMetadata() {
  const { pathname } = useLocation();
  const { t, language } = useTranslation();
  useEffect(() => {
    const metadata = metadataForPath(pathname, [...getAllCombos(), ...combinedPresetCombos], mods);
    metadata.title = t(metadata.title);
    metadata.description = t(metadata.description);
    document.title = metadata.title;
    const tags = metadataTags(metadata, site.domain);
    tags['og:locale'] = language === 'en' ? 'en_US' : 'ru_RU';
    for (const [key, value] of Object.entries(tags)) {
      const attribute = key.startsWith('og:') ? 'property' : 'name';
      let tag = document.head.querySelector(`meta[${attribute}="${key}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, key);
        document.head.append(tag);
      }
      tag.content = value;
    }
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.append(canonical);
    }
    canonical.href = tags['og:url'];
  }, [pathname, t, language]);
  return null;
}
