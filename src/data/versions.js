// C:\Quper-projects\map-combos\src\data\versions.js
export const VERSIONS = {
  1.57: {
    id: "1.57",
    label: "1.57",
    status: "legacy", // current, upcoming, legacy
    releaseDate: "2024-01-01",
    default: false,
    description: "Устаревшая версия",
    icon: "📜",
  },
  1.58: {
    id: "1.58",
    label: "1.58",
    status: "current",
    releaseDate: "2024-02-20",
    default: true,
    description: "Текущая стабильная версия",
    icon: "✅",
  },
  // 1.59: {
  //   id: "1.59",
  //   label: "1.59 (устарело)",
  //   status: "upcoming",
  //   releaseDate: "2023-12-01",
  //   default: false,
  //   description: "Устаревшая версия",
  //   icon: "🚀",
  // },
};

export const getCurrentVersion = () => {
  return (
    Object.values(VERSIONS).find((v) => v.status === "current") ||
    VERSIONS["1.57"]
  );
};

export const getDefaultVersion = () => {
  return Object.values(VERSIONS).find((v) => v.default) || VERSIONS["1.57"];
};
