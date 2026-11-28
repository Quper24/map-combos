import { combinedPresetPairs, presetFileName, presetTags } from './presetCombos.js';

export const entryTypeLabels = {
  map: 'Карта',
  mod: 'Мод',
  fix: 'Фикс',
  connector: 'Коннектор',
  resource: 'Пакет ресурсов',
  server: 'Серверный мод (только серверные сборки)',
};

export const canAutoWithMaps = (type) => type === 'mod' || type === 'fix';
export const isFixOrConnector = (type) => type === 'fix' || type === 'connector';
export const isSelectable = (entry) =>
  !entry.autoWithMaps && (entry.type === 'map' || entry.type === 'mod');

export function ensureShareIndexes(catalog) {
  const entries = catalog?.entries;
  if (!Array.isArray(entries)) return catalog;
  const used = new Set(entries.map(({ shareIndex }) => shareIndex).filter(Number.isSafeInteger));
  let next = Math.max(-1, ...used) + 1;
  return {
    ...catalog,
    entries: entries.map((entry) => {
      if (Number.isSafeInteger(entry.shareIndex) && entry.shareIndex >= 0) return entry;
      while (used.has(next)) next++;
      const indexed = { ...entry, shareIndex: next };
      used.add(next++);
      return indexed;
    }),
  };
}

export function entriesByLoadOrder(catalog) {
  const positions = new Map(catalog.order.map(({ key }, index) => [key, index]));
  return catalog.entries
    .map((entry) => ({
      entry,
      priority: Math.max(-1, ...entry.files.map((key) => positions.get(key) ?? -1)),
    }))
    .sort((a, b) => b.priority - a.priority)
    .map(({ entry }) => entry);
}

export function reconcilePresetSelections(presets, entry) {
  if (isSelectable(entry)) return presets;
  return presets.map((preset) =>
    preset.selection.includes(entry.id) && !preset.tags?.includes('server')
      ? { ...preset, selection: preset.selection.filter((id) => id !== entry.id) }
      : preset,
  );
}

export function resolveCombo(catalog, selection, { server = false } = {}) {
  const entries = new Map(catalog.entries.map((entry) => [entry.id, entry]));
  const active = new Set();
  const reasons = new Map();
  const manual = new Set();
  function include(id, because = []) {
    const entry = entries.get(id);
    if (!entry || active.has(id)) return;
    active.add(id);
    reasons.set(id, because);
    if (!server) {
      for (const dependency of entry.requires || []) include(dependency, [id]);
    }
  }
  for (const id of selection || []) {
    const entry = entries.get(id);
    const canSelect = Boolean(entry) && (server || isSelectable(entry));
    if (!canSelect) continue;
    manual.add(id);
    include(id);
  }
  if (!server && [...active].some((id) => entries.get(id).type === 'map')) {
    for (const entry of entries.values()) {
      if (entry.autoWithMaps) include(entry.id);
    }
  }
  let previousSize;
  do {
    previousSize = active.size;
    if (server) break;
    for (const entry of entries.values()) {
      if (!isFixOrConnector(entry.type)) continue;
      const required = entry.requires || [];
      const alternatives = entry.requiresAny || [];
      if (!required.length && !alternatives.length) continue;
      if (!required.every((id) => active.has(id))) continue;
      const matched = alternatives.filter((id) => active.has(id));
      if (!alternatives.length || matched.length) include(entry.id, [...required, ...matched]);
    }
  } while (active.size !== previousSize);

  const disabled = new Set(
    server ? [] : [...active].flatMap((id) => entries.get(id).replaces || []),
  );
  if (!server) {
    for (const id of active) {
      if (entries.get(id).disabledByMaps?.some((map) => active.has(map))) disabled.add(id);
    }
  }
  if (disabled.size) {
    for (const id of disabled) active.delete(id);
    do {
      previousSize = active.size;
      for (const id of active) {
        const { requires = [], requiresAny = [] } = entries.get(id);
        const missingRequired = requires.some((dependency) => !active.has(dependency));
        const missingAlternative =
          requiresAny.length && !requiresAny.some((dependency) => active.has(dependency));
        if (missingRequired || missingAlternative) active.delete(id);
      }
    } while (active.size !== previousSize);
    for (const id of reasons.keys()) {
      if (!active.has(id)) {
        reasons.delete(id);
        manual.delete(id);
      }
    }
  }

  const conflicts = server
    ? []
    : catalog.conflicts.filter(({ entries: pair }) => pair.every((id) => active.has(id)));
  const families = new Map();
  const owners = new Map();
  const dlcs = new Set();
  for (const id of active) {
    const entry = entries.get(id);
    if (!server && entry.family) {
      const other = families.get(entry.family);
      if (
        other &&
        !conflicts.some(({ entries: pair }) => pair.includes(other) && pair.includes(id))
      ) {
        conflicts.push({ entries: [other, id] });
      }
      families.set(entry.family, id);
    }
    for (const key of entry.files) owners.set(key, entry);
    for (const dlc of entry.dlcs || []) dlcs.add(dlc);
  }
  const files = catalog.order
    .filter(({ key }) => owners.has(key))
    .map((file) => ({
      ...file,
      entry: owners.get(file.key),
    }));
  return { files, active, manual, reasons, conflicts, dlcs: [...dlcs] };
}

export function addToCombo(catalog, selection, id) {
  const entry = catalog.entries.find((item) => item.id === id);
  if (!entry || (!isSelectable(entry) && entry.type !== 'server'))
    return { selection, conflicts: [] };
  const alternatives = entry.family
    ? catalog.entries
        .filter((item) => item.family === entry.family && item.id !== id)
        .map((item) => item.id)
    : [];
  const remaining = alternatives.length
    ? removeFromCombo(catalog, selection, alternatives).selection
    : selection;
  const next = [...remaining.filter((selected) => selected !== id), id];
  const { conflicts } = resolveCombo(catalog, next);
  return { selection: conflicts.length ? selection : next, conflicts };
}

export function removePaidEntries(catalog, selection, active) {
  const paid = catalog.entries.filter((entry) => entry.paid && active.has(entry.id));
  if (!paid.length) return selection;

  const ids = paid.map(({ id }) => id);
  let next = removeFromCombo(catalog, selection, ids, active).selection;
  for (const { freeReplacement } of paid) {
    if (!freeReplacement) continue;
    const candidate = addToCombo(catalog, next, freeReplacement);
    if (candidate.conflicts.length) continue;
    const resolved = resolveCombo(catalog, candidate.selection);
    if (!resolved.files.some(({ entry }) => entry.paid)) next = candidate.selection;
  }
  return next;
}

export function removeFromCombo(
  catalog,
  selection,
  ids,
  active = resolveCombo(catalog, selection).active,
) {
  const dependents = new Map();
  for (const entry of catalog.entries) {
    for (const dependency of entry.requires || []) {
      const list = dependents.get(dependency) || [];
      list.push(entry.id);
      dependents.set(dependency, list);
    }
  }
  const removed = new Set(Array.isArray(ids) ? ids : [ids]);
  const affected = new Set(removed);
  for (const dependency of affected) {
    for (const dependent of dependents.get(dependency) || []) affected.add(dependent);
  }
  const next = selection.filter((selected) => !affected.has(selected));
  const remaining = resolveCombo(catalog, next).active;
  const alsoDisabled = catalog.entries
    .filter(
      (entry) =>
        !removed.has(entry.id) &&
        isSelectable(entry) &&
        active.has(entry.id) &&
        !remaining.has(entry.id),
    )
    .map((entry) => entry.id);
  return { selection: next, alsoDisabled };
}

// Stored in active_mods index order. The manager shows the highest priority first.
export function serializeModOrder(files) {
  const encoder = new TextEncoder();
  function escape(value) {
    return Array.from(encoder.encode(value), (byte) =>
      byte < 32 || byte > 126 || byte === 34 || byte === 92
        ? '\\x' + byte.toString(16).padStart(2, '0')
        : String.fromCharCode(byte),
    ).join('');
  }
  return [
    ` active_mods: ${files.length}`,
    ...files.map(
      ({ key, name }, index) => ` active_mods[${index}]: "${escape(key)}|${escape(name)}"`,
    ),
  ].join('\n');
}

export function parseModOrder(source) {
  const content = source.replace(/^\uFEFF/, '');
  const headers = [...content.matchAll(/^[ \t]*active_mods:[ \t]*(\d+)[ \t]*\r?$/gm)];
  const rows = [
    ...content.matchAll(
      /^[ \t]*active_mods\[(\d+)\]:[ \t]*"((?:[^"\\\r\n]|\\(?:x[\da-fA-F]{2}|["\\]))*)"[ \t]*\r?$/gm,
    ),
  ];
  const markers = [...content.matchAll(/^[ \t]*active_mods\[/gm)];
  const fail = () => {
    throw new Error('Invalid active_mods block');
  };
  if (
    headers.length !== 1 ||
    Number(headers[0][1]) !== rows.length ||
    markers.length !== rows.length
  )
    fail();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const decode = (value) =>
    value.replace(/(?:\\x[\da-fA-F]{2})+|\\["\\]/g, (encoded) =>
      encoded[1] === 'x'
        ? decoder.decode(
            Uint8Array.from(encoded.match(/\\x([\da-fA-F]{2})/g), (byte) =>
              Number.parseInt(byte.slice(2), 16),
            ),
          )
        : encoded[1],
    );
  const seen = new Set();
  return rows.map((row, index) => {
    const separator = row[2].indexOf('|');
    if (Number(row[1]) !== index || separator < 1) fail();
    const key = decode(row[2].slice(0, separator));
    const name = decode(row[2].slice(separator + 1));
    if (!validFileKey(key) || !name.trim() || seen.has(key)) fail();
    seen.add(key);
    return { key, name };
  });
}

export function parseGameLogVersions(source, versions = new Map()) {
  for (const [, key, version] of source.matchAll(
    /\[mod_package_manager\] Mod "[^\r\n]*" has been mount(?:ed)?\. \(package_name: (.+?), version: ([^\r\n]*?), source: [^\r\n]+\)\s*$/gm,
  )) {
    const value = version.trim();
    if (!value || /^(?:unknown|none|n\/a|<[^>]+>|-)$/i.test(value)) continue;
    const previous = versions.get(key.trim());
    versions.set(key.trim(), previous === undefined || previous === value ? value : null);
  }
  return versions;
}

export async function readGameLogVersions(file) {
  const versions = new Map();
  let remainder = '';
  for await (const chunk of file.stream().pipeThrough(new TextDecoderStream())) {
    const text = remainder + chunk;
    const endOfLine = text.lastIndexOf('\n') + 1;
    parseGameLogVersions(text.slice(0, endOfLine), versions);
    remainder = text.slice(endOfLine);
  }
  return parseGameLogVersions(remainder, versions);
}

export function suggestModVersion(files) {
  const logged = new Set(files.map(({ logVersion }) => logVersion).filter(Boolean));
  if (logged.size) return logged.size === 1 ? logged.values().next().value : undefined;
  const versions = new Set();
  for (const { key, name } of files) {
    const fileVersions = new Set();
    for (const value of [key, name]) {
      for (const [, version] of value.matchAll(
        /(?:^|[\s_.([-])(?:version|ver\.?|v)[\s_-]*(\d+(?:\.\d+)*[a-z]?)(?=$|[\s_.)\]-])/gi,
      )) {
        fileVersions.add(version);
      }
    }
    if (!fileVersions.size) {
      const version = name
        .trim()
        .match(/\s(\d+(?:\.\d+)+[a-z]?)(?:\s+(?:public|def|map|models?|assets))?$/i)?.[1];
      if (version && !/\b(?:ATS|ETS2)\s+\d+(?:\.\d+)+[a-z]?$/i.test(name.trim())) {
        fileVersions.add(version);
      }
    }
    for (const version of fileVersions) versions.add(version);
  }
  return versions.size === 1 ? versions.values().next().value : undefined;
}

export function compareSharedOrder(saved, imported) {
  const savedKeys = new Set(saved.map(({ key }) => key));
  const importedPositions = new Map(
    imported
      .filter(({ key }) => savedKeys.has(key))
      .reverse()
      .map(({ key }, index) => [key, index + 1]),
  );
  const shared = saved
    .filter(({ key }) => importedPositions.has(key))
    .reverse()
    .map(({ key, name }, index) => ({
      key,
      name,
      catalogPosition: index + 1,
      profilePosition: importedPositions.get(key),
    }));

  // Include every participant in an inversion, even if its displayed rank stayed the same.
  const changed = new Set();
  let highest = 0;
  for (const row of shared) {
    if (row.profilePosition < highest) changed.add(row.key);
    highest = Math.max(highest, row.profilePosition);
  }
  let lowest = Infinity;
  for (const row of [...shared].reverse()) {
    if (row.profilePosition > lowest) changed.add(row.key);
    lowest = Math.min(lowest, row.profilePosition);
  }
  return shared.filter(({ key }) => changed.has(key));
}

export function mergeModOrders(saved, imported, preferImported = false) {
  const primary = preferImported ? imported : saved;
  const secondary = preferImported ? saved : imported;
  const primaryKeys = new Set(primary.map(({ key }) => key));
  const secondaryKeys = new Set(secondary.map(({ key }) => key));
  const shared = primary.filter(({ key }) => secondaryKeys.has(key)).map(({ key }) => key);
  const orderConflict = secondary
    .filter(({ key }) => primaryKeys.has(key))
    .some(({ key }, index) => key !== shared[index]);
  const before = new Map();
  let pending = [];
  for (const file of secondary) {
    if (primaryKeys.has(file.key)) {
      before.set(file.key, pending);
      pending = [];
    } else pending.push(file);
  }
  const savedByKey = new Map(saved.map((file) => [file.key, file]));
  const order = [
    ...primary.flatMap((file) => [...(before.get(file.key) || []), file]),
    ...pending,
  ].map((file) => savedByKey.get(file.key) || file);
  return { order, orderConflict };
}

export function moveMod(order, key, anchor, above) {
  if (key === anchor) return order;
  const file = order.find((item) => item.key === key);
  const next = order.filter((item) => item.key !== key);
  const index = next.findIndex((item) => item.key === anchor);
  if (!file || index < 0) return order;
  next.splice(index + Number(above), 0, file);
  return next;
}

export function replaceEntryFiles(order, files, replacements) {
  const incoming = new Set(replacements.values());
  if (incoming.size !== replacements.size) {
    throw new Error('Для каждого заменяемого файла выбери отдельный новый файл.');
  }
  const byKey = new Map(order.map((file) => [file.key, file]));
  const nextOrder = order
    .filter(({ key }) => !incoming.has(key))
    .map((file) => {
      const replacement = byKey.get(replacements.get(file.key));
      return replacement
        ? {
            ...replacement,
            image: replacement.image ?? file.image,
            link: replacement.link ?? file.link,
          }
        : file;
    });
  const nextFiles = new Set(files.map((key) => replacements.get(key) || key));
  for (const key of incoming) nextFiles.add(key);
  return { order: nextOrder, files: [...nextFiles] };
}

const moscowDay = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Moscow',
  dateStyle: 'short',
});
export const catalogDate = (now = new Date()) => moscowDay.format(now);

export function entryBadge({ addedAt, updatedAt }, today = catalogDate()) {
  const isRecent = (value) => {
    const age = (Date.parse(today) - Date.parse(value)) / 86400000;
    return age >= 0 && age < 3;
  };
  if ((!addedAt || updatedAt > addedAt) && isRecent(updatedAt)) return 'UPDATE';
  if (isRecent(addedAt)) return 'NEW';
  return '';
}

const validDate = (value) =>
  typeof value === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString().startsWith(value);
const idPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const text = (value) => typeof value === 'string' && Boolean(value.trim());
const validFileKey = (value) =>
  text(value) &&
  [...value].every((character) => character !== '|' && character.charCodeAt(0) >= 32);
const uniqueList = (values, predicate) =>
  Array.isArray(values) && values.every(predicate) && new Set(values).size === values.length;
const known = (value, keys) => typeof value === 'string' && keys.has(value);
const isDownloadLink = (value) => {
  if (!text(value)) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};
const validImage = (value) =>
  value === undefined ||
  (text(value) &&
    /^\/img\/(?:[\w.-]+\/)*[\w.-]+\.(?:avif|gif|jpe?g|png|webp)$/i.test(value) &&
    !value.split('/').includes('..'));

// Drafts may have unassigned imports and incomplete metadata. Publication runs the strict check below.
export function validateCatalog(catalog, draft = false, { linkPresets = catalog?.presets } = {}) {
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const { game, version, entries, order, conflicts, presets } = catalog ?? {};
  check(
    ['ets2', 'ats'].includes(game) && typeof version === 'string' && /^1\.\d+$/.test(version),
    'Invalid game or version',
  );
  check(Number(version.split('.')[1]) >= 62, 'Catalogs start at 1.62');
  check([entries, order, conflicts, presets].every(Array.isArray), 'Missing catalog lists');
  check(
    uniqueList(
      order.map((file) => file?.key),
      validFileKey,
    ),
    'Invalid or duplicate profile key',
  );
  check(
    uniqueList(
      entries.map((entry) => entry?.id),
      (id) => typeof id === 'string' && idPattern.test(id),
    ),
    'Invalid or duplicate entry ID',
  );
  check(
    uniqueList(
      entries.map((entry) => entry?.shareIndex),
      (index) => Number.isSafeInteger(index) && index >= 0,
    ),
    'Invalid or duplicate share index',
  );
  const keys = new Set(order.map(({ key }) => key));
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const orderByKey = new Map(order.map((file) => [file.key, file]));
  const serverRequiredIds = new Set();
  const independentlyLinkedIds = new Set();
  for (const preset of linkPresets || []) {
    if (!Array.isArray(preset?.selection)) continue;
    const optional = new Set(
      Array.isArray(preset.optionalSelection) ? preset.optionalSelection : [],
    );
    const target = preset.tags?.includes('server') ? serverRequiredIds : independentlyLinkedIds;
    for (const id of preset.selection) {
      if (!optional.has(id) || !preset.tags?.includes('server')) target.add(id);
      if (preset.tags?.includes('server') && optional.has(id)) independentlyLinkedIds.add(id);
    }
  }
  const requiredOnlyServerIds = new Set(
    [...serverRequiredIds].filter((id) => !independentlyLinkedIds.has(id)),
  );
  const owners = new Set();
  const familyVariants = new Set();
  for (const file of order) {
    check(
      text(file.name) &&
        (file.filename === undefined || text(file.filename)) &&
        validImage(file.image),
      `Invalid file metadata: ${file.key}`,
    );
    check(file.link === undefined || isDownloadLink(file.link), `Invalid file link: ${file.key}`);
  }
  for (const entry of entries) {
    const {
      id,
      title,
      type,
      files,
      requires = [],
      requiresAny = [],
      replaces = [],
      disabledByMaps = [],
      dlcs = [],
      family,
      variant,
      paid,
      freeReplacement,
      autoWithMaps,
      link,
      image,
      description,
      version: modVersion,
      addedAt,
      updatedAt,
    } = entry;
    check(text(title) && Object.hasOwn(entryTypeLabels, type), `Invalid entry: ${id}`);
    check(
      isDownloadLink(link) ||
        (link === undefined && (draft || type === 'server' || requiredOnlyServerIds.has(id))),
      `Invalid entry link: ${id}`,
    );
    check(validImage(image), `Invalid entry image: ${id}`);
    check(paid === undefined || typeof paid === 'boolean', `Invalid paid label: ${id}`);
    if (freeReplacement !== undefined) {
      const replacement = byId.get(freeReplacement);
      check(
        paid &&
          type === 'map' &&
          family &&
          replacement?.type === 'map' &&
          !replacement.paid &&
          replacement.family === family,
        `Invalid free replacement: ${id}`,
      );
    }
    check(
      (autoWithMaps === undefined || typeof autoWithMaps === 'boolean') &&
        (!autoWithMaps || canAutoWithMaps(type)),
      `Invalid automatic map rule: ${id}`,
    );
    check(
      (description === undefined || text(description)) &&
        (modVersion === undefined || text(modVersion)),
      `Invalid description or mod version: ${id}`,
    );
    check(
      (addedAt === undefined || validDate(addedAt)) &&
        (updatedAt === undefined || (validDate(updatedAt) && (!addedAt || updatedAt >= addedAt))),
      `Invalid entry dates: ${id}`,
    );
    check(
      uniqueList(files, (key) => known(key, keys) && !owners.has(key)) && (draft || files.length),
      `Invalid or shared files: ${id}`,
    );
    files.forEach((key) => owners.add(key));
    check(
      uniqueList(requires, (dep) => dep !== id && known(dep, byId)) &&
        (!autoWithMaps || !requires.length),
      `Invalid dependencies: ${id}`,
    );
    check(
      uniqueList(requiresAny, (dep) => dep !== id && known(dep, byId) && !requires.includes(dep)) &&
        (!requiresAny.length || (isFixOrConnector(type) && !autoWithMaps)),
      `Проверь список альтернативных зависимостей. Запись — ${id}`,
    );
    check(
      uniqueList(
        replaces,
        (dep) =>
          dep !== id &&
          isFixOrConnector(byId.get(dep)?.type) &&
          !requires.includes(dep) &&
          !requiresAny.includes(dep),
      ) &&
        (!replaces.length || isFixOrConnector(type)),
      `Проверь список заменяемых фиксов. Запись — ${id}`,
    );
    check(
      draft || !isFixOrConnector(type) || autoWithMaps || requires.length || requiresAny.length,
      `Для фикса или коннектора укажи, какие записи должны быть выбраны. Запись — ${id}`,
    );
    check(
      uniqueList(
        disabledByMaps,
        (dep) =>
          dep !== id &&
          byId.get(dep)?.type === 'map' &&
          !requires.includes(dep) &&
          !requiresAny.includes(dep),
      ),
      `Проверь список карт, отключающих позицию. Запись — ${id}`,
    );
    check(uniqueList(dlcs, text), `Invalid DLC list: ${id}`);
    if (family !== undefined || variant !== undefined) {
      const variantKey = JSON.stringify([family, variant]);
      check(
        type === 'map' && text(family) && text(variant) && !familyVariants.has(variantKey),
        `Invalid map variant: ${id}`,
      );
      familyVariants.add(variantKey);
    }
  }
  check(
    draft || (entries.length && owners.size === keys.size),
    'Catalog contains unassigned files or no entries',
  );
  const visited = new Set();
  const visiting = new Set();
  function visit(id) {
    if (visiting.has(id)) {
      const path = [...visiting];
      const cycle = [...path.slice(path.indexOf(id)), id].join(' → ');
      throw new Error(`Циклическая зависимость — ${cycle}`);
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const { requires = [], requiresAny = [], replaces = [], disabledByMaps = [] } = byId.get(id);
    for (const dependency of [...requires, ...requiresAny, ...replaces, ...disabledByMaps]) {
      visit(dependency);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  const pairs = new Set();
  for (const rule of conflicts) {
    check(
      rule && uniqueList(rule.entries, (id) => known(id, byId)) && rule.entries.length === 2,
      'Invalid conflict pair',
    );
    const pair = [...rule.entries].sort().join('/');
    check(
      !pairs.has(pair) && ((draft && rule.reason === undefined) || text(rule.reason)),
      `Invalid or duplicate conflict: ${pair}`,
    );
    pairs.add(pair);
  }
  check(
    uniqueList(
      presets.map((preset) => preset?.id),
      (id) => typeof id === 'string' && idPattern.test(id),
    ),
    'Invalid or duplicate preset ID',
  );
  const presetFileNames = new Set();
  for (const preset of presets) {
    const isServer = preset.tags?.includes('server');
    const optionalSelection = preset.optionalSelection || [];
    check(
      text(preset.title) &&
        uniqueList(
          preset.selection,
          (id) => known(id, byId) && (isServer || isSelectable(byId.get(id))),
        ) &&
        (draft || preset.selection.length),
      `Invalid preset: ${preset.id}`,
    );
    check(
      uniqueList(
        optionalSelection,
        (id) => known(id, byId) && (isServer || ['mod', 'server'].includes(byId.get(id).type)),
      ) &&
        optionalSelection.every((id) => preset.selection.includes(id)) &&
        (isServer || optionalSelection.length === 0) &&
        (!isServer || draft || preset.selection.some((id) => !optionalSelection.includes(id))),
      `Invalid optional server mods: ${preset.id}`,
    );
    const optionalWithoutLinks = optionalSelection.filter((id) => {
      const entry = byId.get(id);
      if (isDownloadLink(entry?.link)) return false;
      return (
        !entry?.files?.length ||
        !entry.files.every((key) => isDownloadLink(orderByKey.get(key)?.link))
      );
    });
    check(
      draft || !optionalWithoutLinks.length,
      `Укажи отдельные ссылки для опциональных модов — ${preset.id}: ${optionalWithoutLinks.join(', ')}`,
    );
    check(
      (draft && preset.boosty === undefined) ||
        (isDownloadLink(preset.boosty) && new URL(preset.boosty).hostname === 'boosty.to'),
      `Invalid Boosty link: ${preset.id}`,
    );
    check(
      isServer
        ? draft || Boolean(preset.profile || preset.boosty || preset.cloud || preset.company)
        : (draft && preset.profile === undefined) || isDownloadLink(preset.profile),
      `Укажи HTTPS-ссылку на готовый профиль. Сборка — ${preset.id}`,
    );
    for (const field of ['cloud', 'company'])
      check(
        preset[field] === undefined || isDownloadLink(preset[field]),
        `Invalid ${field} link: ${preset.id}`,
      );
    check(
      preset.video === undefined || isDownloadLink(preset.video),
      `Укажи HTTPS-ссылку на видеообзор. Сборка — ${preset.id}`,
    );
    check(
      (preset.hiddenFromCatalog === undefined || typeof preset.hiddenFromCatalog === 'boolean') &&
        uniqueList(preset.tags === undefined ? [] : preset.tags, (tag) =>
          presetTags.includes(tag),
        ) &&
        validImage(preset.image) &&
        (preset.updatedAt === undefined || validDate(preset.updatedAt)),
      `Invalid preset metadata: ${preset.id}`,
    );
    check(
      preset.fileSlug === undefined ||
        (typeof preset.fileSlug === 'string' && idPattern.test(preset.fileSlug)),
      `Проверь имя файла сборки — ${preset.id}`,
    );
    check(
      preset.version === undefined || text(preset.version),
      `Invalid combo version: ${preset.id}`,
    );
    if (preset.releases !== undefined) {
      const { releases } = preset;
      check(
        Array.isArray(releases) &&
          uniqueList(
            releases.map((release) => release?.version),
            text,
          ) &&
          releases.every(
            ({ date, entries }, index) =>
              validDate(date) &&
              (index === 0 || date >= releases[index - 1].date) &&
              Array.isArray(entries) &&
              uniqueList(
                entries.map((entry) => entry?.id),
                (id) => text(id) && idPattern.test(id),
              ) &&
              entries.every(
                ({ title, version }) => text(title) && (version === undefined || text(version)),
              ),
          ),
        `Invalid release history: ${preset.id}`,
      );
      check(
        draft || !releases.length || releases.at(-1).version === preset.version,
        `Версия сборки должна совпадать с последним выпуском — ${preset.id}`,
      );
    }
    const fileName = presetFileName(catalog, preset);
    check(!presetFileNames.has(fileName), `Имя файла сборки уже используется — ${fileName}`);
    presetFileNames.add(fileName);
    check(
      draft || !resolveCombo(catalog, preset.selection, { server: isServer }).conflicts.length,
      `Conflicting preset: ${preset.id}`,
    );
  }
  const publishedSlugs = new Set(
    presets.map((preset) => `${game}-${preset.fileSlug || preset.id}-${version.replace('.', '')}`),
  );
  const combinedSlugs = new Set();
  for (const { preset } of combinedPresetPairs(catalog)) {
    if (resolveCombo(catalog, preset.selection).conflicts.length) continue;
    check(
      !publishedSlugs.has(preset.slug) && !combinedSlugs.has(preset.slug),
      `Короткая ссылка сборки карт и модов уже используется — ${preset.slug}`,
    );
    combinedSlugs.add(preset.slug);
  }
  return catalog;
}
