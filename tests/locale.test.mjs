import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from '@babel/parser';
import {
  createTranslator,
  readLanguage,
  resolveLanguage,
  LANGUAGE_STORAGE_KEY,
} from '../src/i18n/locale.js';
import { formatVideoDate } from '../src/lib/videoCatalog.js';

const dictionary = JSON.parse(fs.readFileSync(new URL('../src/i18n/en.json', import.meta.url)));
const t = createTranslator('en', dictionary);

test('explicit choice wins; browser preferences support regional variants and English fallback', () => {
  assert.equal(resolveLanguage('en', ['ru-RU']), 'en');
  assert.equal(resolveLanguage('ru', ['en-US']), 'ru');
  assert.equal(resolveLanguage(null, ['ru-RU', 'en']), 'ru');
  assert.equal(resolveLanguage(null, ['en-GB', 'ru']), 'en');
  assert.equal(resolveLanguage(null, ['de-DE', 'fr', 'ru']), 'ru');
  assert.equal(resolveLanguage('invalid', ['RU-ru']), 'ru');
  assert.equal(resolveLanguage(null, ['de-DE']), 'en');
  assert.equal(resolveLanguage(null, []), 'en');
});

test('stored preference and blocked storage are handled', () => {
  assert.equal(
    readLanguage(
      {
        getItem(key) {
          assert.equal(key, LANGUAGE_STORAGE_KEY);
          return 'en';
        },
      },
      ['ru'],
    ),
    'en',
  );
  assert.equal(
    readLanguage(
      {
        getItem() {
          throw new Error('Storage disabled');
        },
      },
      ['ru'],
    ),
    'ru',
  );
  assert.equal(readLanguage(undefined, ['en']), 'en');
});

test('translates dynamic labels, errors and inline fragments without losing whitespace or identifiers', () => {
  assert.equal(t('Версия 1.61'), 'Version 1.61');
  assert.equal(
    t('Ошибка: Выбери непустой profile.sii размером до 300 КБ.'),
    'Error: Choose a non-empty profile.sii file up to 300 KB.',
  );
  assert.equal(t(' Документы/'), ' Documents/');
  assert.equal(t('Найди параметр '), 'Find the setting ');
  assert.equal(t('Весь мир\n  у наших колёс.'), 'The whole world at our wheels.');
  assert.equal(t('ETS2 1.61'), 'ETS2 1.61');
  assert.equal(t(undefined), undefined);
  assert.equal(t(false), false);
  const element = { type: 'span' };
  assert.equal(t(element), element);
  assert.equal(createTranslator('ru', dictionary)('Сборки карт'), 'Сборки карт');
});

test('all Russian content records have complete English translations', () => {
  const visit = (dir) =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((e) =>
        e.isDirectory() ? visit(new URL(`${e.name}/`, dir)) : [new URL(e.name, dir)],
      );
  const check = (value, file) => {
    if (typeof value === 'string' && /[А-Яа-яЁё]/.test(value)) {
      assert.ok(!/[А-Яа-яЁё]/.test(t(value)), `${file}: ${value}`);
    } else if (value && typeof value === 'object')
      Object.values(value).forEach((v) => check(v, file));
  };
  for (const file of visit(new URL('../content/', import.meta.url)).filter((f) =>
    f.pathname.endsWith('.json'),
  ))
    check(JSON.parse(fs.readFileSync(file)), file.pathname);
  for (const [key, value] of Object.entries(dictionary)) {
    assert.ok(value.trim(), `Empty translation: ${key}`);
    assert.ok(!/[А-Яа-яЁё]/.test(value), `Untranslated entry: ${key}`);
  }
});

test('video dates use selected language and retain Moscow calendar day', () => {
  assert.equal(formatVideoDate('2026-10-01T22:25:42-07:00', 'en'), '2 October 2026');
  assert.match(formatVideoDate('2026-10-01T22:25:42-07:00', 'ru'), /2 октября 2026/);
});

test('interface copy, dynamic fragments and worker errors have English translations', () => {
  function visit(dir) {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((entry) =>
        entry.isDirectory() ? visit(new URL(`${entry.name}/`, dir)) : [new URL(entry.name, dir)],
      );
  }
  // Native language names intentionally remain readable in their own language.
  const languageNames = new Set(['Русский', 'Язык сайта']);
  const check = (node, file) => {
    if (!node || typeof node !== 'object') return;
    const text =
      node.type === 'StringLiteral' || node.type === 'JSXText'
        ? node.value
        : node.type === 'TemplateElement'
          ? node.value.cooked
          : null;
    if (text && /[А-Яа-яЁё]/.test(text) && !languageNames.has(text)) {
      assert.ok(!/[А-Яа-яЁё]/.test(t(text)), `${file}: ${text}`);
      if (node.type === 'JSXText') assert.fail(`Unlocalized JSX text in ${file}: ${text}`);
    }
    for (const [key, child] of Object.entries(node)) {
      if (
        [
          'loc',
          'extra',
          'comments',
          'leadingComments',
          'trailingComments',
          'innerComments',
        ].includes(key)
      )
        continue;
      if (Array.isArray(child)) child.forEach((value) => check(value, file));
      else if (child && typeof child === 'object') check(child, file);
    }
  };
  for (const file of visit(new URL('../src/', import.meta.url))) {
    if (
      !/\.(jsx|js)$/.test(file.pathname) ||
      /\/(vendor|i18n)\//.test(file.pathname) ||
      file.pathname.endsWith('/server-temp.js')
    )
      continue;
    check(
      parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }),
      file.pathname,
    );
  }
});
