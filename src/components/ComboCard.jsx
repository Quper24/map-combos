import { useState } from "react";
import { Link } from "react-router-dom";

export default function ComboCard({ combo }) {
  const [imageLoaded, setImageLoaded] = useState(false);

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
        <div className="combo-card-overlay">
          <span className="version-badge">
            v{combo.version_game}-{combo.version}
          </span>
        </div>
      </div>
      <div className="combo-card-content">
        <h3 className="combo-card-title">{combo.title}</h3>
        <div className="combo-card-meta">
          <span className="version">
            Версия: {combo.version_game}-{combo.version}
          </span>
        </div>
      </div>
    </Link>
  );
}
