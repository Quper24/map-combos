import { useParams, Navigate } from "react-router-dom";
import { combos } from "../data/combos";
import ComboContent from "../components/ComboContent"; // Импорт
import Video from "../components/Video";
import { ImageBlock } from "../components/ImageBlock";

export default function Combo() {
  const { slug } = useParams();
  const combo = combos.find((c) => c.id === slug);

  if (!combo) return <Navigate to="/" />;

  return (
    <div className="container">
      <h1>
        {combo.title}{" "}
        <strong>
          {combo.version_game}-{combo.version}
        </strong>
      </h1>

      {/* Главное видео */}
      <Video videoId={combo.video} title={combo.title} />

      {/* Используем компонент с общим контентом */}
      <ComboContent table={combo.table} profile={combo.profile} />

      <ImageBlock top={combo.image_top} bottom={combo.image_bottom} />
    </div>
  );
}
