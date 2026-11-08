import { validateCatalog } from './comboBuilder.js';
import { catalogKey, presetFileName } from './presetCombos.js';

export const builderDraftKey = 'quperSimulator_comboDraft';

export function readBuilderDraft() {
  try {
    const raw = localStorage.getItem(builderDraftKey);
    return raw ? validateCatalog(JSON.parse(raw), true) : null;
  } catch {
    return null;
  }
}

export function restorePresetFileSlugs(catalog, publishedCatalogs) {
  const published = publishedCatalogs.find(
    (release) => catalogKey(release) === catalogKey(catalog),
  );
  if (!published) return catalog;

  const publishedSlugs = new Map(published.presets.map(({ id, fileSlug }) => [id, fileSlug]));
  const usedNames = new Set(catalog.presets.map((preset) => presetFileName(catalog, preset)));
  const presets = catalog.presets.map((preset) => {
    const fileSlug = publishedSlugs.get(preset.id);
    if (preset.fileSlug || !fileSlug) return preset;

    const next = { ...preset, fileSlug };
    const name = presetFileName(catalog, next);
    const oldName = presetFileName(catalog, preset);
    if (usedNames.has(name) && name !== oldName) return preset;
    usedNames.delete(oldName);
    usedNames.add(name);
    return next;
  });
  return { ...catalog, presets };
}
