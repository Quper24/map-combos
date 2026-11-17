import site from '../../content/site.json';
import {
  attachPresetFiles,
  catalogKey,
  combinedPresetPairs,
  presetCombo,
} from '../lib/presetCombos.js';
import { readBuilderDrafts } from '../lib/builderDraft.js';
import { resolveCombo } from '../lib/comboBuilder.js';

const newestFirst = (left, right) => Number(right.split('.')[1]) - Number(left.split('.')[1]);

export const builderCatalogs = attachPresetFiles(
  Object.values(
    import.meta.glob('../../content/combo-builder/*.json', { eager: true, import: 'default' }),
  ),
  Object.values(
    import.meta.glob('../../content/combo-builder/presets/*.json', {
      eager: true,
      import: 'default',
    }),
  ),
).sort((a, b) => newestFirst(a.version, b.version) || b.game.localeCompare(a.game));

export const presetCombosByVersion = {};
export const combinedPresetCombos = [];
for (const catalog of builderCatalogs) {
  for (const preset of catalog.presets) {
    (presetCombosByVersion[catalog.version] ??= []).push(presetCombo(catalog, preset));
  }
  for (const { preset } of combinedPresetPairs(catalog)) {
    if (!resolveCombo(catalog, preset.selection).conflicts.length)
      combinedPresetCombos.push(presetCombo(catalog, preset));
  }
}

export function findPublishedCombo(slug) {
  return (
    Object.values(presetCombosByVersion)
      .flat()
      .find((combo) => combo.slug === slug) ||
    combinedPresetCombos.find((combo) => combo.slug === slug)
  );
}

export const currentComboVersion = [
  site.currentGameVersion,
  ...Object.keys(presetCombosByVersion),
].sort(newestFirst)[0];

export function editorDraftCombos() {
  if (!(import.meta.env.DEV && import.meta.env.MODE === 'editor')) return [];
  return readBuilderDrafts().catalogs.flatMap((catalog) => {
    const exported = builderCatalogs.find((release) => catalogKey(release) === catalogKey(catalog));
    const exportedIds = new Set(exported?.presets.map(({ id }) => id));
    return catalog.presets
      .filter(({ id }) => !exportedIds.has(id))
      .map((preset) => ({ ...presetCombo(catalog, preset), draft: true }));
  });
}
