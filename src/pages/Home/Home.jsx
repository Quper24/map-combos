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
    title: 'Больше дорог',
    text: 'Сборки карт ETS2 и ATS. Всё для следующего большого путешествия.',
    label: 'Выбрать сборку',
  },
  {
    to: '/mods',
    number: '02',
    icon: 'grid',
    title: 'Больше возможностей',
    text: 'Собственные моды и плагины, которые делают игру интереснее.',
    label: 'Смотреть разработки',
  },
  {
    to: '/vtc',
    number: '03',
    icon: 'truck',
    title: 'Больше, чем рейсы',
    text: 'Наша VTC, совместные конвои и люди, с которыми по пути.',
    label: 'Познакомиться с VTC',
  },
];
export default function Home() {
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
          <span className="eyebrow">Quper Simulator / ETS2 & ATS</span>
          <h1>
            Весь мир
            <br />у наших <span>колёс.</span>
          </h1>
          <p>
            Новые маршруты, любимые симуляторы
            <br className={s.desktopBreak} /> и компания, с которой хочется ехать дальше.
          </p>
          <div className="actions">
            <Link to="/combos" className="button">
              Найти свою сборку <Icon name="arrow" size={18} />
            </Link>
            <Link to="/vtc" className="button button-secondary">
              Наша VTC
            </Link>
          </div>
          <div className={s.heroNote}>
            <span /> Карты. Моды. Конвои. Одна любовь к дороге.
          </div>
        </div>
        {featured ? (
          <Link to={`/combos/${featured.id}`} className={s.featured}>
            <div className={s.featuredImage}>
              <img
                src={assetUrl(featured.preview)}
                width="960"
                height="540"
                alt={featured.title}
                fetchPriority="high"
              />
              <span className={s.featuredBadge}>
                ETS2 <b>{featured.version_game}</b>
              </span>
            </div>
            <div className={s.featuredBottom}>
              <div>
                <span className={s.smallLabel}>Открой новые маршруты</span>
                <h2>Quper Map Combo</h2>
              </div>
              <span className={s.featuredArrow}>
                <Icon name="arrow" />
              </span>
            </div>
          </Link>
        ) : (
          <div className={s.featured} aria-busy="true">
            <div className={s.featuredImage} />
            <div className={s.featuredBottom}>Загружаем сборки…</div>
          </div>
        )}
      </section>
      <section className={s.directions} aria-label="Разделы проекта">
        {directions.map((item) => (
          <Link className={s.direction} key={item.to} to={item.to}>
            <div className={s.directionTop}>
              <Icon name={item.icon} size={25} />
              <span>{item.number}</span>
            </div>
            <h2>{item.title}</h2>
            <p>{item.text}</p>
            <span className={s.directionLink}>
              {item.label}
              <Icon name="arrow" size={17} />
            </span>
          </Link>
        ))}
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Выбирай свой маршрут</span>
            <h2>Свежие сборки</h2>
            <p>Порядок карт, ссылки и инструкции — в одном месте.</p>
          </div>
          <Link to="/combos" className="text-link">
            Все сборки <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="card-grid">
          {latest.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      </section>
      <section className={s.vtcBanner}>
        <div className={s.vtcIdentity}>
          <img src="/img/logo.jpg" width="140" height="140" alt="Логотип VTC Quper Simulator" />
          <span>VIRTUAL TRUCKING COMPANY</span>
        </div>
        <div className={s.vtcCopy}>
          <span className="eyebrow">Хорошая дорога начинается с компании</span>
          <h2>Вместе интереснее.</h2>
          <p>
            Без обязательных пробегов, перекрасок и строгих графиков. Только удовольствие от дороги
            и общения.
          </p>
          <Link className="text-link" to="/vtc">
            Присоединиться к Quper Simulator <Icon name="arrow" size={18} />
          </Link>
        </div>
        <span className={s.roadMark} aria-hidden="true" />
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">По ту сторону руля</span>
            <h2>Смотри. Вдохновляйся. Поехали.</h2>
          </div>
          <Link className="text-link" to="/videos">
            Все видео <Icon name="arrow" size={17} />
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
          <span className="eyebrow">Остаёмся на связи</span>
          <h2>Встречаемся не только в игре.</h2>
          <p>Новые видео, обновления сборок и общение — на наших площадках.</p>
        </div>
        <div className={s.socialLinks}>
          {site.socialLinks.map((link) => (
            <ExternalLink key={link.platform} href={link.url} className={s.socialLink}>
              {link.label}
            </ExternalLink>
          ))}
        </div>
      </section>
    </div>
  );
}
