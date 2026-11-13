import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const [site, output = fileURLToPath(new URL('../data/catalog.json', import.meta.url))] = process.argv.slice(2);
if (!site) throw new Error('Usage: node scripts/export-catalog.mjs <site checkout> [output.json]');
const root = resolve(site);
const load = (path) => readFile(join(root, path), 'utf8');
const json = async (path) => JSON.parse(await load(path));
const list = async (path) => (await readdir(join(root, path))).filter((name) => name.endsWith('.json'));
const { resolveCombo, parseModOrder, validateCatalog } = await import(pathToFileURL(join(root, 'src/lib/comboBuilder.js')));
const { attachPresetFiles, presetCombo, comboPath } = await import(pathToFileURL(join(root, 'src/lib/presetCombos.js')));
const { domain } = await json('content/site.json');
const builder = 'content/combo-builder';
const readList = async (dir) => Promise.all((await list(dir)).map((name) => json(`${dir}/${name}`)));
const combos = [];
for (const catalog of attachPresetFiles(await readList(builder), await readList(`${builder}/presets`))) {
  validateCatalog(catalog);
  for (const preset of catalog.presets) {
    const record = presetCombo(catalog, preset);
    const { files, dlcs } = resolveCombo(catalog, preset.selection);
    if (files.length) combos.push({ id: record.id, game: catalog.game, version: catalog.version,
      title: preset.title, release: preset.version, updated: preset.updatedAt,
      page: new URL(comboPath(record), domain).href, dlcs,
      mods: files.map(({ key, name, filename }) => ({ key, name, filename })) });
  }
}
for (const records of await readList('content/combos')) {
  for (const record of records.filter((row) => row.automods)) {
    const game = record.tags.find((tag) => tag === 'ats' || tag === 'ets2');
    if (!game) continue;
    for (const extra of record.mods ? [false, true] : [false]) {
      const id = record.id + (extra ? 'm' : '');
      const orderPath = `/profiles/${record.version_game}/${id}.txt`;
      let source;
      try { source = await load(`public${orderPath}`); }
      catch (error) {
        if (error.code !== 'ENOENT') throw error;
        console.warn(`No order file on site: ${orderPath}`);
        continue;
      }
      const mods = parseModOrder(source);
      if (mods.length) combos.push({ id, game, version: record.version_game, release: record.version,
        title: record.title + (extra ? ' · с модами' : ''), page: new URL(comboPath(record), domain).href,
        orderUrl: new URL(orderPath, domain).href, mods });
    }
  }
}
if (!combos.length || new Set(combos.map(({ id }) => id)).size !== combos.length) throw new Error('Empty or duplicate catalog');
combos.sort((a, b) => Number(b.version.split('.')[1]) - Number(a.version.split('.')[1]));
await mkdir(dirname(resolve(output)), { recursive: true });
await writeFile(output, JSON.stringify({ schema: 1, combos }, null, 2) + '\n');
console.log(`${combos.length} presets: ${Object.entries(Object.groupBy(combos, c => c.game)).map(([g, rows]) => `${g}: ${rows.length}`).join(', ')}`);
