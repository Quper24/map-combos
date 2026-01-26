import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

import "./comboCard.css";

export default function ComboCard({ combo }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Проверяем, является ли сборка новой
  const isNew = useMemo(() => {
    if (!combo.date) return false;
    try {
      const parts = combo.date.split(".");
      if (parts.length === 3) {
        let year = parts[2];
        if (year.length === 2) year = "20" + year;
        const updateDate = new Date(`${year}-${parts[1]}-${parts[0]}`);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return updateDate > weekAgo;
      }
    } catch (error) {
      console.error("Error checking if new:", error);
    }
    return false;
  }, [combo.date]);

  // Иконки для тегов
  const getTagIcon = (tag) => {
    const icons = {
      ets2: "🚛",
      ats: "🚚",
      convoy: "👥",
      server: "🖥️",
      boosty: "💎",
    };
    return icons[tag] || "🏷️";
  };

  // Названия тегов
  const getTagLabel = (tag) => {
    const labels = {
      ets2: "ETS 2",
      ats: "ATS",
      convoy: "Конвой",
      server: "Сервер",
      boosty: "Boosty",
    };
    return labels[tag] || tag;
  };

  // Описания для тегов (tooltip)
  const getTagDescription = (tag) => {
    const descriptions = {
      ets2: "Для Euro Truck Simulator 2",
      ats: "Для American Truck Simulator",
      convoy: "Поддержка конвой режима",
      server: "Игра на наших серверах",
      boosty: "Эксклюзивно на Boosty",
    };
    return descriptions[tag] || "";
  };

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

        {/* Индикатор "Новинка!" */}
        {isNew && <div className="new-indicator">НОВОЕ!</div>}

        {/* Бейдж Boosty если есть */}
        {combo.tags?.includes("boosty") && (
          <div className="boosty-badge" title="Эксклюзив на Boosty">
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
            {combo.tags.map((tag) => (
              <span
                key={tag}
                className={`combo-tag tag-${tag}`}
                title={getTagDescription(tag)}>
                <span className="tag-icon">{getTagIcon(tag)}</span>
                <span className="tag-text">{getTagLabel(tag)}</span>
              </span>
            ))}
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
