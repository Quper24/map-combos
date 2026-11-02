const modules = import.meta.glob('../../content/mods/*.json', { eager: true, import: 'default' });
export const mods = Object.values(modules);
