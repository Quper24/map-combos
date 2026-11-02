import { useTranslation } from '../../i18n/Language';
import { Link } from 'react-router-dom';
import { assetUrl } from '../../lib/content';
import { tagUtils } from '../../utils/tags';
import useFavorites from '../hooks/useFavorites';
import Icon from '../ui/Icon';
import ExternalLink from '../ui/ExternalLink';
import s from './ComboCard.module.css';
export default function ComboCard({ combo }) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(combo.id);
  return (
    <article className={s.card}>
      <Link to={`/combos/${combo.id}`} className={s.imageLink} tabIndex={-1} aria-hidden="true">
        <img
          src={assetUrl(combo.preview || combo.image)}
          alt={''}
          loading="lazy"
          width="640"
          height="360"
        />
      </Link>
      <button
        className={`${s.favorite} ${favorite ? s.selected : ''}`}
        aria-label={t(
          `${favorite ? 'Убрать из избранного' : 'Добавить в избранное'}: ${combo.title}`,
        )}
        aria-pressed={favorite}
        onClick={() => toggleFavorite(combo.id)}
      >
        <Icon name="star" size={17} />
      </button>
      <div className={s.body}>
        <div className={s.tags}>
          {combo.tags?.map((tag) => (
            <span
              key={tag}
              className={`badge ${tag === 'boosty' ? 'badge-boosty' : 'badge-green'}`}
              title={t(tagUtils.getDescription(tag))}
            >
              {t(tagUtils.getLabel(tag))}
            </span>
          ))}
        </div>
        <h3>
          <Link to={`/combos/${combo.id}`}>{t(combo.title)}</Link>
        </h3>
        <div className={s.meta}>
          <span>
            {combo.version_game} <span className={s.dot}>/</span> {combo.version}
          </span>
          <span>{combo.date}</span>
        </div>
        <Link className={s.open} to={`/combos/${combo.id}`}>
          {t('Открыть сборку ')}
          <Icon name="arrow" size={17} />
        </Link>
        {combo.boosty && (
          <ExternalLink className={s.boosty} href={combo.boosty}>
            {t('Сборка на Boosty')}
          </ExternalLink>
        )}
      </div>
    </article>
  );
}
