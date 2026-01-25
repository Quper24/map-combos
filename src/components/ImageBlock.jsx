export const ImageBlock = ({
  top,
  bottom,
  center = "img/combos/center.jpg",
}) => (
  <div className="image-gallery">
    <div className="gallery-container">
      <div className="gallery-item">
        <img
          src={top}
          alt="Верхняя часть списка модов"
          className="gallery-image"
        />
      </div>
      <div className="gallery-item">
        <img
          src={center}
          alt="Центральная часть списка модов"
          className="gallery-image"
        />
      </div>
      <div className="gallery-item">
        <img
          src={bottom}
          alt="Нижняя часть списка модов"
          className="gallery-image"
        />
      </div>
    </div>
  </div>
);
