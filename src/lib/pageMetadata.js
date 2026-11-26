import { comboPath } from './presetCombos.js';

export const defaultMetadata = {
  title: 'Quper Simulator — Весь мир у наших колёс',
  description:
    'Quper Simulator: сборки карт ETS2 и ATS, собственные моды и плагины, видео и виртуальная транспортная компания. Весь мир у наших колёс!',
  image: '/img/logo.jpg',
  path: '/',
};

export const sectionMetadata = {
  '/combos': [
    'Сборки карт ETS2 и ATS',
    'Актуальные и архивные сборки карт ETS2 и ATS: версии, порядок модов и установка.',
  ],
  '/combos/builder': [
    'Конструктор сборок ETS2 и ATS',
    'Выбери карты и моды, проверь совместимость и получи порядок установки для своей сборки.',
  ],
  '/mods': [
    'Моды и плагины',
    'Моды и плагины Quper Simulator для ETS2 и ATS: описание, совместимость и установка.',
  ],
  '/videos': [
    'Видео',
    'Видео Quper Simulator: обзоры сборок, карт, модов и путешествия в ETS2 и ATS.',
  ],
  '/vtc': [
    'Виртуальная транспортная компания',
    'Виртуальная транспортная компания Quper Simulator: информация о компании и вступлении.',
  ],
  '/server-guide': [
    'Инструкция по серверам',
    'Как подключиться к серверам Quper Simulator в ETS2 и ATS: настройка и установка сборок.',
  ],
  '/faq': [
    'Вопросы и ответы',
    'Ответы на вопросы об установке сборок, картах и модах для ETS2 и ATS.',
  ],
};

export function comboMetadata(combo) {
  const game = combo.tags?.includes('ats') ? 'ATS' : 'ETS2';
  return {
    title: `${combo.title} — ${game} ${combo.version_game} | Quper Simulator`,
    description: `${combo.title} для ${game} ${combo.version_game}.${combo.version ? ` Версия сборки: ${combo.version}.` : ''}${combo.date ? ` Обновлено: ${combo.date}.` : ''} Состав сборки, порядок модов и установка.`,
    image: combo.preview || defaultMetadata.image,
    path: comboPath(combo),
  };
}

export function modMetadata(mod) {
  return {
    title: `${mod.title}${mod.version ? ` ${mod.version}` : ''} | Quper Simulator`,
    description: mod.summary,
    image: mod.cover || defaultMetadata.image,
    path: `/mods/${mod.id}`,
  };
}

export function metadataForPath(path, combos = [], mods = []) {
  path = path.replace(/\/+$/, '') || '/';
  const combo = combos.find((item) =>
    [comboPath(item), `/combos/${item.id}`, item.slug && `/combos/${item.slug}`].includes(path),
  );
  if (combo) return comboMetadata(combo);
  const mod = mods.find((item) => `/mods/${item.id}` === path);
  if (mod) return modMetadata(mod);
  const section = sectionMetadata[path];
  return section
    ? {
        ...defaultMetadata,
        title: `${section[0]} | Quper Simulator`,
        description: section[1],
        path,
      }
    : defaultMetadata;
}

export function socialImagePath(image) {
  if (/^https?:\/\//.test(image)) return image;
  return `/img/social/${image.replace(/^\//, '').replace(/\.[^/.]+$/, '.jpg')}`;
}

export function metadataTags(metadata, domain) {
  const absolute = (path) => new URL(path, `${domain}/`).href;
  return {
    description: metadata.description,
    'og:type': 'website',
    'og:site_name': 'Quper Simulator',
    'og:locale': 'ru_RU',
    'og:title': metadata.title,
    'og:description': metadata.description,
    'og:url': absolute(metadata.path),
    'og:image': absolute(socialImagePath(metadata.image)),
    'og:image:type': 'image/jpeg',
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:image:alt': metadata.title,
    'twitter:card': 'summary_large_image',
    'twitter:title': metadata.title,
    'twitter:description': metadata.description,
    'twitter:image': absolute(socialImagePath(metadata.image)),
  };
}
