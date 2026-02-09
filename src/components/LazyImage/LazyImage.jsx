// Cоздаем компонент LazyImage
// src/components/LazyImage/LazyImage.jsx
import { useState } from "react";
import "./lazyImage.css";

export default function LazyImage({ src, alt, className = "" }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`lazy-image ${className}`}>
      {!isLoaded && !error && (
        <div className="image-skeleton">
          <div className="skeleton-animation"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        className={`${isLoaded ? "loaded" : "loading"} ${error ? "error" : ""}`}
      />
      {error && (
        <div className="image-error">
          <span className="error-icon">⚠️</span>
          <span>Не удалось загрузить</span>
        </div>
      )}
    </div>
  );
}
