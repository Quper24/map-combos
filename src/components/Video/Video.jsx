import "./video.css";

export default function Video({ videoId, title = "Video", className = "" }) {
  return (
    <div className={`video-wrapper ${className}`}>
      <div className="video-frame">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
          allowFullScreen
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          loading="lazy"
          className="youtube-iframe"
        />
        <div className="video-corner video-corner-tl"></div>
        <div className="video-corner video-corner-tr"></div>
        <div className="video-corner video-corner-bl"></div>
        <div className="video-corner video-corner-br"></div>
      </div>
    </div>
  );
}
