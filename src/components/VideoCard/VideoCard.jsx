import { Link } from 'react-router-dom';
import { GAME_NAMES, VIDEO_CATEGORIES } from '../../lib/content';
import ExternalLink from '../ui/ExternalLink';
import Icon from '../ui/Icon';
import s from './VideoCard.module.css';
export default function VideoCard({ video, showRelations = false }) {
  return (
    <article className={s.card}>
      <div className={s.preview}>
        <img src={video.thumbnail} alt="" loading="lazy" width="480" height="270" />
        <span className={s.play}>
          <Icon name="play" size={24} />
        </span>
        <div className={s.platforms}>
          {Object.entries(video.platforms)
            .filter(([, url]) => url)
            .map(([platform, url]) => (
              <ExternalLink key={platform} href={url} className={s.platform}>
                {platform === 'youtube' ? 'YouTube' : 'Rutube'}
              </ExternalLink>
            ))}
        </div>
      </div>
      <div className={s.body}>
        <div className={s.meta}>
          <span>{GAME_NAMES[video.game] || video.game}</span>
          <span>{VIDEO_CATEGORIES[video.category] || video.category}</span>
        </div>
        <h3>{video.title}</h3>
        {showRelations && video.relatedComboIds.length > 0 && (
          <Link className="text-link" to={`/combos/${video.relatedComboIds[0]}`}>
            Перейти к сборке <Icon name="arrow" size={16} />
          </Link>
        )}
      </div>
    </article>
  );
}
