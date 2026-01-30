import { useParams, Navigate } from "react-router-dom";
import { combos } from "../../data/combos";
import ComboContent from "../../components/ComboContent/ComboContent";
import Video from "../../components/Video/Video";
import { ImageBlock } from "../../components/ImageBlock/ImageBlock";

export default function Combo() {
  const { slug } = useParams();
  const combo = combos.find((c) => c.id === slug);

  if (!combo) return <Navigate to="/" />;

  // Форматируем дату для отображения
  const formatDate = (dateStr) => {
    // Если дата в формате "25.01.26"
    const parts = dateStr.split(".");
    if (parts.length === 3) {
      return `${parts[0]}.${parts[1]}.20${parts[2]}`; // 25.01.2026
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
            <span className="update-badge">🔄 ОБНОВЛЕНО </span>
            <span className="update-date">{formatDate(combo.date)}</span>
          </div>
        )}
      </div>

      {combo.video && <Video videoId={combo.video} title={combo.title} />}

      <ComboContent table={combo.table} profile={combo.profile} />

      <ImageBlock
        top={combo.image_top}
        center={combo.image_center}
        bottom={combo.image_bottom}
      />
    </div>
  );
}
