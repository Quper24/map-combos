// C:\Quper-projects\map-combos\src\data\combos\index.js
import { combos_v1_57 } from "./v1.57";
import { combos_v1_58 } from "./v1.58";
import { combos_v1_59 } from "./v1.59";
import { combos_v1_60 } from "./v1.60";

export const COMBOS_BY_VERSION = {
  "1.57": combos_v1_57,
  "1.58": combos_v1_58,
  "1.59": combos_v1_59,
  "1.60": combos_v1_60,
};

// Для обратной совместимости
export const getCombosByVersion = (version) => {
  return COMBOS_BY_VERSION[version] || [];
};

export const getAllCombos = () => {
  return Object.values(COMBOS_BY_VERSION).flat();
};
