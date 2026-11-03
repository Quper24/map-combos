import { useTranslation } from '../../i18n/Language';
import { Link, useParams } from 'react-router-dom';
import { mods } from '../../lib/mods';
import { GAME_NAMES, videos } from '../../lib/content';
import VideoCard from '../../components/VideoCard/VideoCard';
import ExternalLink from '../../components/ui/ExternalLink';
import s from './Mods.module.css';
export default function Mod() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const mod = mods.find((item) => item.id === slug);
  if (!mod)
    return (
      <div className="container page empty-state">
        <h1>{t('Разработка не найдена')}</h1>
        <Link to="/mods" className="button">
          {t('К модам и плагинам')}
        </Link>
      </div>
    );
  const related = videos.filter(
    (video) => mod.videoIds.includes(video.id) || video.relatedModIds.includes(mod.id),
  );
  return (
    <div className="container page">
      <nav className="breadcrumb" aria-label={t('Хлебные крошки')}>
        <Link to="/">{t('Главная')}</Link>
        <span>/</span>
        <Link to="/mods">{t('Моды и плагины')}</Link>
        <span>/</span>
        <span>{t(mod.title)}</span>
      </nav>
      <div className={s.detailHero}>
        <div>
          <span className="eyebrow">{t('Разработано Quper')}</span>
          <h1>{t(mod.title)}</h1>
          <p>{t(mod.summary)}</p>
          <div className={s.tags}>
            {mod.games.map((id) => (
              <span key={id} className="badge badge-green">
                {t(GAME_NAMES[id] || id)}
              </span>
            ))}
            {mod.version && (
              <span className="badge">
                {t('Версия ')}
                {mod.version}
              </span>
            )}
            {mod.gameVersions?.map((version) => (
              <span className="badge" key={version}>
                {t('Игра ')}
                {t(version)}
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
                {t(link.label)}
              </ExternalLink>
            ))}
          </div>
        </div>
        <img
          className={s.detailCover}
          src={mod.cover}
          alt={t(mod.coverAlt || mod.title)}
          width="640"
          height="360"
        />
      </div>
      {mod.notice && <aside className={s.notice}>{t(mod.notice)}</aside>}
      <section className={`section prose ${s.description}`}>
        <h2>{t(mod.type === 'plugin' ? 'О плагине' : 'О модификации')}</h2>
        {mod.description.map((text, index) => (
          <p key={index}>{t(text)}</p>
        ))}
        {mod.compatibility?.length > 0 && (
          <>
            <h2>{t('Совместимость')}</h2>
            <ul>
              {mod.compatibility.map((build) => (
                <li key={build}>{t(build)}</li>
              ))}
            </ul>
          </>
        )}
        {mod.features.length > 0 && (
          <>
            <h2>{t(mod.type === 'plugin' ? 'Возможности плагина' : 'Что меняется в игре')}</h2>
            <ul>
              {mod.features.map((feature) => (
                <li key={feature}>{t(feature)}</li>
              ))}
            </ul>
          </>
        )}
        {mod.installation && (
          <>
            <h2>{t('Установка')}</h2>
            {mod.installation.map((text, index) => (
              <p key={index}>{t(text)}</p>
            ))}
          </>
        )}
      </section>
      {mod.changelog?.length > 0 && (
        <details className={`section prose ${s.changelog}`}>
          <summary>{t('История изменений')}</summary>
          {mod.changelog.map(({ version, title, changes }) => (
            <div key={version}>
              <h3>{title ? `${version} — ${t(title)}` : version}</h3>
              <ul>
                {changes.map((change) => (
                  <li key={change}>{t(change)}</li>
                ))}
              </ul>
            </div>
          ))}
        </details>
      )}
      {mod.images.length > 0 && (
        <section className="section">
          <h2>{t('Скриншоты')}</h2>
          <div className="card-grid">
            {mod.images.map((image, index) => (
              <a href={image.src || image} key={index} target="_blank" rel="noopener noreferrer">
                <img
                  src={image.src || image}
                  alt={t(image.alt || `${mod.title} — скриншот ${index + 1}`)}
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="section">
          <h2>{t('Видео о разработке')}</h2>
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
