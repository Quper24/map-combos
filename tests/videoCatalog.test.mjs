import test from 'node:test';
import assert from 'node:assert/strict';
import { sortVideos, videoGames, formatVideoDate } from '../src/lib/videoCatalog.js';

test('sorts instants across timezone offsets without mutating input', () => {
  const input = [
    { id: 'before', publishedAt: '2026-09-23T23:00:00-07:00' },
    { id: 'after', publishedAt: '2026-09-24T10:00:00+03:00' },
    { id: 'unknown' },
  ];
  assert.deepEqual(
    sortVideos(input).map((v) => v.id),
    ['after', 'before', 'unknown'],
  );
  assert.deepEqual(
    sortVideos(input, 'oldest').map((v) => v.id),
    ['before', 'after', 'unknown'],
  );
  assert.deepEqual(
    input.map((v) => v.id),
    ['before', 'after', 'unknown'],
  );
});

test('shared ETS2 / ATS video belongs to both games; legacy videos retain their game', () => {
  assert.deepEqual(videoGames({ game: 'ets2', games: ['ets2', 'ats'] }), ['ets2', 'ats']);
  assert.deepEqual(videoGames({ game: 'transport-fever-3' }), ['transport-fever-3']);
});

test('dates use Moscow calendar day, independent of source timezone', () => {
  const value = formatVideoDate('2026-10-01T22:25:42-07:00');
  assert.match(value, /2 октября 2026/);
  assert.equal(formatVideoDate('invalid'), '');
  assert.equal(formatVideoDate(undefined), '');
});
