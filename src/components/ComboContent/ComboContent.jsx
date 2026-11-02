import { Link } from 'react-router-dom';
import AutoProfileInstall from '../AutoProfileInstall/AutoProfileInstall';
import Video from '../Video/Video';
import ExternalLink from '../ui/ExternalLink';
import { comboVideos, youtubeVideoId } from '../../lib/content';
import s from './ComboContent.module.css';
export default function ComboContent({ combo }) {
  const related = comboVideos(combo);
  const game = combo.tags.includes('ats') ? 'American Truck Simulator' : 'Euro Truck Simulator 2';
  const sections = [
    ['links', 'Ссылки'],
    ['install', 'Установка'],
    ...(combo.automods ? [['profile', 'Авторасстановка']] : []),
    ['map-order', 'Порядок карт'],
    ['launcher', 'Лаунчер'],
  ];
  return (
    <div className={s.content}>
      <nav className={s.navigation} aria-label="На странице сборки">
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`}>
            {label}
          </a>
        ))}
      </nav>
      <section id="links">
        <h2>Всё для установки</h2>
        <div className={s.links}>
          {combo.table && (
            <ExternalLink href={combo.table}>
              {combo.tags.includes('server') ? 'Скачать сборку' : 'Таблица файлов карт'}
            </ExternalLink>
          )}
          {combo.profile && <ExternalLink href={combo.profile}>Готовый профиль</ExternalLink>}
          <ExternalLink
            className="button button-boosty"
            href="https://boosty.to/qupersimulator/posts/cab7f126-f979-4360-bd7a-92a040d90ff7"
          >
            Сборка одним архивом · Boosty
          </ExternalLink>
        </div>
        <p className={s.note}>
          Таблица содержит ссылки и актуальную информацию. В готовом профиле моды уже расставлены.
          Архив на Boosty доступен в раннем доступе.
        </p>
        {combo.tags.includes('server') && (
          <Link className="text-link" to="/server-guide">
            Инструкция по подключению к серверу →
          </Link>
        )}
      </section>
      {(related.length > 0 || combo.video) && (
        <section>
          <h2>Видеообзор сборки</h2>
          {related.length ? (
            related.map((video) => (
              <Video
                key={video.id}
                videoId={youtubeVideoId(video.platforms.youtube)}
                title={video.title}
                thumbnail={video.thumbnail}
                platforms={video.platforms}
              />
            ))
          ) : (
            <Video videoId={combo.video} title={combo.title} />
          )}
        </section>
      )}
      {combo.automods && (
        <section id="profile">
          <h2>Автоматическая расстановка</h2>
          <p className={s.note}>
            Расставь модификации в своём профиле с помощью готового порядка сборки.
          </p>
          <AutoProfileInstall combo={combo} />
        </section>
      )}
      <section id="install">
        <h2>Перед запуском</h2>
        <details>
          <summary>Видеоинструкция по установке</summary>
          <Video videoId="6UWd6wJa7s8" title="Подробная инструкция по установке сборки карт" />
        </details>
        <details>
          <summary>Настройка config.cfg</summary>
          <div className={s.detailBody}>
            <p>Для корректной работы модов открой файл:</p>
            <code>Документы/{game}/config.cfg</code>
            <p>
              Найди параметр <code>uset r_buffer_page_size</code> и установи значение{' '}
              <code>30</code>.
            </p>
          </div>
        </details>
        <details>
          <summary>Параметры запуска Steam</summary>
          <div className={s.detailBody}>
            <p>Добавь параметры запуска:</p>
            <pre>-nointro -unlimitedlog</pre>
            <img
              src="/img/combos/steam-params.jpg"
              alt="Пример параметров запуска Steam"
              loading="lazy"
            />
          </div>
        </details>
        <details>
          <summary>Обязательные DLC карт</summary>
          <div className={s.detailBody}>
            <p>Для работы сборки должны быть установлены все DLC карт.</p>
            <ExternalLink
              className="text-link"
              href={
                combo.tags.includes('ats')
                  ? 'https://store.steampowered.com/dlc/270880/American_Truck_Simulator/'
                  : 'https://store.steampowered.com/dlc/227300/Euro_Truck_Simulator_2/list/43330'
              }
            >
              DLC в Steam
            </ExternalLink>
          </div>
        </details>
      </section>
      <section id="launcher">
        <h2>DQ Лаунчер</h2>
        <details>
          <summary>Как пользоваться лаунчером</summary>
          <div className={s.detailBody}>
            <p>Для использования нужна рубиновая подписка на Boosty.</p>
            <Video videoId="ey10boQxLRQ" title="Инструкция для лаунчера" />
          </div>
        </details>
      </section>
    </div>
  );
}
