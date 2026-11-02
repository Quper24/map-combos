import { Link, useParams } from 'react-router-dom';
import { mods } from '../../lib/mods';
import { GAME_NAMES, videos } from '../../lib/content';
import VideoCard from '../../components/VideoCard/VideoCard';
import ExternalLink from '../../components/ui/ExternalLink';
import s from './Mods.module.css';
export default function Mod() {
  const { slug } = useParams();
  const mod = mods.find((item) => item.id === slug);
  if (!mod)
    return (
      <div className="container page empty-state">
        <h1>Разработка не найдена</h1>
        <Link to="/mods" className="button">
          К модам и плагинам
        </Link>
      </div>
    );
  const related = videos.filter(
    (video) => mod.videoIds.includes(video.id) || video.relatedModIds.includes(mod.id),
  );
  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label="Хлебные крошки">
        <Link to="/">Главная</Link>
        <span>/</span>
        <Link to="/mods">Моды и плагины</Link>
        <span>/</span>
        <span>{mod.title}</span>
      </nav>
      <div className={s.detailHero}>
        <div>
          <span className="eyebrow">Разработано Quper</span>
          <h1>{mod.title}</h1>
          <p>{mod.summary}</p>
          <div className={s.tags}>
            {mod.games.map((id) => (
              <span key={id} className="badge badge-green">
                {GAME_NAMES[id] || id}
              </span>
            ))}
            {mod.version && <span className="badge">Версия {mod.version}</span>}
            {mod.gameVersions?.map((version) => (
              <span className="badge" key={version}>
                Игра {version}
              </span>
            ))}
          </div>
          <div className="actions">
            {mod.links.map((link, index) => (
              <ExternalLink
                key={link.platform}
                href={link.url}
                className={`button ${index ? 'button-secondary' : ''}`}
              >
                {link.label}
              </ExternalLink>
            ))}
          </div>
        </div>
        <img
          className={s.detailCover}
          src={mod.cover}
          alt={mod.coverAlt || mod.title}
          width="640"
          height="360"
        />
      </div>
      {mod.notice && <aside className={s.notice}>{mod.notice}</aside>}
      <section className={`section prose ${s.description}`}>
        <h2>{mod.type === 'plugin' ? 'О плагине' : 'О модификации'}</h2>
        {mod.description.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
        {mod.features.length > 0 && (
          <>
            <h2>{mod.type === 'plugin' ? 'Возможности плагина' : 'Что меняется в игре'}</h2>
            <ul>
              {mod.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </>
        )}
        {mod.installation && (
          <>
            <h2>Установка</h2>
            {mod.installation.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </>
        )}
      </section>
      {mod.images.length > 0 && (
        <section className="section">
          <h2>Скриншоты</h2>
          <div className="card-grid">
            {mod.images.map((image, index) => (
              <a href={image.src || image} key={index} target="_blank" rel="noopener noreferrer">
                <img
                  src={image.src || image}
                  alt={image.alt || `${mod.title} — скриншот ${index + 1}`}
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="section">
          <h2>Видео о разработке</h2>
          <div className="card-grid">
            {related.map((video) => (
              <VideoCard video={video} key={video.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
