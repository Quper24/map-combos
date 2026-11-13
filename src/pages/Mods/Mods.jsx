import { useTranslation } from '../../i18n/Language';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mods } from '../../lib/mods';
import { GAME_NAMES } from '../../lib/content';
import Icon from '../../components/ui/Icon';
import s from './Mods.module.css';
export default function Mods() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [game, setGame] = useState('all');
  const games = [...new Set(mods.flatMap((mod) => mod.games))];
  const result = mods.filter(
    (mod) =>
      (!query ||
        `${t(mod.title)} ${t(mod.summary)} ${mod.title} ${mod.summary}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (type === 'all' || mod.type === type) &&
      (game === 'all' || mod.games.includes(game)),
  );
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow">{t('Разработано Quper')}</span>
        <h1>{t('Моды и плагины')}</h1>
        <p>
          {t(
            'Собственные разработки для любимых симуляторов. Больше реализма, удобства и удовольствия от игры.',
          )}
        </p>
      </div>
      <div className={s.filters}>
        <label className="search-field">
          <Icon name="search" size={18} />
          <input
            aria-label={t('Поиск модов и плагинов')}
            placeholder={t('Найти разработку…')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="filter-chips">
          {[
            ['all', 'Все'],
            ['mod', 'Моды'],
            ['plugin', 'Плагины'],
            ['app', 'Программы'],
          ].map(([value, label]) => (
            <button
              key={value}
              className="chip"
              aria-pressed={type === value}
              onClick={() => setType(value)}
            >
              {t(label)}
            </button>
          ))}
        </div>
        <select
          aria-label={t('Игра')}
          value={game}
          onChange={(event) => setGame(event.target.value)}
        >
          <option value="all">{t('Все игры')}</option>
          {games.map((id) => (
            <option key={id} value={id}>
              {t(GAME_NAMES[id] || id)}
            </option>
          ))}
        </select>
      </div>
      <p className={s.count} role="status">
        {t('Найдено разработок: ')}
        {result.length}
      </p>
      <div className={s.list}>
        {result.map((mod, index) => (
          <article key={mod.id} className={s.modCard}>
            <Link to={`/mods/${mod.id}`} className={s.cover} tabIndex={-1} aria-hidden="true">
              <img
                src={mod.cover}
                alt={''}
                width="640"
                height="360"
                loading={index === 0 ? 'eager' : 'lazy'}
              />
            </Link>
            <div className={s.modBody}>
              <div className={s.tags}>
                <span className="badge badge-green">
                  {t({ mod: 'Мод', plugin: 'Плагин', app: 'Программа' }[mod.type])}
                </span>
                {mod.games.map((id) => (
                  <span key={id} className="badge">
                    {t(GAME_NAMES[id] || id)}
                  </span>
                ))}
                {mod.version && (
                  <span className="badge">
                    {t('Версия ')}
                    {mod.version}
                  </span>
                )}
              </div>
              <h2>
                <Link to={`/mods/${mod.id}`}>{t(mod.title)}</Link>
              </h2>
              <p>{t(mod.summary)}</p>
              <Link to={`/mods/${mod.id}`} className="text-link">
                {t('Подробнее и скачать ')}
                <Icon name="arrow" size={17} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!result.length && (
        <div className="empty-state">
          <h2>{t('Пока ничего не найдено')}</h2>
          <p>{t('Попробуй другой запрос или выбери все типы разработок.')}</p>
          <button
            className="button button-secondary"
            onClick={() => {
              setQuery('');
              setType('all');
              setGame('all');
            }}
          >
            {t('Сбросить фильтры')}
          </button>
        </div>
      )}
    </div>
  );
}
