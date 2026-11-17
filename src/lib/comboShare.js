import { isSelectable } from './comboBuilder.js';
import { catalogKey } from './presetCombos.js';

export const comboBuilderPath = '/combos/builder';

const encodeBase64Url = (bytes) => {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const decodeBase64Url = (value) => {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  if (!value) return new Uint8Array();
  const base64 =
    value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  try {
    return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
};

function encodeIndexes(indexes) {
  const bytes = [];
  let previous = 0;
  for (const index of indexes) {
    let delta = index - previous;
    previous = index;
    while (delta >= 0x80) {
      bytes.push((delta & 0x7f) | 0x80);
      delta >>>= 7;
    }
    bytes.push(delta);
  }
  return encodeBase64Url(bytes);
}

function decodeIndexes(value) {
  const bytes = decodeBase64Url(value);
  if (!bytes) return null;
  const indexes = [];
  let previous = 0;
  let delta = 0;
  let shift = 0;
  for (const byte of bytes) {
    delta |= (byte & 0x7f) << shift;
    if (byte & 0x80) {
      shift += 7;
      if (shift > 28) return null;
      continue;
    }
    previous += delta;
    indexes.push(previous);
    delta = 0;
    shift = 0;
  }
  return shift === 0 ? indexes : null;
}

export function comboSharePath(catalog, selection) {
  const query = new URLSearchParams({ release: catalogKey(catalog) });
  const entries = new Map(catalog.entries.map(({ id, shareIndex }) => [id, shareIndex]));
  const indexes = [...new Set(selection.map((id) => entries.get(id)))].sort((a, b) => a - b);
  if (indexes.some((index) => !Number.isSafeInteger(index) || index < 0)) {
    const mods = selection.map(encodeURIComponent).join(',');
    return `${comboBuilderPath}?${query}#mods=${mods}`;
  }
  return `${comboBuilderPath}?${query}#s1=${encodeIndexes(indexes)}`;
}

export function readSharedSelection(hash, catalog) {
  const params = new URLSearchParams(hash.slice(1));
  const code = params.get('s1');
  if (code !== null) {
    const indexes = decodeIndexes(code);
    if (!indexes) return ['invalid-share-code'];
    if (!catalog) return indexes.length ? ['catalog-unavailable'] : [];
    const entries = new Map(catalog.entries.map(({ id, shareIndex }) => [shareIndex, id]));
    return [
      ...new Set(indexes.map((index) => entries.get(index) || `unknown-share-index-${index}`)),
    ];
  }
  const mods = params.get('mods');
  return mods === null ? null : [...new Set(mods.split(',').filter(Boolean))];
}

export function restoreSharedSelection(catalog, ids) {
  const selectable = new Set(catalog.entries.filter(isSelectable).map(({ id }) => id));
  const selection = ids.filter((id) => selectable.has(id));
  return { selection, missing: ids.length - selection.length };
}
