export const entryTypeLabels = {
  map: 'Карта',
  mod: 'Мод',
  fix: 'Фикс',
  connector: 'Коннектор',
};

export const isSelectable = (entry) => entry.type === 'map' || entry.type === 'mod';

export function resolveCombo(catalog, selection) {
  const entries = new Map(catalog.entries.map((entry) => [entry.id, entry]));
  const active = new Set();
  const reasons = new Map();
  const manual = new Set(selection);
  function include(id, because = []) {
    const entry = entries.get(id);
    if (!entry || active.has(id)) return;
    active.add(id);
    reasons.set(id, because);
    for (const dependency of entry.requires || []) include(dependency, [id]);
  }
  for (const id of manual) {
    if (entries.has(id) && isSelectable(entries.get(id))) include(id);
  }
  let previousSize;
  do {
    previousSize = active.size;
    for (const entry of entries.values()) {
      if (
        !isSelectable(entry) &&
        entry.requires?.length &&
        entry.requires.every((id) => active.has(id))
      ) {
        include(entry.id, entry.requires);
      }
    }
  } while (active.size !== previousSize);

  const conflicts = catalog.conflicts.filter(({ entries: pair }) =>
    pair.every((id) => active.has(id)),
  );
  const families = new Map();
  const owners = new Map();
  const dlcs = new Set();
  for (const id of active) {
    const entry = entries.get(id);
    if (entry.family) {
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
  const alternatives = new Set(
    entry.family
      ? catalog.entries.filter((item) => item.family === entry.family).map((item) => item.id)
      : [],
  );
  const next = [
    ...selection.filter((selected) => selected !== id && !alternatives.has(selected)),
    id,
  ];
  const { conflicts } = resolveCombo(catalog, next);
  return { selection: conflicts.length ? selection : next, conflicts };
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
export function validateCatalog(catalog, draft = false) {
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
  const keys = new Set(order.map(({ key }) => key));
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
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
      dlcs = [],
      family,
      variant,
      paid,
      link,
      image,
    } = entry;
    check(text(title) && Object.hasOwn(entryTypeLabels, type), `Invalid entry: ${id}`);
    check(
      ((draft && link === undefined) || isDownloadLink(link)) && validImage(image),
      `Invalid entry link or image: ${id}`,
    );
    check(paid === undefined || typeof paid === 'boolean', `Invalid paid label: ${id}`);
    check(
      uniqueList(files, (key) => known(key, keys) && !owners.has(key)) && (draft || files.length),
      `Invalid or shared files: ${id}`,
    );
    files.forEach((key) => owners.add(key));
    check(
      uniqueList(requires, (dep) => dep !== id && known(dep, byId)) &&
        (draft || isSelectable(entry) || requires.length),
      `Invalid dependencies: ${id}`,
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
    check(!visiting.has(id), `Circular dependency: ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id).requires || []) visit(dependency);
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
  for (const preset of presets) {
    check(
      text(preset.title) &&
        uniqueList(preset.selection, (id) => known(id, byId) && isSelectable(byId.get(id))) &&
        preset.selection.length,
      `Invalid preset: ${preset.id}`,
    );
    check(
      (draft && preset.boosty === undefined) ||
        (isDownloadLink(preset.boosty) && new URL(preset.boosty).hostname === 'boosty.to'),
      `Invalid Boosty link: ${preset.id}`,
    );
    check(
      draft || !resolveCombo(catalog, preset.selection).conflicts.length,
      `Conflicting preset: ${preset.id}`,
    );
  }
  return catalog;
}
