// C:\Quper-projects\map-combos\src\data\versions.js
export const VERSIONS = {
  1.57: {
    id: "1.57",
    label: "1.57",
    status: "legacy", // current, upcoming, legacy
    releaseDate: "2025-11-28",
    default: false,
    description: "Устаревшая версия",
    icon: "📜",
  },
  1.58: {
    id: "1.58",
    label: "1.58",
    status: "legacy", // current, upcoming, legacy
    releaseDate: "2026-02-20",
    default: false,
    description: "Устаревшая версия",
    icon: "📜",
  },
  1.59: {
    id: "1.59",
    label: "1.59",
    status: "current", // current, upcoming, legacy
    releaseDate: "2026-05-12",
    default: true,
    description: "Текущая стабильная версия",
    icon: "✅",
  },
};

export const getCurrentVersion = () => {
  return (
    Object.values(VERSIONS).find((v) => v.status === "current") ||
    VERSIONS["1.59"]
  );
};

export const getDefaultVersion = () => {
  return Object.values(VERSIONS).find((v) => v.default) || VERSIONS["1.59"];
};
