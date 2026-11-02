import { useTranslation } from '../../i18n/Language';
import { assetUrl } from '../../lib/content';
import s from './ImageBlock.module.css';
export const ImageBlock = ({ top, bottom, center = 'img/combos/center.jpg' }) => {
  const { t } = useTranslation();
  return (
    <div className={s.gallery}>
      {[
        [top, 'Верхняя часть'],
        [center, 'Центральная часть'],
        [bottom, 'Нижняя часть'],
      ]
        .filter(([src]) => src)
        .map(([src, label]) => (
          <a
            key={label}
            href={assetUrl(src)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t(`${label} порядка модов — открыть в полном размере`)}
          >
            <img
              src={assetUrl(src)}
              alt={t(`${label} списка модов`)}
              loading="lazy"
              decoding="async"
            />
          </a>
        ))}
    </div>
  );
};
