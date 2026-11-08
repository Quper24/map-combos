export const presetTags = ['boosty', 'server', 'convoy'];

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
