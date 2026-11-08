import { presetCombosByVersion } from '../builderCatalogs';

// Discover JSON automatically: adding a game version needs no new imports.
const files = import.meta.glob('../../../content/combos/*.json', {
  eager: true,
  import: 'default',
});
export const COMBOS_BY_VERSION = Object.fromEntries([
  ...Object.entries(files).map(([file, records]) => [file.match(/v([\d.]+)\.json$/)[1], records]),
  ...Object.entries(presetCombosByVersion),
]);
export const getCombosByVersion = (version) => COMBOS_BY_VERSION[version] || [];
export const getAllCombos = () => Object.values(COMBOS_BY_VERSION).flat();
