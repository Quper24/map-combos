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

export function restorePublishedPresetMetadata(catalog, publishedCatalogs) {
  const published = publishedCatalogs.find(
    (release) => catalogKey(release) === catalogKey(catalog),
  );
  if (!published) return catalog;

  const publishedById = new Map(published.presets.map((preset) => [preset.id, preset]));
  const usedNames = new Set(catalog.presets.map((preset) => presetFileName(catalog, preset)));
  const presets = catalog.presets.map((preset) => {
    const { fileSlug, releases } = publishedById.get(preset.id) ?? {};
    if (releases?.length) {
      const latest = releases.at(-1);
      const publishedVersions = new Set(releases.map(({ version }) => version));
      const draftIndex =
        preset.releases?.findIndex(({ version }) => version === latest.version) ?? -1;
      const newer = draftIndex < 0 ? [] : preset.releases.slice(draftIndex + 1);
      preset = {
        ...preset,
        releases: [
          ...releases,
          ...newer.filter(
            ({ version, date }) => !publishedVersions.has(version) && date >= latest.date,
          ),
        ],
      };
    }
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
