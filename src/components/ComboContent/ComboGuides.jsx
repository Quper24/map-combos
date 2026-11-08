import { useTranslation } from '../../i18n/Language';
import Video from '../Video/Video';
import ExternalLink from '../ui/ExternalLink';
import s from './ComboContent.module.css';

export function ComboDisclosure({ title, name, children }) {
  const { t } = useTranslation();
  return (
    <details className={s.disclosure} name={name}>
      <summary>{t(title)}</summary>
      <div className={s.detailBody}>{children}</div>
    </details>
  );
}

export function BeforeLaunchDetails({ game, dlcs }) {
  const { t } = useTranslation();
  const ats = game === 'ats';
  const directory = ats ? 'American Truck Simulator' : 'Euro Truck Simulator 2';
  return (
    <>
      <ComboDisclosure title="Видеоинструкция по установке">
        <Video videoId="6UWd6wJa7s8" title={t('Подробная инструкция по установке сборки карт')} />
      </ComboDisclosure>
      <ComboDisclosure title="Настройка config.cfg">
        <p>{t('Для корректной работы модов открой файл:')}</p>
        <code>
          {t('Документы/')}
          {t(directory)}/config.cfg
        </code>
        <p>
          {t('Найди параметр ')}
          <code>uset r_buffer_page_size</code>
          {t(' и установи значение')} <code>30</code>.
        </p>
      </ComboDisclosure>
      <ComboDisclosure title="Параметры запуска Steam">
        <p>{t('Добавь параметры запуска:')}</p>
        <pre>-nointro -unlimitedlog</pre>
        <img
          src="/img/combos/steam-params.jpg"
          alt={t('Пример параметров запуска Steam')}
          loading="lazy"
        />
      </ComboDisclosure>
      <ComboDisclosure title="Обязательные DLC карт">
        {dlcs?.length ? (
          <ul>
            {dlcs.map((dlc) => (
              <li key={dlc}>{dlc}</li>
            ))}
          </ul>
        ) : (
          <p>
            {t(
              dlcs
                ? 'Проверь требования к DLC на страницах выбранных карт.'
                : 'Для работы сборки должны быть установлены все DLC карт.',
            )}
          </p>
        )}
        <ExternalLink
          className="text-link"
          href={
            ats
              ? 'https://store.steampowered.com/dlc/270880/American_Truck_Simulator/'
              : 'https://store.steampowered.com/dlc/227300/Euro_Truck_Simulator_2/list/43330'
          }
        >
          {t('DLC в Steam')}
        </ExternalLink>
      </ComboDisclosure>
    </>
  );
}

export function LauncherDetails() {
  const { t } = useTranslation();
  return (
    <ComboDisclosure title="Как пользоваться лаунчером">
      <p>{t('Для использования нужна рубиновая подписка на Boosty.')}</p>
      <Video videoId="ey10boQxLRQ" title={t('Инструкция для лаунчера')} />
    </ComboDisclosure>
  );
}
