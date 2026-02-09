// C:\Quper-projects\map-combos\src\data\versions.js
export const VERSIONS = {
  1.57: {
    id: "1.57",
    label: "1.57",
    status: "current", // current, upcoming, legacy
    releaseDate: "2024-01-01",
    default: true,
    description: "Текущая стабильная версия",
    icon: "✅",
  },
  1.58: {
    id: "1.58",
    label: "1.58 (скоро)",
    status: "upcoming",
    releaseDate: "2024-02-20",
    default: false,
    description: "Скоро выйдет",
    icon: "🚀",
  },
  // 1.56: {
  //   id: "1.56",
  //   label: "1.56 (устарело)",
  //   status: "legacy",
  //   releaseDate: "2023-12-01",
  //   default: false,
  //   description: "Устаревшая версия",
  //   icon: "📜",
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
