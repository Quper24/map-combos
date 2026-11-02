export const MAX_PROFILE_SIZE = 300 * 1024;

// Replace only the contiguous active_mods array; preserve all other profile data.
export function replaceActiveMods(original, block) {
  if (!/^\uFEFF?SiiNunit\s*\{/.test(original)) {
    throw new Error('Выбери файл profile.sii: формат профиля не распознан.');
  }
  const lines = block
    .replace(/^\uFEFF/, '')
    .replace(/\s+$/, '')
    .split(/\r?\n/);
  const header = /^\s*active_mods:\s*(\d+)\s*$/.exec(lines[0]);
  if (
    !header ||
    Number(header[1]) !== lines.length - 1 ||
    lines
      .slice(1)
      .some((line, index) => !new RegExp(`^\\s*active_mods\\[${index}\\]:\\s*".*"\\s*$`).test(line))
  ) {
    throw new Error('Список модов сборки повреждён. Попробуй позже.');
  }
  const pattern =
    /^[ \t]*active_mods:[ \t]*\d+[ \t]*\r?$(?:\r?\n[ \t]*active_mods\[\d+\]:[^\r\n]*)*/gm;
  const matches = [...original.matchAll(pattern)];
  if (matches.length !== 1) {
    throw new Error('В файле не найден однозначный список active_mods. Выбери profile.sii.');
  }
  const match = matches[0];
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  return (
    original.slice(0, match.index) +
    lines.join(newline) +
    original.slice(match.index + match[0].length)
  );
}
