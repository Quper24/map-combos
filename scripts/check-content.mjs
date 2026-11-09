import { readFile, readdir, access } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { validateCatalog } from '../src/lib/comboBuilder.js';
import {
  attachPresetFiles,
  catalogKey,
  presetCombo,
  presetFileName,
} from '../src/lib/presetCombos.js';

const read = async (file) => JSON.parse(await readFile(file, 'utf8'));
const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};
const site = await read('content/site.json');
const versions = await read('content/versions.json');
check(!!versions[site.currentGameVersion], 'Current game version is missing from versions.json');
check(
  Object.values(versions).filter((version) => version.status === 'current').length === 1,
  'Expected one current game version',
);
check(
  Object.values(versions).filter((version) => version.default).length === 1,
  'Expected one default game version',
);
check(
  versions[site.currentGameVersion]?.status === 'current' &&
    versions[site.currentGameVersion]?.default,
  'Current/default metadata differs from site.json',
);
const vtc = await read('content/vtc.json');
const serverGroups = await read('content/servers.json');
const videos = await read('content/videos.json');
const combos = [];
for (const name of (await readdir('content/combos')).filter((name) => name.endsWith('.json'))) {
  const records = await read(`content/combos/${name}`);
  for (const record of records) {
    check(
      name === `v${record.version_game}.json`,
      `${record.id}: game version and filename differ`,
    );
    check(!!versions[record.version_game], `${record.id}: game version metadata missing`);
    check(
      Number(record.version_game.split('.')[1]) < 62,
      `${record.id}: use a builder preset from 1.62`,
    );
    combos.push(record);
  }
}
const builderVersions = new Set();
const presetCombos = [];
const sharedCatalogs = [];
const presetFiles = [];
for (const name of (await readdir('content/combo-builder')).filter((name) =>
  name.endsWith('.json'),
)) {
  try {
    const catalog = await read(`content/combo-builder/${name}`);
    check(name === `${catalogKey(catalog)}.json`, `${name}: expected game-version.json`);
    sharedCatalogs.push(catalog);
  } catch (error) {
    errors.push(`${name}: ${error.message}`);
  }
}
const presetFolder = 'content/combo-builder/presets';
const presetNames = await readdir(presetFolder).catch((error) => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
for (const name of presetNames.filter((file) => file.endsWith('.json'))) {
  try {
    const file = await read(`${presetFolder}/${name}`);
    check(name === presetFileName(file, file.preset), `${name}: expected game-combo-version.json`);
    presetFiles.push(file);
  } catch (error) {
    errors.push(`${name}: ${error.message}`);
  }
}
try {
  for (const catalog of attachPresetFiles(sharedCatalogs, presetFiles)) {
    try {
      validateCatalog(catalog);
      builderVersions.add(catalog.version);
      for (const item of [...catalog.entries, ...catalog.order, ...catalog.presets]) {
        await image(item.image, `${catalogKey(catalog)}: ${item.id || item.key}`);
      }
      presetCombos.push(...catalog.presets.map((preset) => presetCombo(catalog, preset)));
    } catch (error) {
      errors.push(`${catalogKey(catalog)}: ${error.message}`);
    }
  }
} catch (error) {
  errors.push(error.message);
}
const allCombos = [...combos, ...presetCombos];
const mods = [];
for (const name of (await readdir('content/mods')).filter((name) => name.endsWith('.json')))
  mods.push(await read(`content/mods/${name}`));
function ids(records, kind) {
  const seen = new Set();
  for (const record of records) {
    check(
      typeof record.id === 'string' && /^[a-z0-9-]+$/.test(record.id),
      `${kind}: invalid id ${record.id}`,
    );
    check(!seen.has(record.id), `${kind}: duplicate id ${record.id}`);
    check(typeof record.title === 'string' && record.title.trim(), `${record.id}: title missing`);
    seen.add(record.id);
  }
  return seen;
}
const comboIds = ids(allCombos, 'combo');
const modIds = ids(mods, 'mod');
const videoIds = ids(videos, 'video');
const serverIds = new Set();
const sessionIds = new Set();
const serverGames = new Set();
for (const group of serverGroups) {
  check(['ets2', 'ats'].includes(group.game), `Servers: invalid game ${group.game}`);
  check(!serverGames.has(group.game), `Servers: duplicate game ${group.game}`);
  serverGames.add(group.game);
  check(
    typeof group.title === 'string' && group.title.trim(),
    `${group.game}: server group title missing`,
  );
  check(
    Array.isArray(group.servers) && group.servers.length > 0,
    `${group.game}: server list missing`,
  );
  if (group.combo) {
    const combo = allCombos.find((item) => item.id === group.combo.id);
    check(!!combo, `${group.game}: missing server combo ${group.combo.id}`);
    check(
      combo?.tags.includes(group.game) && combo?.tags.includes('server'),
      `${group.game}: combo does not match server game`,
    );
    check(
      typeof group.combo.label === 'string' && group.combo.label.trim(),
      `${group.game}: server combo label missing`,
    );
  }
  for (const server of group.servers || []) {
    check(typeof server.id === 'string' && /^[a-z0-9-]+$/.test(server.id), 'Server: invalid id');
    check(!serverIds.has(server.id), `Server: duplicate id ${server.id}`);
    serverIds.add(server.id);
    check(typeof server.name === 'string' && server.name.trim(), `${server.id}: name missing`);
    check(
      typeof server.sessionId === 'string' && /^\d+\/\d+$/.test(server.sessionId),
      `${server.id}: session ID must be a string in digits/digits format`,
    );
    check(!sessionIds.has(server.sessionId), `${server.id}: duplicate session ID`);
    sessionIds.add(server.sessionId);
  }
}
function url(value, label) {
  try {
    check(new URL(value).protocol === 'https:', `${label}: expected https URL`);
  } catch {
    errors.push(`${label}: invalid URL`);
  }
}
async function image(value, label) {
  if (!value) return;
  if (/^https:\/\//.test(value)) {
    url(value, label);
    return;
  }
  const file = resolve('public', value.replace(/^\//, ''));
  check(file.startsWith(`${resolve('public')}${sep}`), `${label}: path outside public`);
  try {
    await access(file);
  } catch {
    errors.push(`${label}: missing file ${value}`);
  }
}
for (const version of Object.values(versions)) {
  if (version.boostyUrl) url(version.boostyUrl, `Version ${version.id}.boostyUrl`);
}
for (const combo of combos) {
  check(Array.isArray(combo.tags), `${combo.id}: tags must be an array`);
  check(
    typeof combo.version === 'string' && combo.version.length > 0,
    `${combo.id}: version missing`,
  );
  for (const field of ['preview', 'image_top', 'image_center', 'image_bottom'])
    await image(combo[field], `${combo.id}.${field}`);
  for (const field of ['table', 'boosty', 'profile'])
    if (combo[field]) url(combo[field], `${combo.id}.${field}`);
}
check(
  builderVersions.has(site.currentGameVersion) ||
    combos.some((combo) => combo.version_game === site.currentGameVersion),
  'Current game version has no combos',
);
await image('/img/combos/center.jpg', 'Shared center image');
for (const mod of mods) {
  if (mod.order !== undefined)
    check(
      Number.isFinite(mod.order) && mod.order >= 0,
      `${mod.id}: order must be a non-negative number`,
    );
  check(['mod', 'plugin'].includes(mod.type), `${mod.id}: invalid type`);
  check(
    Array.isArray(mod.games) &&
      mod.games.length &&
      mod.games.every((game) => ['ets2', 'ats'].includes(game)),
    `${mod.id}: invalid games`,
  );
  for (const field of ['description', 'features', 'images', 'links', 'videoIds'])
    check(Array.isArray(mod[field]), `${mod.id}: ${field} must be an array`);
  await image(mod.cover, `${mod.id}.cover`);
  for (const entry of mod.images || []) await image(entry.src || entry, `${mod.id}.image`);
  for (const link of mod.links || []) url(link.url, `${mod.id}.${link.platform}`);
  for (const variant of mod.variants || []) {
    for (const link of variant.links) {
      url(link.url, `${mod.id}.${variant.title}.${link.platform}`);
    }
  }
  for (const id of mod.videoIds || []) check(videoIds.has(id), `${mod.id}: missing video ${id}`);
}
const platformIds = { youtube: new Set(), rutube: new Set() };
for (const video of videos) {
  check(typeof video.game === 'string' && video.game.length, `${video.id}: game missing`);
  if (video.games !== undefined) {
    check(
      Array.isArray(video.games) &&
        video.games.length > 0 &&
        video.games.every((game) => typeof game === 'string' && game.length > 0) &&
        video.games.includes(video.game),
      `${video.id}: invalid games`,
    );
  }
  if (video.publishedAt !== undefined) {
    check(
      typeof video.publishedAt === 'string' &&
        /^\d{4}-\d{2}-\d{2}(?:T.*(?:Z|[+-]\d{2}:\d{2}))?$/.test(video.publishedAt) &&
        Number.isFinite(Date.parse(video.publishedAt)),
      `${video.id}: expected ISO publication date with timezone`,
    );
  }
  check(
    ['combos', 'mods', 'drives', 'guides', 'games'].includes(video.category),
    `${video.id}: category missing`,
  );
  check(
    video.platforms && Object.values(video.platforms).some(Boolean),
    `${video.id}: no platform links`,
  );
  for (const [platform, value] of Object.entries(video.platforms || {})) {
    check(
      ['youtube', 'rutube'].includes(platform),
      `${video.id}: unsupported platform ${platform}`,
    );
    if (value) {
      url(value, `${video.id}.${platform}`);
      try {
        const source = new URL(value);
        const id =
          platform === 'youtube'
            ? source.hostname === 'youtu.be'
              ? source.pathname.slice(1)
              : source.searchParams.get('v')
            : source.pathname.split('/').filter(Boolean).at(-1);
        if (platformIds[platform] && id) {
          check(!platformIds[platform].has(id), `${video.id}: duplicate ${platform} video ${id}`);
          platformIds[platform].add(id);
        }
      } catch {
        /* URL errors are reported above. */
      }
    }
  }
  await image(video.thumbnail, `${video.id}.thumbnail`);
  for (const id of video.relatedComboIds || []) {
    check(comboIds.has(id), `${video.id}: missing combo ${id}`);
    const combo = allCombos.find((item) => item.id === id);
    if (combo?.video && video.platforms.youtube) {
      const youtube = new URL(video.platforms.youtube);
      const youtubeId =
        youtube.hostname === 'youtu.be' ? youtube.pathname.slice(1) : youtube.searchParams.get('v');
      check(youtubeId === combo.video, `${video.id}: YouTube id differs from ${id}`);
    }
  }
  for (const id of video.relatedModIds || [])
    check(modIds.has(id), `${video.id}: missing mod ${id}`);
}
for (const link of [...vtc.links, ...site.socialLinks]) url(link.url, link.label);
if (process.argv.includes('--baseline')) {
  const baseline = await read('docs/migration-baseline.json');
  assert.equal(
    combos.length,
    Object.keys(baseline).length,
    'Migration changed the number of combos',
  );
  for (const combo of combos) {
    const hash = createHash('sha256').update(JSON.stringify(combo)).digest('hex');
    check(
      hash === baseline[combo.id],
      `${combo.id}: fields differ from the original migration baseline`,
    );
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Content verified: ${allCombos.length} combos, ${mods.length} mods, ${videos.length} videos, ${serverIds.size} servers${process.argv.includes('--baseline') ? '; all original combo fields preserved' : ''}.`,
  );
