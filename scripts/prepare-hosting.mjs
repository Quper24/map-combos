import { mkdir, readFile, readdir, writeFile, access } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import sharp from 'sharp';
import {
  attachPresetFiles,
  combinedPresetPairs,
  presetCombo,
  comboPath,
} from '../src/lib/presetCombos.js';
import { resolveCombo } from '../src/lib/comboBuilder.js';
import {
  defaultMetadata,
  sectionMetadata,
  metadataForPath,
  metadataTags,
  socialImagePath,
} from '../src/lib/pageMetadata.js';

const load = async (path) => JSON.parse(await readFile(path, 'utf8'));
const records = async (dir) =>
  Promise.all(
    (await readdir(dir))
      .filter((file) => file.endsWith('.json'))
      .map((file) => load(`${dir}/${file}`)),
  );
const site = await load('content/site.json');
const catalogs = attachPresetFiles(
  await records('content/combo-builder'),
  await records('content/combo-builder/presets'),
);
// Match the application's version precedence and include valid composed presets.
const byVersion = {};
for (const rows of await records('content/combos')) {
  for (const row of rows) (byVersion[row.version_game] ??= []).push(row);
}
const published = {};
const composed = [];
for (const catalog of catalogs) {
  (published[catalog.version] ??= []).push(
    ...catalog.presets.map((preset) => presetCombo(catalog, preset)),
  );
  for (const { preset } of combinedPresetPairs(catalog)) {
    if (!resolveCombo(catalog, preset.selection).conflicts.length)
      composed.push(presetCombo(catalog, preset));
  }
}
const combos = [...Object.values({ ...byVersion, ...published }).flat(), ...composed];
const mods = await records('content/mods');
const paths = new Set(['/', ...Object.keys(sectionMetadata)]);
for (const combo of combos) {
  paths.add(comboPath(combo));
  paths.add(`/combos/${combo.id}`);
  if (combo.slug) paths.add(`/combos/${combo.slug}`);
}
for (const mod of mods) paths.add(`/mods/${mod.id}`);
const template = await readFile('dist/index.html', 'utf8');
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char],
  );
function render(metadata) {
  const tags = Object.entries(metadataTags(metadata, site.domain)).map(
    ([key, value]) =>
      `    <meta ${key.startsWith('og:') ? 'property' : 'name'}="${key}" content="${escape(value)}" />`,
  );
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(metadata.title)}</title>`)
    .replace(/\s*<meta\s+name="description"[^>]*>/, '')
    .replace(
      '</head>',
      `${tags.join('\n')}\n    <link rel="canonical" href="${escape(new URL(metadata.path, site.domain).href)}" />\n  </head>`,
    );
}
const preparedImages = new Set();
async function prepareImage(image) {
  if (preparedImages.has(image) || /^https?:\/\//.test(image)) return;
  const source = resolve('public', image.replace(/^\//, ''));
  await access(source);
  const output = resolve('dist', `.${socialImagePath(image)}`);
  if (!output.startsWith(`${resolve('dist')}${sep}`)) throw new Error(`Invalid image: ${image}`);
  await mkdir(dirname(output), { recursive: true });
  await sharp(source)
    .rotate()
    .resize(1200, 630, { fit: 'contain', background: '#101310' })
    .flatten({ background: '#101310' })
    .jpeg({ quality: 88 })
    .toFile(output);
  preparedImages.add(image);
}
for (const path of paths) {
  const metadata = metadataForPath(path, combos, mods);
  await prepareImage(metadata.image);
  const output = resolve('dist', `.${path}`, 'index.html');
  if (!output.startsWith(`${resolve('dist')}${sep}`)) throw new Error(`Invalid page path: ${path}`);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, render(metadata));
}
await writeFile('dist/404.html', render(defaultMetadata));
console.log(`Static hosting: generated metadata for ${paths.size} page URLs.`);
