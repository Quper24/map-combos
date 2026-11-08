import { useTranslation } from '../../i18n/Language';
import { Link } from 'react-router-dom';
import useCurrentCombos from '../../lib/currentCombos';
import site from '../../../content/site.json';
import ComboCard from '../../components/ComboCard/ComboCard';
import VideoCard from '../../components/VideoCard/VideoCard';
import Icon from '../../components/ui/Icon';
import ExternalLink from '../../components/ui/ExternalLink';
import { assetUrl, dateValue, videos } from '../../lib/content';
import s from './Home.module.css';
const directions = [
  {
    to: '/combos',
    number: '01',
    icon: 'map',
    title: 'Сборки карт',
    subtitle: 'Больше дорог в ETS2 и ATS',
    text: 'Порядок карт, ссылки и готовые профили для твоего следующего путешествия.',
    label: 'Выбрать сборку',
  },
  {
    to: '/mods',
    number: '02',
    icon: 'grid',
    title: 'Моды и плагины',
    subtitle: 'Больше возможностей',
    text: 'Собственные моды и плагины, которые делают игру интереснее.',
    label: 'Смотреть разработки',
  },
  {
    to: '/vtc',
    number: '03',
    icon: 'truck',
    title: 'Наша VTC',
    subtitle: 'Больше, чем рейсы',
    text: 'Наша VTC, совместные конвои и люди, с которыми по пути.',
    label: 'Познакомиться с VTC',
  },
];
export default function Home() {
  const { t } = useTranslation();
  const boosty = site.socialLinks.find((link) => link.platform === 'boosty');
  const currentCombos = useCurrentCombos();
  const featured =
    currentCombos.find((combo) => combo.id.startsWith('quper-map-')) || currentCombos[0];
  const latest = [...currentCombos]
    .sort((a, b) => dateValue(b.date) - dateValue(a.date))
    .slice(0, 3);
  return (
    <div className="container">
      <section className={s.hero}>
        <div className={s.heroCopy}>
          <span className="eyebrow">{t('Сборки карт / ETS2 & ATS')}</span>
          <h1>
            {t('Весь мир')}
            <br />
            {t('у наших ')}
            <span>{t('колёс.')}</span>
          </h1>
          <p>
            {t(
              'Сборки карт для ETS2 и ATS: новые маршруты, порядок модов и всё необходимое для установки.',
            )}
          </p>
          <div className="actions">
            <Link to="/combos" className="button">
              {t('Выбрать сборку карт ')}
              <Icon name="arrow" size={18} />
            </Link>
            {boosty && (
              <ExternalLink href={boosty.url} className="button button-boosty">
                {t('Сборки на Boosty')}
              </ExternalLink>
            )}
          </div>
          <div className={s.heroNote}>
            <span />
            {t(' Карты. Моды. Конвои. Одна любовь к дороге.')}
          </div>
        </div>
        {featured ? (
          <Link to={`/combos/${featured.id}`} className={s.featured}>
            <div className={s.featuredImage}>
              <img
                src={assetUrl(featured.preview)}
                width="960"
                height="540"
                alt={t(featured.title)}
                fetchPriority="high"
              />
            </div>
            <div className={s.featuredBottom}>
              <div>
                <span className={s.smallLabel}>
                  {t('Сборка карт')} · {featured.tags.includes('ats') ? 'ATS' : 'ETS2'}{' '}
                  {featured.version_game}
                </span>
                <h2>{t(featured.title)}</h2>
              </div>
              <span className={s.featuredArrow}>
                <Icon name="arrow" />
              </span>
            </div>
          </Link>
        ) : (
          <div className={s.featured} aria-busy="true">
            <div className={s.featuredImage} />
            <div className={s.featuredBottom}>{t('Загружаем сборки…')}</div>
          </div>
        )}
      </section>
      <section className={s.directions} aria-label={t('Разделы проекта')}>
        {directions.map((item) => (
          <Link className={s.direction} key={item.to} to={item.to}>
            <div className={s.directionTop}>
              <Icon name={item.icon} size={25} />
              <span>{item.number}</span>
            </div>
            <h2>{t(item.title)}</h2>
            <span className={s.directionSubtitle}>{t(item.subtitle)}</span>
            <p>{t(item.text)}</p>
            <span className={s.directionLink}>
              {t(item.label)}
              <Icon name="arrow" size={17} />
            </span>
          </Link>
        ))}
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('Выбирай свой маршрут')}</span>
            <h2>{t('Актуальные сборки карт')}</h2>
            <p>{t('Порядок карт, ссылки и инструкции — в одном месте.')}</p>
          </div>
          <Link to="/combos" className="text-link">
            {t('Все сборки ')}
            <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="card-grid">
          {latest.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      </section>
      {boosty && (
        <section className={s.boostyBanner} aria-label={t('Сборки на Boosty')}>
          <div>
            <span className="eyebrow">{t('Поддержи проект — открой больше')}</span>
            <h2>{t('Сборки одним архивом — на Boosty')}</h2>
            <p>
              {t(
                'Ранний доступ к сборкам и скачивание одним архивом. Твоя подписка помогает развивать Quper Simulator.',
              )}
            </p>
          </div>
          <ExternalLink href={boosty.url} className="button button-boosty">
            {t('Перейти на Boosty')}
          </ExternalLink>
        </section>
      )}
      <section className={s.vtcBanner}>
        <div className={s.vtcIdentity}>
          <img
            src="/img/logo-280.jpg"
            loading="lazy"
            width="140"
            height="140"
            alt={t('Логотип VTC Quper Simulator')}
          />
          <span>VIRTUAL TRUCKING COMPANY</span>
        </div>
        <div className={s.vtcCopy}>
          <span className="eyebrow">{t('Хорошая дорога начинается с компании')}</span>
          <h2>{t('Вместе интереснее.')}</h2>
          <p>
            {t(
              'Без обязательных пробегов, перекрасок и строгих графиков. Только удовольствие от дороги и общения.',
            )}
          </p>
          <Link className="text-link" to="/vtc">
            {t('Присоединиться к Quper Simulator ')}
            <Icon name="arrow" size={18} />
          </Link>
        </div>
        <span className={s.roadMark} aria-hidden="true" />
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('По ту сторону руля')}</span>
            <h2>{t('Смотри. Вдохновляйся. Поехали.')}</h2>
          </div>
          <Link className="text-link" to="/videos">
            {t('Все видео ')}
            <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="card-grid">
          {videos.slice(0, 3).map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>
      <section className={s.socialSection}>
        <div>
          <span className="eyebrow">{t('Остаёмся на связи')}</span>
          <h2>{t('Встречаемся не только в игре.')}</h2>
          <p>{t('Новые видео, обновления сборок и общение — на наших площадках.')}</p>
        </div>
        <div className={s.socialLinks}>
          {site.socialLinks.map((link) => (
            <ExternalLink key={link.platform} href={link.url} className={s.socialLink}>
              {t(link.label)}
            </ExternalLink>
          ))}
        </div>
      </section>
    </div>
  );
}
