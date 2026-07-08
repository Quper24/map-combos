// C:\Quper-projects\map-combos\src\pages\Combo\Combo.jsx
import { useParams, Navigate } from "react-router-dom";
import { getAllCombos } from "../../data";
import ComboContent from "../../components/ComboContent/ComboContent";
import Video from "../../components/Video/Video";
import { ImageBlock } from "../../components/ImageBlock/ImageBlock";

import "./combo.css";

export default function Combo() {
  const { slug } = useParams();

  // Получаем все комбо из всех версий
  const allCombos = getAllCombos();
  const combo = allCombos.find((c) => c.id === slug);

  if (!combo) return <Navigate to="/" />;

  // Форматируем дату для отображения
  const formatDate = (dateStr) => {
    const parts = dateStr.split(".");
    if (parts.length === 3) {
      return `${parts[0]}.${parts[1]}.20${parts[2]}`;
    }
    return dateStr;
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>
          {combo.title}{" "}
          <strong>
            {combo.version_game}-{combo.version}
          </strong>
        </h1>

        {combo.date && (
          <div className="update-info">
            <span className="update-badge">🔄 ОБНОВЛЕНО</span>

            <span className="update-date">{formatDate(combo.date)}</span>

            <span className="version-badge">
              Для версии {combo.version_game}
            </span>
          </div>
        )}
      </div>

      <div className="combo-layout">
        <div className="combo-content-scroll">
          <ComboContent combo={combo} />
        </div>

        <div className="combo-images-scroll">
          <ImageBlock
            top={combo.image_top}
            center={combo.image_center}
            bottom={combo.image_bottom}
          />
        </div>
      </div>
    </div>
  );
}
