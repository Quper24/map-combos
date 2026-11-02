export const LANGUAGE_STORAGE_KEY = 'quperSimulator_language';
export const SUPPORTED_LANGUAGES = ['ru', 'en'];

export function resolveLanguage(savedLanguage, browserLanguages = []) {
  if (SUPPORTED_LANGUAGES.includes(savedLanguage)) return savedLanguage;
  for (const value of browserLanguages) {
    const language = String(value).toLowerCase().split(/[-_]/)[0];
    if (SUPPORTED_LANGUAGES.includes(language)) return language;
  }
  return 'en';
}

export function readLanguage(storage, browserLanguages) {
  let saved;
  try {
    saved = storage?.getItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // Browsers can disable storage; language selection still works for this visit.
  }
  return resolveLanguage(saved, browserLanguages);
}

export function createTranslator(language, dictionary) {
  if (language === 'ru') return (value) => value;
  const normalize = (value) => value.replace(/\s+/g, ' ').trim();
  // Entries also include sentence fragments surrounding inline code and dynamic values.
  // Match longest first so a complete sentence wins over a shorter label.
  const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
  const fragments = new RegExp(
    keys.map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
    'g',
  );
  return (value) => {
    if (typeof value !== 'string' || !/[А-Яа-яЁё]/.test(value)) return value;
    const text = normalize(value);
    const translated = Object.hasOwn(dictionary, text)
      ? dictionary[text]
      : text.replace(fragments, (key) => dictionary[key]);
    return `${/^\s/.test(value) ? ' ' : ''}${translated}${/\s$/.test(value) ? ' ' : ''}`;
  };
}
