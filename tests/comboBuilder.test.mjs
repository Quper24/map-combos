import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  addToCombo,
  mergeModOrders,
  moveMod,
  parseModOrder,
  resolveCombo,
  serializeModOrder,
  validateCatalog,
} from '../src/lib/comboBuilder.js';
import { replaceActiveMods } from '../src/lib/profileMods.js';

const filesFor = (id) =>
  readFileSync(new URL(`../public/profiles/1.61/${id}-map-161.txt`, import.meta.url), 'utf8')
    .replaceAll('\r\n', '\n')
    .trimEnd();

test('Mega Boosty and Mega project back to their exact original active_mods after merging', () => {
  const sources = ['mega-boosty', 'mega'].map(filesFor);
  const lists = sources.map(parseModOrder);
  const { order, orderConflict } = mergeModOrders(...lists);
  assert.equal(orderConflict, false);
  assert.equal(order.length, 260);
  for (const [i, files] of lists.entries()) {
    const wanted = new Set(files.map(({ key }) => key));
    assert.equal(serializeModOrder(order.filter(({ key }) => wanted.has(key))), sources[i]);
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

const makeEntry = (id, type = 'map', options = {}) => ({
  id,
  type,
  title: id,
  files: [id],
  link: 'https://example.org',
  ...options,
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
      selection: ['eurafrica', 'sibir-fv', 'kazakhstan'],
    },
  ],
};

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
