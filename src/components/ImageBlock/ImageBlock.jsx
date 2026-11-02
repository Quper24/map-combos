import { assetUrl } from '../../lib/content';
import s from './ImageBlock.module.css';
export const ImageBlock = ({ top, bottom, center = 'img/combos/center.jpg' }) => (
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
          aria-label={`${label} порядка модов — открыть в полном размере`}
        >
          <img src={assetUrl(src)} alt={`${label} списка модов`} loading="lazy" decoding="async" />
        </a>
      ))}
  </div>
);
