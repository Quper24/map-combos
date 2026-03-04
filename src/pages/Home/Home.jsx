import { useState, useMemo, useEffect } from "react";
import { COMBOS_BY_VERSION, VERSIONS, getCurrentVersion } from "../../data";
import ComboCard from "../../components/ComboCard/ComboCard";
import { tagUtils } from "../../utils/tags";

import "./home.css";

export default function Home({ selectedVersion, onVersionChange }) {
  const [activeTags, setActiveTags] = useState([]);
  const [sortByDate, setSortByDate] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Получаем комбо для выбранной версии
  const currentCombos = useMemo(() => {
    return COMBOS_BY_VERSION[selectedVersion] || [];
  }, [selectedVersion]);

  // Извлекаем все уникальные теги из комбо текущей версии
  const allTags = useMemo(() => {
    return tagUtils.extractUniqueTags(currentCombos);
  }, [currentCombos]);

  // Фильтруем комбо
  const filteredCombos = useMemo(() => {
    let filtered = currentCombos;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (combo) =>
          combo.title.toLowerCase().includes(query) ||
          combo.id.toLowerCase().includes(query),
      );
    }

    if (activeTags.length > 0) {
      filtered = filtered.filter((combo) =>
        activeTags.every((tag) => combo.tags?.includes(tag)),
      );
    }

    return filtered;
  }, [currentCombos, activeTags, searchQuery]);

  // Сохраняем выбранную версию в localStorage
  useEffect(() => {
    localStorage.setItem("mapCombos_selectedVersion", selectedVersion);
  }, [selectedVersion]);

  // Функция для преобразования даты
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);
    try {
      const parts = dateStr.split(".");
      if (parts.length === 3) {
        let year = parts[2];
        if (year.length === 2) year = "20" + year;
        return new Date(`${year}-${parts[1]}-${parts[0]}`);
      }
    } catch (error) {
      console.error("Error parsing date:", dateStr, error);
    }
    return new Date(0);
  };

  // Сортируем комбо
  const sortedAndFilteredCombos = useMemo(() => {
    if (!sortByDate) return filteredCombos;
    return [...filteredCombos].sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }
      return a.title.localeCompare(b.title);
    });
  }, [filteredCombos, sortByDate]);

  // Функция для переключения тега
  const toggleTag = (tag) => {
    setActiveTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Сброс всех фильтров
  const resetFilters = () => {
    setActiveTags([]);
    setSearchQuery("");
  };

  // Получаем самую свежую дату
  const latestUpdate = useMemo(() => {
    if (!sortByDate || sortedAndFilteredCombos.length === 0) return null;
    const latest = sortedAndFilteredCombos[0];
    return latest.date ? `Последнее обновление: ${latest.date}` : null;
  }, [sortedAndFilteredCombos, sortByDate]);

  // Проверяем, есть ли активные фильтры
  const hasActiveFilters = activeTags.length > 0 || searchQuery;

  // Получаем информацию о текущей версии
  const versionInfo = VERSIONS[selectedVersion];

  return (
    <div className="container">
      <header className="home-header">
        <div className="version-selector-wrapper">
          <h1>MAP COMBOS</h1>

          {/* Селектор версий */}
          <div className="version-selector">
            <div className="version-dropdown">
              <button className="version-dropdown-btn">
                <span className="version-icon">
                  {VERSIONS[selectedVersion]?.icon || "✅"}
                </span>
                <span className="version-label">
                  Версия {VERSIONS[selectedVersion]?.label || selectedVersion}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>
              <div className="version-dropdown-menu">
                {Object.entries(VERSIONS)
                  .sort(([aKey], [bKey]) => bKey.localeCompare(aKey))
                  .map(([versionId, versionData]) => (
                    <button
                      key={versionId}
                      onClick={() => onVersionChange(versionId)}
                      className={`version-option ${
                        selectedVersion === versionId ? "active" : ""
                      } ${versionData.status}`}
                      title={versionData.description}>
                      <span className="version-option-icon">
                        {versionData.icon}
                      </span>
                      <span className="version-option-label">
                        {versionData.label}
                        {versionData.status === "current" && (
                          <span className="current-badge">Текущая</span>
                        )}
                      </span>
                      {selectedVersion === versionId && (
                        <span className="version-check">✓</span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <p className="home-subtitle">Сборки карт для Truck Simulator</p>

        {latestUpdate && (
          <div className="latest-update-badge">
            <span className="update-icon">🔄</span>
            {latestUpdate}
          </div>
        )}
      </header>

      {/* Панель фильтров */}
      <div className="filters-panel">
        <div className="filters-header">
          <h2 className="filters-title">
            <span className="filter-icon">🔍</span>
            Фильтры
            <span className="sort-info">
              {sortByDate
                ? "(сортировка: сначала новые)"
                : "(исходный порядок)"}
            </span>
          </h2>

          <div className="filters-controls">
            <button
              onClick={() => setSortByDate(!sortByDate)}
              className={`sort-date-btn ${sortByDate ? "active" : ""}`}
              title={
                sortByDate
                  ? "Отключить сортировку по дате"
                  : "Включить сортировку по дате"
              }>
              <span className="sort-icon">{sortByDate ? "📅✓" : "📅"}</span>
              {sortByDate ? "Сортировка по дате" : "Сортировать по дате"}
            </button>

            {hasActiveFilters && (
              <button onClick={resetFilters} className="reset-filters-btn">
                ✕ Сбросить все фильтры
              </button>
            )}
          </div>
        </div>

        {/* Поле поиска */}
        <div className="search-box-wrapper">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Поиск по названию сборки..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="clear-search"
                title="Очистить поиск">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Теги */}
        <div className="tags-container">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`tag-btn ${activeTags.includes(tag) ? "active" : ""}`}
              title={tagUtils.getDescription(tag)}>
              <span className="tag-icon">{tagUtils.getIcon(tag)}</span>
              <span className="tag-label">{tagUtils.getLabel(tag)}</span>
              {activeTags.includes(tag) && <span className="tag-count">✓</span>}
            </button>
          ))}
        </div>

        {/* Статистика */}
        <div className="filters-stats">
          <span className="stats-item">
            <span className="stats-number">
              {sortedAndFilteredCombos.length}
            </span>
            <span className="stats-label">сборок</span>
          </span>

          {activeTags.length > 0 && (
            <span className="stats-item">
              <span className="stats-number">{activeTags.length}</span>
              <span className="stats-label">тега(ов)</span>
            </span>
          )}

          {searchQuery && (
            <span className="stats-item">
              <span className="stats-icon">🔍</span>
              <span className="stats-label">поиск: "{searchQuery}"</span>
            </span>
          )}

          {/* Статистика по популярным тегам */}
          <span className="stats-item">
            <span className="stats-number">
              {currentCombos.filter((c) => c.tags?.includes("server")).length}
            </span>
            <span className="stats-label">с серверами</span>
          </span>
        </div>
      </div>

      {/* Сетка комбо */}
      <div className="combos-grid">
        {sortedAndFilteredCombos.length > 0 ? (
          sortedAndFilteredCombos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))
        ) : (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>Ничего не найдено</h3>
            <p>Попробуйте изменить фильтры</p>
            <button onClick={resetFilters} className="reset-filters-btn large">
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>

      <div className="home-info">
        <div className="info-grid">
          <div className="info-card server-info">
            <div className="info-icon">🖥️</div>
            <div className="info-content">
              <h4>Наши сервера</h4>
              <p>Сборки с этим тегом работают на наших серверах</p>
              <button
                onClick={() => toggleTag("server")}
                className="info-action-btn">
                {activeTags.includes("server") ? "✓ Показаны" : "Показать все"}
              </button>
            </div>
          </div>

          <div className="info-card version-info">
            <div className="info-icon">🔄</div>
            <div className="info-content">
              <h4>Версия {versionInfo.label}</h4>
              <p>{versionInfo.description}</p>
              {versionInfo.status === "legacy" && (
                <p className="legacy-warning">
                  ⚠️ Это устаревшая версия, рекомендуется использовать{" "}
                  {getCurrentVersion().label}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
