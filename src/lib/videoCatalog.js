export function videoGames(video) {
  return Array.isArray(video.games) && video.games.length ? video.games : [video.game];
}

export function sortVideos(records, order = 'newest') {
  return [...records].sort((a, b) => {
    const left = Date.parse(a.publishedAt || '');
    const right = Date.parse(b.publishedAt || '');
    if (Number.isNaN(left)) return Number.isNaN(right) ? 0 : 1;
    if (Number.isNaN(right)) return -1;
    return order === 'oldest' ? left - right : right - left;
  });
}

export function formatVideoDate(value, language = 'ru') {
  if (!value || Number.isNaN(Date.parse(value))) return '';
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Moscow',
  }).format(new Date(value));
}
