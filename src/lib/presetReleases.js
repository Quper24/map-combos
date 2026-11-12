import { catalogDate, resolveCombo } from './comboBuilder.js';

export function snapshotPresetEntries(catalog, selection) {
  const { active } = resolveCombo(catalog, selection);
  return catalog.entries
    .filter(({ id }) => active.has(id))
    .map(({ id, title, version }) => ({ id, title, ...(version && { version }) }));
}

export function diffPresetEntries(previous, current) {
  const before = new Map(previous.map((entry) => [entry.id, entry]));
  const after = new Map(current.map((entry) => [entry.id, entry]));
  const added = current.filter(({ id }) => !before.has(id));
  const removed = previous.filter(({ id }) => !after.has(id));
  const versionChanges = current
    .filter(({ id, version }) => before.has(id) && before.get(id).version !== version)
    .map((entry) => ({ entry, previousVersion: before.get(entry.id).version }));
  return { added, removed, versionChanges };
}

export function preparePresetRelease(catalog, preset, date = catalogDate()) {
  const releases = preset.releases ?? [];
  if (!preset.version) return { preset, needsVersion: false };

  const entries = snapshotPresetEntries(catalog, preset.selection);
  const latest = releases.at(-1);
  if (latest?.version === preset.version) {
    const { added, removed, versionChanges } = diffPresetEntries(latest.entries, entries);
    return {
      preset,
      needsVersion: Boolean(added.length || removed.length || versionChanges.length),
    };
  }
  if (releases.some(({ version }) => version === preset.version)) {
    throw new Error('Эта версия уже есть в истории. Укажи новый номер версии сборки.');
  }
  return {
    preset: { ...preset, releases: [...releases, { version: preset.version, date, entries }] },
    needsVersion: false,
  };
}
