import videos from '../../content/videos.json';
export const VIDEO_CATEGORIES = {
  combos: 'Сборки',
  mods: 'Моды и плагины',
  drives: 'Покатушки',
  guides: 'Инструкции',
  games: 'Другие игры',
};
export const GAME_NAMES = { ets2: 'ETS2', ats: 'ATS' };
export function assetUrl(value) {
  return value && !/^(https?:\/\/|\/)/.test(value) ? `/${value}` : value;
}
export function dateValue(value) {
  if (!value) return 0;
  const [day, month, shortYear] = value.split('.');
  const year = shortYear?.length === 2 ? `20${shortYear}` : shortYear;
  const timestamp = Date.parse(`${year}-${month}-${day}T00:00:00`);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
export function comboVideos(combo) {
  return videos.filter((video) => video.relatedComboIds.includes(combo.id));
}
export function youtubeVideoId(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.hostname === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v');
  } catch {
    return null;
  }
}
export { videos };
