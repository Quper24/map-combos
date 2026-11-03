import { useTranslation } from '../../i18n/Language';
import { Link } from 'react-router-dom';
import { GAME_NAMES, VIDEO_CATEGORIES, videoGames, formatVideoDate } from '../../lib/content';
import ExternalLink from '../ui/ExternalLink';
import Icon from '../ui/Icon';
import s from './VideoCard.module.css';
export default function VideoCard({ heading = 'h3', video, showRelations = false }) {
  const Heading = heading;
  const { t, language } = useTranslation();
  return (
    <article className={s.card}>
      <div className={s.preview}>
        <img src={video.thumbnail} alt={''} loading="lazy" width="480" height="270" />
        <span className={s.play}>
          <Icon name="play" size={24} />
        </span>
        <div className={s.platforms}>
          {Object.entries(video.platforms)
            .filter(([, url]) => url)
            .map(([platform, url]) => (
              <ExternalLink key={platform} href={url} className={s.platform}>
                {t(platform === 'youtube' ? 'YouTube' : 'Rutube')}
              </ExternalLink>
            ))}
        </div>
      </div>
      <div className={s.body}>
        <div className={s.meta}>
          <span>
            {t(
              videoGames(video)
                .map((game) => GAME_NAMES[game] || game)
                .join(' / '),
            )}
          </span>
          <span>{t(VIDEO_CATEGORIES[video.category] || video.category)}</span>
          {video.publishedAt && (
            <time dateTime={video.publishedAt}>
              {t(formatVideoDate(video.publishedAt, language))}
            </time>
          )}
        </div>
        <Heading className={s.title}>{t(video.title)}</Heading>
        {showRelations && video.relatedComboIds.length > 0 && (
          <Link className="text-link" to={`/combos/${video.relatedComboIds[0]}`}>
            {t('Перейти к сборке ')}
            <Icon name="arrow" size={16} />
          </Link>
        )}
        {showRelations && video.relatedModIds.length > 0 && (
          <Link className="text-link" to={`/mods/${video.relatedModIds[0]}`}>
            {t('Перейти к разработке ')}
            <Icon name="arrow" size={16} />
          </Link>
        )}
      </div>
    </article>
  );
}
