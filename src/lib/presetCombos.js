export const presetTags = ['boosty', 'server', 'convoy'];

export const catalogKey = ({ game, version }) => `${game}-${version}`;

const presetName = (catalog, preset) => `${catalog.game}-${preset.fileSlug || preset.id}`;

export function presetFileName(catalog, preset) {
  return `${presetName(catalog, preset)}-${catalog.version}.json`;
}

export function comboPath(combo) {
  return combo.slug && !combo.draft ? `/${combo.slug}` : `/combos/${combo.id}`;
}

export function combinedPresetPairs(catalog) {
  const byId = new Map(catalog.entries.map((entry) => [entry.id, entry]));
  const eligible = catalog.presets.filter((preset) => !preset.tags?.includes('server'));
  const maps = eligible.filter((preset) =>
    preset.selection.some((id) => byId.get(id)?.type === 'map'),
  );
  const mods = eligible.filter(
    (preset) =>
      !preset.selection.some((id) => byId.get(id)?.type === 'map') &&
      preset.selection.some((id) => byId.get(id)?.type === 'mod'),
  );
  return maps.flatMap((mapPreset) =>
    mods.map((modPreset) => {
      const fileSlug = `${mapPreset.fileSlug || mapPreset.id}-mods`;
      const preset = {
        id: `${mapPreset.id}-with-${modPreset.id}`,
        title: `${mapPreset.title} + ${modPreset.title}`,
        fileSlug,
        slug: `${catalog.game}-${fileSlug}-${catalog.version.replace('.', '')}`,
        version: mapPreset.version || modPreset.version,
        boosty: modPreset.boosty || mapPreset.boosty,
        image: mapPreset.image,
        tags: [...new Set([...(mapPreset.tags || []), ...(modPreset.tags || [])])].filter(
          (tag) => tag !== 'server',
        ),
        updatedAt: [mapPreset.updatedAt, modPreset.updatedAt].filter(Boolean).sort().at(-1),
        selection: [...new Set([...mapPreset.selection, ...modPreset.selection])],
        composition: { mapPresetId: mapPreset.id, modPresetId: modPreset.id },
      };
      return { mapPreset, modPreset, preset };
    }),
  );
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
    slug: preset.slug || `${presetName(catalog, preset)}-${catalog.version.replace('.', '')}`,
    title: preset.title,
    version_game: catalog.version,
    version: preset.version,
    tags: [catalog.game, ...(preset.tags || [])],
    preview: preset.image || mapCover || '/img/logo-280.jpg',
    date: preset.updatedAt?.split('-').reverse().join('.'),
    boosty: preset.boosty,
    profile: preset.profile,
    cloud: preset.cloud,
    company: preset.company,
    builder: { catalog, preset },
  };
}
