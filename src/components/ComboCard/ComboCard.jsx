import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { tagUtils } from "../../utils/tags";
import useFavorites from "../hooks/useFavorites";

import "./comboCard.css";

// Константы для настройки "новизны" сборки
const NEW_PERIOD_DAYS = 3; // Сборка считается новой 3 дня с даты обновления

export default function ComboCard({ combo }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isFav, setIsFav] = useState(isFavorite(combo.id));

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(combo.id);
    setIsFav(!isFav);
  };

  // Проверяем, является ли сборка новой
  const isNew = useMemo(() => {
    if (!combo.date) return false;

    try {
      const parts = combo.date.split(".");
      if (parts.length === 3) {
        let year = parts[2];
        if (year.length === 2) year = "20" + year;

        // Преобразуем дату из формата DD.MM.YYYY
        const updateDate = new Date(`${year}-${parts[1]}-${parts[0]}`);

        // Получаем дату NEW_PERIOD_DAYS давности
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - NEW_PERIOD_DAYS);

        // Сбрасываем часы для точного сравнения дней
        daysAgo.setHours(0, 0, 0, 0);
        updateDate.setHours(0, 0, 0, 0);

        // Сравниваем: если дата обновления больше даты NEW_PERIOD_DAYS давности
        return updateDate > daysAgo;
      }
    } catch (error) {
      console.error("Error checking if new:", error);
    }
    return false;
  }, [combo.date]);

  return (
    <Link to={`/${combo.id}`} className="combo-card">
      <div className="combo-card-image">
        <img
          src={combo.preview || combo.image}
          alt={combo.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={imageLoaded ? "loaded" : ""}
        />

        <button
          className={`favorite-btn ${isFav ? "active" : ""}`}
          onClick={handleFavoriteClick}
          title={isFav ? "Удалить из избранного" : "Добавить в избранное"}>
          {isFav ? "❤️" : "🤍"}
        </button>

        {/* Индикатор "Новинка!" - показываем только 3 дня */}
        {isNew && <div className="new-indicator">НОВОЕ!</div>}

        {/* Бейдж Boosty если есть */}
        {combo.tags?.includes("boosty") && (
          <div
            className="boosty-badge"
            title={tagUtils.getDescription("boosty")}>
            💎 Boosty
          </div>
        )}

        <div className="combo-card-overlay">
          <span className="version-badge">
            v{combo.version_game}-{combo.version}
          </span>
        </div>
      </div>

      <div className="combo-card-content">
        <h3 className="combo-card-title">{combo.title}</h3>

        {/* Теги карточки */}
        {combo.tags && combo.tags.length > 0 && (
          <div className="combo-card-tags">
            {combo.tags.map((tag) => {
              const metadata = tagUtils.getMetadata(tag);
              return (
                <span
                  key={tag}
                  className={`combo-tag tag-${tag}`}
                  title={metadata.description}>
                  <span className="tag-icon">{metadata.icon}</span>
                  <span className="tag-text">{metadata.label}</span>
                </span>
              );
            })}
          </div>
        )}

        <div className="combo-card-meta">
          <span className="version">
            Версия: {combo.version_game}-{combo.version}
          </span>
          {combo.date && (
            <span className="update-date">Обновлено: {combo.date}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
