export const presetTags = ['boosty', 'server', 'convoy'];

export const catalogKey = ({ game, version }) => `${game}-${version}`;

export function presetFileName(catalog, preset) {
  return `${catalog.game}-${preset.fileSlug || preset.id}-${catalog.version}.json`;
}

export function attachPresetFiles(catalogs, files) {
  const releases = new Map();
  for (const catalog of catalogs) {
    const key = catalogKey(catalog);
    if (releases.has(key)) throw new Error(`Duplicate catalog: ${key}`);
    releases.set(key, { ...catalog, presets: [...catalog.presets] });
  }
  for (const file of files) {
    if (typeof file?.preset?.id !== 'string') throw new Error('Invalid combo JSON');
    const key = catalogKey(file);
    const catalog = releases.get(key);
    if (!catalog) throw new Error(`Общий каталог для сборки не найден — ${key}`);
    if (catalog.presets.some(({ id }) => id === file.preset.id)) {
      throw new Error(`Сборка встречается в нескольких файлах — ${file.preset.id}`);
    }
    catalog.presets.push(file.preset);
  }
  return [...releases.values()];
}

export function presetCombo(catalog, preset) {
  const mapCover = catalog.entries.find(
    (entry) => entry.type === 'map' && entry.image && preset.selection.includes(entry.id),
  )?.image;
  return {
    id: `${catalog.game}-${catalog.version.replace('.', '-')}-${preset.id}`,
    title: preset.title,
    version_game: catalog.version,
    tags: [catalog.game, ...(preset.tags || [])],
    preview: preset.image || mapCover || '/img/logo-280.jpg',
    date: preset.updatedAt?.split('-').reverse().join('.'),
    boosty: preset.boosty,
    profile: preset.profile,
    builder: { catalog, preset },
  };
}
