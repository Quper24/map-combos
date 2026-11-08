import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createCipheriv } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { replaceActiveMods } from '../src/lib/profileMods.js';
import { parseModOrder } from '../src/lib/comboBuilder.js';

const profile =
  'SiiNunit\n{\nprofile : _nameless.1 {\n profile_name: "Тест"\n active_mods: 1\n active_mods[0]: "old|Old"\n other: 42\n}\n}\n';
const block = ' active_mods: 1\n active_mods[0]: "new|Новая карта"';
const source = await readFile(
  new URL('../src/vendor/sii-decode/decoder.js', import.meta.url),
  'utf8',
);
const wasm = await readFile(
  new URL('../src/vendor/sii-decode/sii_decode_bg.wasm', import.meta.url),
);
const glue = source.replace(
  /import m from .*?;/,
  `const m = 'data:application/wasm;base64,${wasm.toString('base64')}';`,
);
const { init, decode } = await import(
  `data:text/javascript;base64,${Buffer.from(glue).toString('base64')}`
);
await init();

test('WASM decodes plain and encrypted profiles preserving Unicode', () => {
  assert.equal(decode(Buffer.from(profile)), profile);
  const compressed = deflateSync(Buffer.from(profile));
  const padded = Buffer.alloc(Math.ceil(compressed.length / 16) * 16);
  compressed.copy(padded);
  const iv = Buffer.alloc(16, 7);
  const key = Buffer.from(
    '2a5fcb1791d22fb60245b3d8369ed0b2c27371563fbf1f3c9edf6b11825a5d0a',
    'hex',
  );
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  cipher.setAutoPadding(false);
  const size = Buffer.alloc(4);
  size.writeUInt32LE(Buffer.byteLength(profile));
  const encrypted = Buffer.concat([
    Buffer.from('ScsC'),
    Buffer.alloc(32),
    iv,
    size,
    cipher.update(padded),
    cipher.final(),
  ]);
  const decoded = decode(encrypted);
  assert.equal(decoded, profile);
  assert.deepEqual(parseModOrder(decoded), [{ key: 'old', name: 'Old' }]);
  assert.equal(
    replaceActiveMods(decoded, block),
    profile.replace(' active_mods: 1\n active_mods[0]: "old|Old"', block),
  );
});

test('WASM rejects invalid and truncated data', () => {
  for (const value of ['Invalid', 'ScsC', 'BSII', ''])
    assert.throws(() => decode(Buffer.from(value)));
});

test('replacement preserves CRLF and surrounding profile data', () => {
  const result = replaceActiveMods(profile.replaceAll('\n', '\r\n'), block);
  assert.equal(
    result,
    profile.replace(' active_mods: 1\n active_mods[0]: "old|Old"', block).replaceAll('\n', '\r\n'),
  );
  assert.equal(
    replaceActiveMods(
      profile.replace('active_mods: 1\n active_mods[0]: "old|Old"', 'active_mods: 0'),
      block,
    ).includes('new|Новая карта'),
    true,
  );
});

test('rejects missing/ambiguous active_mods and broken replacement blocks', () => {
  assert.throws(() => replaceActiveMods('SiiNunit {\n}', block));
  assert.throws(() => replaceActiveMods(profile + '\nactive_mods: 0', block));
  assert.throws(() => replaceActiveMods(profile, 'active_mods: 2\nactive_mods[0]: "bad"'));
  assert.throws(() => replaceActiveMods(profile, '<html>not found</html>'));
});

test('all shipped mod lists can be applied', async () => {
  const root = new URL('../public/profiles/', import.meta.url);
  for (const version of await readdir(root)) {
    const folder = new URL(`${version}/`, root);
    for (const name of await readdir(folder)) {
      if (!name.endsWith('.txt')) continue;
      const mods = await readFile(new URL(name, folder), 'utf8');
      assert.ok(
        replaceActiveMods(profile, mods).includes('profile_name: "Тест"'),
        `${version}/${name}`,
      );
    }
  }
});
