import { useTranslation } from '../../i18n/Language';
import { Link } from 'react-router-dom';
import AutoProfileInstall from '../AutoProfileInstall/AutoProfileInstall';
import Video from '../Video/Video';
import ExternalLink from '../ui/ExternalLink';
import { VERSIONS } from '../../data/versions';
import { comboVideos, youtubeVideoId } from '../../lib/content';
import { BeforeLaunchDetails, LauncherDetails } from './ComboGuides';
import s from './ComboContent.module.css';
export default function ComboContent({ combo }) {
  const { t } = useTranslation();
  const related = comboVideos(combo);
  const versionBoostyUrl = VERSIONS[combo.version_game]?.boostyUrl;
  const sections = [
    ['links', 'Ссылки'],
    ['install', 'Установка'],
    ...(combo.automods ? [['profile', 'Авторасстановка']] : []),
    ['map-order', 'Порядок карт'],
    ['launcher', 'Лаунчер'],
  ];
  return (
    <div className={s.content}>
      <nav className={s.navigation} aria-label={t('На странице сборки')}>
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {t(label)}
          </a>
        ))}
      </nav>
      <section id="links">
        <h2>{t('Всё для установки')}</h2>
        <div className={s.links}>
          {combo.table && (
            <ExternalLink
              href={combo.table}
              className={
                combo.table.startsWith('https://boosty.to/') ? 'button button-boosty' : undefined
              }
            >
              {t(
                combo.table.startsWith('https://boosty.to/')
                  ? 'Материалы сборки на Boosty'
                  : 'Таблица файлов карт',
              )}
            </ExternalLink>
          )}
          {combo.profile && (
            <ExternalLink href={combo.profile}>{t('Готовый профиль')}</ExternalLink>
          )}
          {combo.boosty && (
            <ExternalLink className="button button-boosty" href={combo.boosty}>
              {t('Сборка на Boosty')}
            </ExternalLink>
          )}
          {versionBoostyUrl && (
            <ExternalLink className="button button-boosty" href={versionBoostyUrl}>
              {t('Все сборки на ')}
              {combo.version_game}
              {t(' на Boosty')}
            </ExternalLink>
          )}
        </div>
        {(combo.table || combo.boosty || combo.profile) && (
          <p className={s.note}>
            {t(
              combo.table &&
                !combo.table.startsWith('https://boosty.to/') &&
                'В таблице — ссылки на файлы и информация о сборке. ',
            )}
            {t(combo.boosty && 'Материалы сборки на Boosty доступны в отдельном посте. ')}
            {t(combo.profile && 'В готовом профиле моды уже расставлены.')}
          </p>
        )}
        {combo.tags.includes('server') && (
          <aside className={s.serverGuide}>
            <span className={s.guideLabel}>{t('Планируешь играть на наших серверах?')}</span>
            <strong>{t('Подготовься к первому рейсу')}</strong>
            <p>{t('Параметры сессий, подготовка модов и порядок подключения — в одном гайде.')}</p>
            <Link className="button" to="/server-guide">
              {t('Как подключиться к серверу →')}
            </Link>
          </aside>
        )}
      </section>
      {(related.length > 0 || combo.video) && (
        <section>
          <h2>{t('Видеообзор сборки')}</h2>
          {related.length ? (
            related.map((video) => (
              <Video
                key={video.id}
                videoId={youtubeVideoId(video.platforms.youtube)}
                title={t(video.title)}
                thumbnail={video.thumbnail}
                platforms={video.platforms}
              />
            ))
          ) : (
            <Video videoId={combo.video} title={t(combo.title)} />
          )}
        </section>
      )}
      {combo.automods && (
        <section id="profile">
          <h2>{t('Автоматическая расстановка')}</h2>
          <p className={s.note}>
            {t('Расставь модификации в своём профиле с помощью готового порядка сборки.')}
          </p>
          <AutoProfileInstall combo={combo} />
        </section>
      )}
      <section id="install">
        <h2>{t('Перед запуском')}</h2>
        <BeforeLaunchDetails
          game={combo.tags.includes('ats') ? 'ats' : 'ets2'}
          gameVersion={combo.version_game}
        />
      </section>
      <section id="launcher">
        <h2>{t('DQ Лаунчер')}</h2>
        <LauncherDetails />
      </section>
    </div>
  );
}
