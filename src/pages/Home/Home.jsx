import { useState, useMemo } from "react";
import { combos } from "../../data/combos";
import ComboCard from "../../components/ComboCard/ComboCard";

import "./home.css";

export default function Home() {
  // Состояние для активных тегов
  const [activeTags, setActiveTags] = useState([]);

  // Извлекаем все уникальные теги из комбо
  const allTags = useMemo(() => {
    const tagsSet = new Set();
    combos.forEach((combo) => {
      combo.tags?.forEach((tag) => tagsSet.add(tag));
    });
    return Array.from(tagsSet);
  }, []);

  // Фильтруем комбо по активным тегам
  const filteredCombos = useMemo(() => {
    if (activeTags.length === 0) {
      return combos;
    }
    return combos.filter((combo) =>
      activeTags.every((tag) => combo.tags?.includes(tag)),
    );
  }, [activeTags]);

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

  // Сортируем комбо: сначала по дате (новые сверху), затем по названию
  const sortedAndFilteredCombos = useMemo(() => {
    return [...filteredCombos].sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);

      if (dateB.getTime() !== dateA.getTime()) {
        return dateB.getTime() - dateA.getTime();
      }

      return a.title.localeCompare(b.title);
    });
  }, [filteredCombos]);

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
  };

  // Получаем иконки для тегов
  const getTagIcon = (tag) => {
    const icons = {
      ets2: "🚛", // Euro Truck Simulator 2
      ats: "🚚", // American Truck Simulator
      convoy: "👥", // Конвой режим
      server: "🖥️", // Наши сервера
      boosty: "💎", // Доступно на Boosty
    };
    return icons[tag] || "🏷️";
  };

  // Получаем название для тега
  const getTagLabel = (tag) => {
    const labels = {
      ets2: "ETS 2",
      ats: "ATS",
      convoy: "Конвой",
      server: "Наши сервера",
      boosty: "Только на Boosty",
    };
    return labels[tag] || tag;
  };

  // Получаем описание для тега (для tooltip)
  const getTagDescription = (tag) => {
    const descriptions = {
      ets2: "Для Euro Truck Simulator 2",
      ats: "Для American Truck Simulator",
      convoy: "Поддержка конвой режима",
      server: "Игра доступна на наших серверах",
      boosty: "Эксклюзивно для подписчиков Boosty",
    };
    return descriptions[tag] || "";
  };

  // Получаем самую свежую дату для отображения
  const latestUpdate = useMemo(() => {
    if (sortedAndFilteredCombos.length === 0) return null;
    const latest = sortedAndFilteredCombos[0];
    return latest.date ? `Последнее обновление: ${latest.date}` : null;
  }, [sortedAndFilteredCombos]);

  return (
    <div className="container">
      <header className="home-header">
        <h1>MAP COMBOS</h1>
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
            <span className="sort-info">(сортировка: сначала новые)</span>
          </h2>

          {activeTags.length > 0 && (
            <button onClick={resetFilters} className="reset-filters-btn">
              ✕ Сбросить фильтры
            </button>
          )}
        </div>

        {/* Теги */}
        <div className="tags-container">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`tag-btn ${activeTags.includes(tag) ? "active" : ""}`}
              title={getTagDescription(tag)}>
              <span className="tag-icon">{getTagIcon(tag)}</span>
              <span className="tag-label">{getTagLabel(tag)}</span>
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
              <span className="stats-label">фильтра</span>
            </span>
          )}

          {/* Статистика по популярным тегам */}
          <span className="stats-item">
            <span className="stats-number">
              {combos.filter((c) => c.tags?.includes("server")).length}
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
            </div>
          </div>

          <div className="info-card boosty-info">
            <div className="info-icon">💎</div>
            <div className="info-content">
              <h4>Boosty эксклюзив</h4>
              <p>Сборки c этим тегом доступны только подписчикам Boosty</p>
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
