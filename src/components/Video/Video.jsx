import { useTranslation } from '../../i18n/Language';
import { useState } from 'react';
import Icon from '../ui/Icon';
import ExternalLink from '../ui/ExternalLink';
import s from './Video.module.css';
export default function Video({ videoId, title = 'Видео', thumbnail, platforms }) {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const links = platforms || {
    youtube: `https://www.youtube.com/watch?v=${videoId}`,
  };
  return (
    <div className={s.video}>
      <div className={s.frame}>
        {playing && videoId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={t(title)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : videoId ? (
          <button
            className={s.preview}
            onClick={() => setPlaying(true)}
            aria-label={t(`Воспроизвести: ${title}`)}
          >
            <img
              src={thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt={''}
              loading="lazy"
              width="480"
              height="270"
            />
            <span>
              <Icon name="play" size={24} />
            </span>
          </button>
        ) : (
          <a
            className={s.preview}
            href={links.rutube}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(`Смотреть на Rutube: ${title}`)}
          >
            <img src={thumbnail} alt={''} loading="lazy" width="480" height="270" />
            <span>
              <Icon name="play" size={24} />
            </span>
          </a>
        )}
      </div>
      <div className={s.links}>
        {Object.entries(links)
          .filter(([, url]) => url)
          .map(([platform, url]) => (
            <ExternalLink key={platform} href={url} className="text-link">
              {t(platform === 'youtube' ? 'YouTube' : 'Rutube')}
            </ExternalLink>
          ))}
      </div>
    </div>
  );
}
