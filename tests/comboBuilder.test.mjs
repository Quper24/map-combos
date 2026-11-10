import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { restorePresetFileSlugs } from '../src/lib/builderDraft.js';
import {
  addToCombo,
  catalogDate,
  entryBadge,
  isSelectable,
  mergeModOrders,
  moveMod,
  parseModOrder,
  reconcilePresetSelections,
  removeFromCombo,
  replaceEntryFiles,
  resolveCombo,
  serializeModOrder,
  validateCatalog,
} from '../src/lib/comboBuilder.js';
import { replaceActiveMods } from '../src/lib/profileMods.js';
import {
  attachPresetFiles,
  comboPath,
  presetCombo,
  presetFileName,
} from '../src/lib/presetCombos.js';
import {
  comboSharePath,
  readSharedSelection,
  restoreSharedSelection,
} from '../src/lib/comboShare.js';
import { fileImage } from '../src/pages/ComboBuilder/downloads.js';

const filesFor = (id) =>
  readFileSync(new URL(`../public/profiles/1.61/${id}-map-161.txt`, import.meta.url), 'utf8')
    .replaceAll('\r\n', '\n')
    .trimEnd();

test('merging Mega Boosty and Mega preserves both orders and the saved file names', () => {
  const sources = ['mega-boosty', 'mega'].map(filesFor);
  const lists = sources.map(parseModOrder);
  const savedByKey = new Map(lists[0].map((file) => [file.key, file]));
  const { order, orderConflict } = mergeModOrders(...lists);
  assert.equal(orderConflict, false);
  const keys = new Set(lists.flat().map(({ key }) => key));
  assert.equal(order.length, keys.size);
  for (const [i, files] of lists.entries()) {
    assert.equal(serializeModOrder(files), sources[i]);
    const wanted = new Set(files.map(({ key }) => key));
    assert.deepEqual(
      order.filter(({ key }) => wanted.has(key)),
      files.map((file) => savedByKey.get(file.key) ?? file),
    );
  }
});

test('when shared files disagree, the chosen order wins and saved file metadata survives', () => {
  const saved = [
    { key: 'a', name: 'A', filename: 'a.scs' },
    { key: 'b', name: 'B' },
  ];
  const incoming = [
    { key: 'b', name: 'B' },
    { key: 'c', name: 'C' },
    { key: 'a', name: 'A from import' },
  ];
  assert.deepEqual(mergeModOrders(saved, incoming), {
    order: [incoming[1], ...saved],
    orderConflict: true,
  });
  assert.deepEqual(mergeModOrders(saved, incoming, true).order, [saved[1], incoming[1], saved[0]]);
  assert.deepEqual(moveMod(saved, 'a', 'b', true), [saved[1], saved[0]]);
  assert.deepEqual(moveMod(saved, 'b', 'a', false), [saved[1], saved[0]]);
});

test('a new file takes the old slot and inherits the image and link, while the same preset and dependencies still resolve', () => {
  const old = {
    key: 'sibir-fv',
    name: 'Old FV',
    filename: 'old.scs',
    image: '/img/fv.webp',
    link: 'https://example.org/fv',
  };
  const other = { key: 'kazakhstan', name: 'Kazakhstan' };
  const updated = { key: 'fv-v2', name: 'New FV', filename: 'fv-v2.scs' };
  const { order, files } = replaceEntryFiles(
    [old, other, updated],
    [old.key, updated.key],
    new Map([[old.key, updated.key]]),
  );
  assert.deepEqual(order, [{ ...updated, image: old.image, link: old.link }, other]);
  assert.deepEqual(files, [updated.key]);
  const next = {
    ...catalog,
    order: catalog.order.map((file) => (file.key === old.key ? order[0] : file)),
    entries: catalog.entries.map((entry) =>
      entry.id === 'sibir-fv' ? { ...entry, files } : entry,
    ),
  };
  validateCatalog(next);
  const result = resolveCombo(next, next.presets[0].selection);
  assert.ok(result.active.has('fv-connector'));
  assert.ok(result.files.some((file) => file.key === updated.key));
  assert.throws(
    () =>
      replaceEntryFiles(
        [old, other, updated],
        [old.key, other.key],
        new Map([
          [old.key, updated.key],
          [other.key, updated.key],
        ]),
      ),
    /отдельный новый файл/,
  );
});

test('badges last five Moscow calendar days; only updates after the added date take precedence', () => {
  const entry = { addedAt: '2026-11-08', updatedAt: '2026-11-10' };
  assert.equal(catalogDate(new Date('2026-11-08T21:00:00Z')), '2026-11-09');
  assert.equal(entryBadge(entry, '2026-11-07'), '');
  assert.equal(entryBadge(entry, '2026-11-09'), 'NEW');
  assert.equal(entryBadge(entry, '2026-11-10'), 'UPDATE');
  assert.equal(entryBadge(entry, '2026-11-14'), 'UPDATE');
  assert.equal(entryBadge(entry, '2026-11-15'), '');
  assert.equal(entryBadge({ addedAt: entry.addedAt }, '2026-11-12'), 'NEW');
  assert.equal(entryBadge({ addedAt: entry.addedAt }, '2026-11-13'), '');
  const sameDay = { addedAt: entry.addedAt, updatedAt: entry.addedAt };
  assert.equal(entryBadge(sameDay, '2026-11-08'), 'NEW');
  assert.equal(entryBadge(sameDay, '2026-11-12'), 'NEW');
  assert.equal(entryBadge(sameDay, '2026-11-13'), '');
  assert.equal(entryBadge({ updatedAt: entry.updatedAt }, '2026-11-10'), 'UPDATE');
  assert.equal(entryBadge({}, '2026-11-08'), '');
  for (const dates of [
    { addedAt: '2026-02-30' },
    { addedAt: '2026-11-08', updatedAt: '2026-11-07' },
  ]) {
    assert.throws(
      () =>
        validateCatalog({
          ...catalog,
          entries: [{ ...entries[0], ...dates }, ...entries.slice(1)],
        }),
      /entry dates/,
    );
  }
});

const makeEntry = (id, type = 'map', options = {}) => ({
  id,
  type,
  title: id,
  files: [id],
  link: 'https://example.org',
  ...options,
});

test('a multipart mod uses distinct load-order images and shares one entry and download link', () => {
  const parts = ['Definition', 'Map', 'Assets', 'Models'];
  const order = parts.map((part) => ({
    key: part.toLowerCase(),
    name: `ProMods Canada ${part} Package`,
    image: `/img/canada-${part.toLowerCase()}.webp`,
  }));
  const canada = makeEntry('promods-canada', 'map', {
    title: 'ProMods Canada',
    image: '/img/canada-cover.webp',
    files: order.map(({ key }) => key),
  });
  const { files } = resolveCombo({ order, entries: [canada], conflicts: [] }, [canada.id]);
  assert.deepEqual(
    files.map(fileImage),
    order.map(({ image }) => image),
  );
  assert.deepEqual(
    files.map(({ name }) => name),
    order.map(({ name }) => name),
  );
  assert.ok(files.every((file) => !file.link && file.entry.link === canada.link));
  assert.equal(fileImage({ ...files[0], image: undefined }), undefined);
  assert.equal(fileImage({ entry: { ...canada, files: ['definition'] } }), canada.image);
});
const entries = [
  makeEntry('eurafrica', 'map', { files: ['eurafrica-base', 'eurafrica-models'] }),
  makeEntry('maghreb'),
  makeEntry('sibir-fv', 'map', { family: 'SibirMap', variant: 'FV' }),
  makeEntry('sibir-sv', 'map', { family: 'SibirMap', variant: 'SV', paid: true }),
  makeEntry('kazakhstan'),
  makeEntry('fv-connector', 'connector', { requires: ['sibir-fv', 'kazakhstan'] }),
  makeEntry('sv-connector', 'connector', { requires: ['sibir-sv', 'kazakhstan'] }),
  makeEntry('sv-fix', 'fix', { requires: ['sv-connector'] }),
];
const catalog = {
  game: 'ets2',
  version: '1.62',
  entries,
  order: entries.flatMap(({ files }) => files.map((key) => ({ key, name: key }))),
  conflicts: [{ entries: ['eurafrica', 'maghreb'], reason: 'Overlapping map sectors' }],
  presets: [
    {
      id: 'mega',
      title: 'Mega',
      boosty: 'https://boosty.to/example',
      profile: 'https://example.org/profile.zip',
      selection: ['eurafrica', 'sibir-fv', 'kazakhstan'],
    },
  ],
};

test('published presets produce unique catalog cards with game tags, cover and ready profile', () => {
  const preset = {
    ...catalog.presets[0],
    tags: ['server', 'convoy', 'boosty'],
    video: 'https://youtu.be/6UWd6wJa7s8',
    image: '/img/cover.webp',
    updatedAt: '2026-11-08',
  };
  const ats = { ...catalog, game: 'ats', presets: [preset] };
  validateCatalog(ats);
  const card = presetCombo(ats, preset);
  assert.equal(card.id, 'ats-1-62-mega');
  assert.notEqual(card.id, presetCombo(catalog, preset).id);
  assert.notEqual(card.id, presetCombo({ ...ats, version: '1.63' }, preset).id);
  assert.deepEqual(card.tags, ['ats', 'server', 'convoy', 'boosty']);
  assert.equal(card.version_game, '1.62');
  assert.equal(card.date, '08.11.2026');
  assert.equal(card.preview, preset.image);
  assert.equal(card.profile, preset.profile);
  assert.equal(card.boosty, preset.boosty);
  const draft = { ...ats, presets: [{ ...preset, profile: undefined }] };
  assert.doesNotThrow(() => validateCatalog(draft, true));
  assert.throws(() => validateCatalog(draft), /HTTPS-ссылку на готовый профиль/);
  assert.throws(
    () => validateCatalog({ ...ats, presets: [{ ...preset, video: 'http://example.org/video' }] }),
    /HTTPS-ссылку на видеообзор/,
  );
  assert.throws(
    () => validateCatalog({ ...ats, presets: [{ ...preset, tags: ['ats'] }] }),
    /metadata/,
  );
});

test('named map and mod combo files use the same release catalog and preserve their card IDs', () => {
  const { version, presets, ...shared } = catalog;
  const game = 'ats';
  const mod = makeEntry('graphics', 'mod');
  const base = {
    ...shared,
    game,
    version,
    entries: [...shared.entries, mod],
    order: [...shared.order, { key: mod.id, name: mod.title }],
    presets: [],
  };
  const mapPreset = {
    ...presets[0],
    id: 'ats-quper-map-combo-1-62',
    fileSlug: 'quper-map',
    version: '1.2',
  };
  const modPreset = { ...presets[0], id: 'mods', fileSlug: 'quper-mods', selection: [mod.id] };
  const files = [mapPreset, modPreset].map((preset) => ({ game, version, preset }));
  assert.equal(presetFileName(base, mapPreset), 'ats-quper-map-1.62.json');
  assert.equal(presetFileName(base, modPreset), 'ats-quper-mods-1.62.json');
  const [combined] = attachPresetFiles([base], files);
  validateCatalog(combined);
  assert.deepEqual(base.presets, []);
  const mapCard = presetCombo(combined, mapPreset);
  assert.equal(mapCard.version, '1.2');
  assert.equal(mapCard.version_game, version);
  assert.equal(presetCombo(combined, modPreset).version, undefined);
  assert.equal(mapCard.id, 'ats-1-62-ats-quper-map-combo-1-62');
  assert.equal(presetCombo(combined, { ...mapPreset, fileSlug: undefined }).id, mapCard.id);
  assert.equal(comboPath(mapCard), '/ats-quper-map-162');
  assert.equal(comboPath(presetCombo(combined, modPreset)), '/ats-quper-mods-162');
  assert.equal(comboPath({ ...mapCard, draft: true }), '/combos/ats-1-62-ats-quper-map-combo-1-62');
  assert.equal(comboPath({ id: 'quper-map-161' }), '/combos/quper-map-161');
  assert.deepEqual(
    resolveCombo(combined, modPreset.selection).files.map(({ key }) => key),
    [mod.id],
  );
  assert.throws(() => attachPresetFiles([base], [...files, files[0]]), /нескольких файлах/);
  assert.throws(
    () => attachPresetFiles([base], [{ ...files[0], version: '1.63' }]),
    /каталог для сборки не найден/,
  );
  assert.throws(
    () =>
      validateCatalog({
        ...combined,
        presets: [mapPreset, { ...modPreset, fileSlug: mapPreset.fileSlug }],
      }),
    /Имя файла сборки уже используется/,
  );
  assert.throws(
    () => validateCatalog({ ...combined, presets: [{ ...mapPreset, version: 1.2 }] }),
    /Invalid combo version/,
  );
});

test('an older editor draft recovers its published filename without losing local edits', () => {
  const id = 'ats-quper-map-combo-1-62';
  const edited = { ...catalog.presets[0], id, title: 'Local changes' };
  const draft = { ...catalog, game: 'ats', presets: [edited] };
  const published = {
    ...draft,
    presets: [{ ...catalog.presets[0], id, fileSlug: 'quper-map' }],
  };

  const [restored] = restorePresetFileSlugs(draft, [published]).presets;
  assert.deepEqual(restored, { ...edited, fileSlug: 'quper-map' });
  assert.equal(presetFileName(draft, restored), 'ats-quper-map-1.62.json');
  assert.equal(restorePresetFileSlugs(draft, [{ ...published, version: '1.63' }]), draft);

  const custom = { ...edited, fileSlug: 'custom' };
  const conflicting = { ...edited, id: 'other', fileSlug: 'quper-map' };
  for (const presets of [[custom], [edited, conflicting]]) {
    assert.deepEqual(restorePresetFileSlugs({ ...draft, presets }, [published]).presets, presets);
  }
});

test('a shared selection keeps its release and recalculates dependencies, even with unavailable IDs', () => {
  const release = { ...catalog, game: 'ats' };
  const url = new URL(comboSharePath(release, ['sibir-fv', 'kazakhstan']), 'https://example.org');
  assert.equal(url.pathname, '/combos/builder');
  assert.equal(url.searchParams.get('release'), 'ats-1.62');
  const ids = readSharedSelection(url.hash);
  assert.deepEqual(ids, ['sibir-fv', 'kazakhstan']);
  assert.deepEqual(restoreSharedSelection(release, ids), { selection: ids, missing: 0 });
  assert.ok(resolveCombo(release, ids).active.has('fv-connector'));
  const changed = readSharedSelection('#mods=sibir-fv,deleted,fv-connector,sibir-fv');
  assert.deepEqual(restoreSharedSelection(release, changed), {
    selection: ['sibir-fv'],
    missing: 2,
  });
  assert.equal(readSharedSelection('#map-order'), null);
  const longSelection = Array.from({ length: 200 }, (_, index) => `map-entry-number-${index}`);
  const large = new URL(comboSharePath(release, longSelection), 'https://example.org');
  assert.deepEqual(readSharedSelection(large.hash), longSelection);
});

test('common mods and fixes are hidden from selection and activate with any map in the template order', () => {
  const commonMod = makeEntry('common-mod', 'mod', { autoWithMaps: true });
  const commonFix = makeEntry('common-fix', 'fix', { autoWithMaps: true });
  const standalone = makeEntry('standalone', 'mod');
  const combined = {
    ...catalog,
    entries: [...catalog.entries, commonMod, commonFix, standalone],
    order: [
      { key: commonMod.id, name: 'Common Mod' },
      ...catalog.order,
      { key: commonFix.id, name: 'Common Fix' },
      { key: standalone.id, name: 'Standalone Mod' },
    ],
  };
  validateCatalog(combined);
  assert.equal(isSelectable(commonMod), false);
  assert.equal(isSelectable(commonFix), false);
  assert.deepEqual(addToCombo(combined, [], commonMod.id).selection, []);
  assert.deepEqual(resolveCombo(combined, []).files, []);
  assert.deepEqual(
    resolveCombo(combined, [standalone.id]).files.map(({ key }) => key),
    [standalone.id],
  );
  for (const map of ['maghreb', 'kazakhstan']) {
    const { files } = resolveCombo(combined, [map]);
    assert.deepEqual(
      files.map(({ key }) => key),
      [commonMod.id, map, commonFix.id],
    );
  }
  const { active } = resolveCombo(combined, combined.presets[0].selection);
  assert.ok(active.has(commonFix.id) && active.has('fv-connector'));
  assert.throws(
    () =>
      validateCatalog({
        ...combined,
        entries: [{ ...combined.entries[0], autoWithMaps: true }, ...combined.entries.slice(1)],
      }),
    /automatic map rule/,
  );
  assert.throws(
    () =>
      validateCatalog({
        ...combined,
        entries: combined.entries.map((entry) =>
          entry.id === commonFix.id ? { ...entry, requires: ['kazakhstan'] } : entry,
        ),
      }),
    /dependencies/,
  );
});

test('a shared resource pack is added once when any map that requires it is selected', () => {
  const base = makeEntry('base-assets', 'mod');
  const resource = makeEntry('reforma-megaresources', 'resource', { requires: [base.id] });
  const maps = [
    makeEntry('reforma', 'map', { requires: [resource.id] }),
    makeEntry('dependent-map', 'map', { requires: [resource.id] }),
    makeEntry('unrelated-map'),
  ];
  const entries = [base, resource, ...maps];
  const catalog = {
    game: 'ats',
    version: '1.62',
    entries,
    order: entries.map(({ id }) => ({ key: id, name: id })),
    conflicts: [],
    presets: [],
  };
  validateCatalog(catalog);
  const keys = (selection) => resolveCombo(catalog, selection).files.map(({ key }) => key);
  assert.equal(isSelectable(resource), false);
  assert.deepEqual(keys([base.id]), [base.id]);
  assert.deepEqual(keys(['unrelated-map']), ['unrelated-map']);
  assert.deepEqual(keys(['reforma']), [base.id, resource.id, 'reforma']);
  assert.deepEqual(keys(['dependent-map']), [base.id, resource.id, 'dependent-map']);
  assert.deepEqual(keys(['dependent-map', 'reforma']), [
    base.id,
    resource.id,
    'reforma',
    'dependent-map',
  ]);
  assert.throws(
    () =>
      validateCatalog(
        {
          ...catalog,
          entries: [base, { ...resource, requires: ['reforma'] }, ...maps],
        },
        true,
      ),
    /Циклическая зависимость — reforma-megaresources → reforma → reforma-megaresources/,
  );

  const emptyFix = {
    ...catalog,
    entries: entries.map((entry) =>
      entry.id === resource.id ? { ...entry, type: 'fix', requires: [] } : entry,
    ),
  };
  assert.doesNotThrow(() => validateCatalog(emptyFix, true));
  assert.throws(() => validateCatalog(emptyFix), /Для фикса или коннектора.*reforma-megaresources/);
});

test('conflicts block adding in both directions without clearing the selected map', () => {
  validateCatalog(catalog);
  for (const [a, b] of [
    ['eurafrica', 'maghreb'],
    ['maghreb', 'eurafrica'],
  ]) {
    const selection = [a];
    assert.deepEqual(addToCombo(catalog, selection, b), {
      selection,
      conflicts: catalog.conflicts,
    });
  }
  assert.deepEqual(
    resolveCombo(catalog, ['eurafrica']).files.map(({ key }) => key),
    ['eurafrica-base', 'eurafrica-models'],
  );
});

test('SibirMap variants switch atomically and recalculate only their matching connectors and fixes', () => {
  assert.deepEqual(
    resolveCombo(catalog, ['sibir-fv']).files.map(({ key }) => key),
    ['sibir-fv'],
  );
  const original = catalog.presets[0].selection;
  assert.ok(resolveCombo(catalog, original).active.has('fv-connector'));
  const next = addToCombo(catalog, original, 'sibir-sv');
  const { files, reasons } = resolveCombo(catalog, next.selection);
  assert.deepEqual(next.conflicts, []);
  assert.deepEqual(
    files.map(({ key }) => key),
    ['eurafrica-base', 'eurafrica-models', 'sibir-sv', 'kazakhstan', 'sv-connector', 'sv-fix'],
  );
  assert.deepEqual(reasons.get('sv-connector'), ['sibir-sv', 'kazakhstan']);
  assert.deepEqual(catalog.presets[0].selection, ['eurafrica', 'sibir-fv', 'kazakhstan']);
});

test('disabling a map recalculates connectors without reporting them as selected mods', () => {
  const original = catalog.presets[0].selection;
  const removed = removeFromCombo(catalog, original, 'kazakhstan');
  assert.deepEqual(removed, { selection: ['eurafrica', 'sibir-fv'], alsoDisabled: [] });
  assert.equal(resolveCombo(catalog, removed.selection).active.has('fv-connector'), false);
  const added = addToCombo(catalog, removed.selection, 'kazakhstan');
  assert.equal(resolveCombo(catalog, added.selection).active.has('fv-connector'), true);
});

test('disabling an explicitly or implicitly enabled map also disables its dependent maps and mods', () => {
  const reforma = makeEntry('reforma');
  const sierra = makeEntry('sierra-nevada', 'map', { requires: [reforma.id] });
  const extension = makeEntry('extension', 'mod', { requires: [sierra.id] });
  const coast = makeEntry('coast-to-coast');
  const patch = makeEntry('patch', 'fix', { requires: [reforma.id], requiresAny: [coast.id] });
  const entries = [reforma, sierra, extension, coast, patch];
  const next = {
    game: 'ats',
    version: '1.62',
    entries,
    order: entries.map(({ id }) => ({ key: id, name: id })),
    conflicts: [],
    presets: [],
  };
  validateCatalog(next);
  for (const selection of [
    [reforma.id, sierra.id, extension.id, coast.id],
    [extension.id, coast.id],
  ]) {
    const result = resolveCombo(next, selection);
    assert.ok(result.active.has(patch.id));
    const removal = removeFromCombo(next, selection, reforma.id, result.active);
    assert.deepEqual(removal, { selection: [coast.id], alsoDisabled: [sierra.id, extension.id] });
    assert.deepEqual(
      resolveCombo(next, removal.selection).files.map(({ key }) => key),
      [coast.id],
    );
  }
  assert.deepEqual(removeFromCombo(next, [reforma.id, sierra.id, coast.id], coast.id), {
    selection: [reforma.id, sierra.id],
    alsoDisabled: [],
  });
});

test('reclassifying a selected map as a fix updates presets and keeps conditional activation', () => {
  const patch = makeEntry('reforma-othermaps-patch');
  const original = {
    ...catalog.presets[0],
    id: 'ats-quper-map-combo-1-62',
    selection: ['eurafrica', 'kazakhstan', patch.id],
  };
  const before = {
    ...catalog,
    entries: [...catalog.entries, patch],
    order: [...catalog.order, { key: patch.id, name: patch.title }],
    presets: [original, catalog.presets[0]],
  };
  validateCatalog(before);
  assert.equal(reconcilePresetSelections(before.presets, patch), before.presets);

  const fix = { ...patch, type: 'fix', requires: ['eurafrica', 'kazakhstan'] };
  const presets = reconcilePresetSelections(before.presets, fix);
  const after = { ...before, entries: [...catalog.entries, fix], presets };
  validateCatalog(after);
  assert.deepEqual(presets[0], { ...original, selection: ['eurafrica', 'kazakhstan'] });
  assert.equal(presets[1], before.presets[1]);
  assert.ok(resolveCombo(after, presets[0].selection).active.has(fix.id));
  assert.equal(resolveCombo(after, ['eurafrica']).active.has(fix.id), false);
});

test('an OtherMaps patch needs Reforma and at least one compatible map', () => {
  const reforma = makeEntry('reforma');
  const coast = makeEntry('coast-to-coast');
  const promods = makeEntry('promods-canada');
  const patch = makeEntry('reforma-othermaps-patch', 'fix', {
    requires: [reforma.id],
    requiresAny: [coast.id, promods.id],
  });
  const entries = [reforma, coast, promods, patch];
  const next = {
    game: 'ats',
    version: '1.62',
    entries,
    order: entries.map(({ id }) => ({ key: id, name: id })),
    conflicts: [],
    presets: [],
  };
  validateCatalog(next);
  const active = (selection) => resolveCombo(next, selection).active.has(patch.id);
  assert.equal(active([reforma.id]), false);
  assert.equal(active([coast.id, promods.id]), false);
  assert.equal(active([reforma.id, coast.id]), true);
  assert.equal(active([reforma.id, promods.id]), true);
  const withBoth = resolveCombo(next, [reforma.id, coast.id, promods.id]);
  assert.equal(withBoth.files.filter(({ key }) => key === patch.id).length, 1);
  assert.deepEqual(withBoth.reasons.get(patch.id), [reforma.id, coast.id, promods.id]);
  assert.throws(
    () =>
      validateCatalog({
        ...next,
        entries: [...entries.slice(0, 3), { ...patch, requiresAny: [reforma.id] }],
      }),
    /альтернативных зависимостей/,
  );
  assert.throws(
    () =>
      validateCatalog({
        ...next,
        entries: [{ ...reforma, requires: [patch.id] }, ...entries.slice(1)],
      }),
    /Циклическая зависимость/,
  );
});

test('generated profile blocks safely escape names and replace all original active mods', () => {
  const files = [{ key: 'example', name: 'SibirMap "SV" \\ Česko' }];
  const block = serializeModOrder(files);
  const original =
    'SiiNunit\n{\n active_mods: 2\n active_mods[0]: "old|Old"\n active_mods[1]: "older|Older"\n name: "Driver"\n}';
  const result = replaceActiveMods(original, block);
  assert.deepEqual(parseModOrder(result), files);
  assert.ok(result.endsWith(' name: "Driver"\n}'));
  assert.throws(() => parseModOrder(block.replace('[0]', '[1]')), /Invalid active_mods/);
  assert.throws(
    () => parseModOrder(block.replace('active_mods: 1', 'active_mods: 2')),
    /Invalid active_mods/,
  );
});

test('publication rejects archive versions, unsafe links, unassigned files and invalid dependencies', () => {
  assert.throws(() => validateCatalog({ ...catalog, version: '1.61' }), /start at 1.62/);
  assert.throws(() => validateCatalog({ ...catalog, version: '1.61' }, true), /start at 1.62/);
  assert.throws(
    () =>
      validateCatalog({ ...catalog, order: [...catalog.order, { key: 'extra', name: 'Extra' }] }),
    /unassigned/,
  );
  assert.throws(
    () =>
      validateCatalog({
        ...catalog,
        entries: [{ ...entries[0], link: 'javascript:alert(1)' }, ...entries.slice(1)],
      }),
    /link/,
  );
  assert.throws(
    () =>
      validateCatalog({
        ...catalog,
        entries: [{ ...entries[0], requires: ['not-found'] }, ...entries.slice(1)],
      }),
    /dependencies/,
  );
});
