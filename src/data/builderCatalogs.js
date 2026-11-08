import site from '../../content/site.json';
import { attachPresetFiles, presetCombo } from '../lib/presetCombos.js';
import { readBuilderDraft } from '../lib/builderDraft.js';

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
for (const catalog of builderCatalogs) {
  for (const preset of catalog.presets) {
    (presetCombosByVersion[catalog.version] ??= []).push(presetCombo(catalog, preset));
  }
}

export const currentComboVersion = [
  site.currentGameVersion,
  ...Object.keys(presetCombosByVersion),
].sort(newestFirst)[0];

export function editorDraftCombos() {
  if (!(import.meta.env.DEV && import.meta.env.MODE === 'editor')) return [];
  const catalog = readBuilderDraft();
  return catalog
    ? catalog.presets.map((preset) => ({ ...presetCombo(catalog, preset), draft: true }))
    : [];
}
