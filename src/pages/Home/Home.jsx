import { useState, useMemo } from "react";
import { combos } from "../../data/combos";
import ComboCard from "../../components/ComboCard/ComboCard";
import { tagUtils } from "../../utils/tags"; // Импортируем утилиты тегов

import "./home.css";

export default function Home() {
  // Состояние для активных тегов
  const [activeTags, setActiveTags] = useState([]);
  // Состояние для сортировки по дате
  const [sortByDate, setSortByDate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Извлекаем все уникальные теги из комбо
  const allTags = useMemo(() => {
    return tagUtils.extractUniqueTags(combos);
  }, []);

  // Фильтруем комбо по активным тегам и поиску
  const filteredCombos = useMemo(() => {
    let filtered = combos;

    // Поиск по названию
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (combo) =>
          combo.title.toLowerCase().includes(query) ||
          combo.id.toLowerCase().includes(query),
      );
    }

    // Фильтр по тегам (AND логика - все выбранные теги должны быть)
    if (activeTags.length > 0) {
      filtered = filtered.filter((combo) =>
        activeTags.every((tag) => combo.tags?.includes(tag)),
      );
    }

    return filtered;
  }, [activeTags, searchQuery]);

  // Функция для преобразования даты из формата "DD.MM.YY" в Date
  const parseDate = (dateStr) => {
    if (!dateStr) return new Date(0);

    try {
      const parts = dateStr.split(".");
      if (parts.length === 3) {
        let year = parts[2];
        if (year.length === 2) {
          year = "20" + year;
        }
        return new Date(`${year}-${parts[1]}-${parts[0]}`);
      }
    } catch (error) {
      console.error("Error parsing date:", dateStr, error);
    }

    return new Date(0);
  };

  // Сортируем комбо: по дате только если включена сортировка
  const sortedAndFilteredCombos = useMemo(() => {
    if (!sortByDate) {
      // Если сортировка отключена, сохраняем исходный порядок из данных
      return filteredCombos;
    }

    // Если сортировка включена, сортируем по дате (новые сверху)
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
    // setSortByDate(false); // опционально, если хотите сбрасывать и сортировку
  };

  // Получаем самую свежую дату для отображения (только когда сортировка включена)
  const latestUpdate = useMemo(() => {
    if (!sortByDate || sortedAndFilteredCombos.length === 0) return null;
    const latest = sortedAndFilteredCombos[0];
    return latest.date ? `Последнее обновление: ${latest.date}` : null;
  }, [sortedAndFilteredCombos, sortByDate]);

  // Проверяем, есть ли активные фильтры
  const hasActiveFilters = activeTags.length > 0 || searchQuery;

  return (
    <div className="container">
      <header className="home-header">
        <h1>MAP COMBOS 1.57</h1>
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
            {/* Кнопка сортировки по дате */}
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
              {combos.filter((c) => c.tags?.includes("server")).length}
            </span>
            <span className="stats-label">с серверами</span>
          </span>

          <span className="stats-item">
            <span className="stats-number">
              {combos.filter((c) => c.tags?.includes("boosty")).length}
            </span>
            <span className="stats-label">только Boosty</span>
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

          <div className="info-card boosty-info">
            <div className="info-icon">💎</div>
            <div className="info-content">
              <h4>Boosty эксклюзив</h4>
              <p>Сборки c этим тегом доступны только подписчикам Boosty</p>
              <button
                onClick={() => toggleTag("boosty")}
                className="info-action-btn">
                {activeTags.includes("boosty") ? "✓ Показаны" : "Показать все"}
              </button>
              <a
                href="https://boosty.to/qupersimulator"
                target="_blank"
                rel="noopener noreferrer"
                className="boosty-link">
                Подписаться →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
