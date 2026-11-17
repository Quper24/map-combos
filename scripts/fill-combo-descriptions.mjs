import fs from 'node:fs';

const files = ['content/combo-builder/ats-1.62.json', 'content/combo-builder/ets2-1.62.json'];
const enPath = 'src/i18n/en.json';
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

function kind(entry) {
  const s = `${entry.id} ${entry.title}`.toLowerCase();
  if (entry.type === 'map' || /map|reforma|promods|coast|beyond|expansion|oregon|county|vermont|alaska|mexssi|dna|great america|eastern/.test(s)) return 'map';
  if (/fix|connection|connector|compatib|patch|sector|garage|road connection/.test(s)) return 'fix';
  if (/traffic|cars|buses|trucks|trailers|traffic/.test(s)) return 'traffic';
  if (/sound|audio|horn|weather|reverb|engine/.test(s)) return 'sound';
  if (/wheel|tire|tyre|paint|livery|logo|billboard|plate|flare|light|flares|gps|dashboard|interior|cabin|accessor|toy/.test(s)) return 'visual';
  return 'mod';
}

function make(entry, game) {
  const title = entry.title;
  const g = game === 'ats' ? 'American Truck Simulator' : 'Euro Truck Simulator 2';
  const k = kind(entry);
  const ru = {
    map: `Карта «${title}» расширяет игровой мир ${g} и добавляет новые территории, дороги или города. Точный состав зависит от версии мода и указанных зависимостей.`,
    fix: `Модификация «${title}» исправляет совместимость или отдельные ошибки в ${g}. Используйте её вместе с указанными в каталоге картами и соблюдайте порядок загрузки.`,
    traffic: `Модификация «${title}» добавляет или изменяет транспорт, автомобили, грузовики, прицепы или дорожный трафик в ${g}.`,
    sound: `Модификация «${title}» изменяет звуки, атмосферу или звуковые эффекты в ${g}, делая соответствующую часть игры разнообразнее.`,
    visual: `Модификация «${title}» добавляет или улучшает визуальные элементы, аксессуары, приборы, освещение или оформление в ${g}.`,
    mod: `Модификация «${title}» добавляет или изменяет игровой контент в ${g}. Подробности зависят от версии и страницы загрузки мода.`
  }[k];
  const enText = {
    map: `The “${title}” map expands the world of ${g} with new areas, roads, or cities. The exact content depends on the mod version and its listed dependencies.`,
    fix: `The “${title}” mod fixes compatibility or specific issues in ${g}. Use it with the maps listed in the catalog and follow the recommended load order.`,
    traffic: `The “${title}” mod adds or changes vehicles, cars, trucks, trailers, or traffic in ${g}.`,
    sound: `The “${title}” mod changes sounds, atmosphere, or sound effects in ${g}, making that part of the game more varied.`,
    visual: `The “${title}” mod adds or improves visual elements, accessories, dashboards, lighting, or styling in ${g}.`,
    mod: `The “${title}” mod adds or changes game content in ${g}. The details depend on the mod version and its download page.`
  }[k];
  return [ru, enText];
}

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const entry of data.entries) {
    if (entry.description?.trim()) continue;
    const [ru, english] = make(entry, data.game);
    entry.description = ru;
    en[ru] = english;
  }
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

fs.writeFileSync(enPath, `${JSON.stringify(en, null, 2)}\n`);
