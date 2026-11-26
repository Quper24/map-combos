import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { attachPresetFiles, presetCombo } from '../src/lib/presetCombos.js';

test('TruckKit export includes a preset hidden from the website catalog', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'truckkit-catalog-'));
  t.after(async () => {
    assert.ok(resolve(root).startsWith(`${resolve(tmpdir())}${sep}truckkit-catalog-`));
    await rm(root, { recursive: true, force: true });
  });
  const source = fileURLToPath(new URL('../', import.meta.url));
  const readJson = async (path) => JSON.parse(await readFile(join(source, path), 'utf8'));
  const base = await readJson('content/combo-builder/ats-1.62.json');
  const files = await Promise.all(
    (await readdir(join(source, 'content/combo-builder/presets')))
      .filter((name) => name.endsWith('.json'))
      .map((name) => readJson(`content/combo-builder/presets/${name}`)),
  );
  const [catalog] = attachPresetFiles(
    [base],
    files.filter((file) => file.game === base.game && file.version === base.version),
  );
  catalog.presets[0].hiddenFromCatalog = true;
  for (const dir of ['src/lib', 'content/combos', 'content/combo-builder/presets'])
    await mkdir(join(root, dir), { recursive: true });
  for (const name of ['comboBuilder.js', 'presetCombos.js'])
    await copyFile(join(source, 'src/lib', name), join(root, 'src/lib', name));
  await writeFile(join(root, 'package.json'), JSON.stringify({ type: 'module' }));
  await writeFile(
    join(root, 'content/site.json'),
    JSON.stringify({ domain: 'https://qupersimulator.ru' }),
  );
  await writeFile(join(root, 'content/combo-builder/ats.json'), JSON.stringify(catalog));
  const output = join(root, 'catalog.json');
  await promisify(execFile)(process.execPath, [
    join(source, 'scripts/export-desktop-catalog.mjs'),
    root,
    output,
  ]);
  const result = JSON.parse(await readFile(output, 'utf8'));
  const record = presetCombo(catalog, catalog.presets[0]);
  const exported = result.combos.find(({ id }) => id === record.id);
  assert.ok(exported);
  assert.equal(exported.page, `https://qupersimulator.ru/${record.slug}`);
  assert.ok(exported.mods.length);
  assert.equal(result.combos.length, catalog.presets.length);
});
