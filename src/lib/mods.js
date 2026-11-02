const modules = import.meta.glob('../../content/mods/*.json', { eager: true, import: 'default' });
export const mods = Object.values(modules).sort(
  (a, b) => (a.order ?? 1000) - (b.order ?? 1000) || a.title.localeCompare(b.title, 'ru'),
);
