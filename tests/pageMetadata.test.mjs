import test from 'node:test';
import assert from 'node:assert/strict';
import { metadataForPath, metadataTags } from '../src/lib/pageMetadata.js';

const combo = {
  id: 'ets2-1-62-quper',
  slug: 'ets2-quper-map-combo-ets2-162',
  title: 'Quper Map Combo ETS2',
  tags: ['ets2'],
  version_game: '1.62',
  version: '0.3',
  date: '26.11.2026',
  preview: '/img/combo.webp',
};

test('direct, legacy and trailing slash URLs share page-specific metadata', () => {
  const canonical = metadataForPath(`/${combo.slug}`, [combo]);
  for (const path of [`/${combo.slug}/`, `/combos/${combo.id}`, `/combos/${combo.slug}`])
    assert.deepEqual(metadataForPath(path, [combo]), canonical);
  assert.match(canonical.title, /1\.62/);
  assert.match(canonical.description, /0\.3/);
  assert.equal(canonical.image, combo.preview);
  const tags = metadataTags(canonical, 'https://qupersimulator.ru');
  assert.equal(tags['og:url'], `https://qupersimulator.ru/${combo.slug}`);
  assert.equal(tags['og:image'], 'https://qupersimulator.ru/img/social/img/combo.jpg');
  assert.equal(tags['twitter:card'], 'summary_large_image');
});

test('mods, sections and home use their own content and images', () => {
  const mod = {
    id: 'cargo-control',
    title: 'Cargo Control',
    version: '1.3.5',
    summary: 'Управление грузами',
    cover: '/img/cargo.png',
  };
  const metadata = metadataForPath('/mods/cargo-control', [], [mod]);
  assert.equal(metadata.description, mod.summary);
  assert.equal(metadata.image, mod.cover);
  assert.match(metadata.title, /1\.3\.5/);
  assert.notEqual(metadataForPath('/combos').description, metadataForPath('/').description);
  assert.equal(metadataForPath('/').path, '/');
});
