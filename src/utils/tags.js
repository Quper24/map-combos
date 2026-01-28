// ===== TAGS UTILITY =====
// Централизованное управление тегами, их метаданными и стилями

export const TAG_TYPES = {
  ETS2: "ets2",
  ATS: "ats",
  CONVOY: "convoy",
  SERVER: "server",
  BOOSTY: "boosty",
};

// Метаданные тегов
export const TAG_METADATA = {
  [TAG_TYPES.ETS2]: {
    label: "ETS 2",
    icon: "🚛",
    description: "Для Euro Truck Simulator 2",
    color: "#4da3ff",
    bgColor: "rgba(0, 102, 204, 0.1)",
    borderColor: "rgba(0, 102, 204, 0.3)",
  },
  [TAG_TYPES.ATS]: {
    label: "ATS",
    icon: "🚚",
    description: "Для American Truck Simulator",
    color: "#ff6b6b",
    bgColor: "rgba(220, 53, 69, 0.1)",
    borderColor: "rgba(220, 53, 69, 0.3)",
  },
  [TAG_TYPES.CONVOY]: {
    label: "Конвой",
    icon: "👥",
    description: "Поддержка конвой режима",
    color: "#34a853",
    bgColor: "rgba(40, 167, 69, 0.1)",
    borderColor: "rgba(40, 167, 69, 0.3)",
  },
  [TAG_TYPES.SERVER]: {
    label: "Наши сервера",
    icon: "🖥️",
    description: "Игра доступна на наших серверах",
    color: "#673ab7",
    bgColor: "rgba(103, 58, 183, 0.1)",
    borderColor: "rgba(103, 58, 183, 0.3)",
  },
  [TAG_TYPES.BOOSTY]: {
    label: "Только на Boosty",
    icon: "💎",
    description: "Эксклюзивно для подписчиков Boosty",
    color: "#f44336",
    bgColor: "rgba(244, 67, 54, 0.1)",
    borderColor: "rgba(244, 67, 54, 0.3)",
  },
};

// Утилиты для работы с тегами
export const tagUtils = {
  // Получить метаданные тега
  getMetadata: (tag) => {
    return (
      TAG_METADATA[tag] || {
        label: tag,
        icon: "🏷️",
        description: "",
        color: "#aaa",
        bgColor: "rgba(255, 255, 255, 0.05)",
        borderColor: "rgba(255, 255, 255, 0.1)",
      }
    );
  },

  // Получить иконку тега
  getIcon: (tag) => {
    return tagUtils.getMetadata(tag).icon;
  },

  // Получить название тега
  getLabel: (tag) => {
    return tagUtils.getMetadata(tag).label;
  },

  // Получить описание тега
  getDescription: (tag) => {
    return tagUtils.getMetadata(tag).description;
  },

  // Получить цвет тега
  getColor: (tag) => {
    return tagUtils.getMetadata(tag).color;
  },

  // Получить CSS класс для тега
  getCssClass: (tag) => {
    return `tag-${tag}`;
  },

  // Получить все доступные теги
  getAllTags: () => {
    return Object.keys(TAG_METADATA);
  },

  // Извлечь уникальные теги из массива комбо
  extractUniqueTags: (combos) => {
    const tagsSet = new Set();
    combos.forEach((combo) => {
      combo.tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  },
};

// Для обратной совместимости
export default tagUtils;
