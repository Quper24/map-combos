import { isSelectable } from './comboBuilder.js';
import { catalogKey } from './presetCombos.js';

export const comboBuilderPath = '/combos/builder';

export function comboSharePath(catalog, selection) {
  const query = new URLSearchParams({ release: catalogKey(catalog) });
  const mods = selection.map(encodeURIComponent).join(',');
  return `${comboBuilderPath}?${query}#mods=${mods}`;
}

export function readSharedSelection(hash) {
  const mods = new URLSearchParams(hash.slice(1)).get('mods');
  return mods === null ? null : [...new Set(mods.split(',').filter(Boolean))];
}

export function restoreSharedSelection(catalog, ids) {
  const selectable = new Set(catalog.entries.filter(isSelectable).map(({ id }) => id));
  const selection = ids.filter((id) => selectable.has(id));
  return { selection, missing: ids.length - selection.length };
}
