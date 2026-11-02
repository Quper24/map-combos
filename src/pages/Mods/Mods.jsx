import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mods } from '../../lib/mods';
import { GAME_NAMES } from '../../lib/content';
import Icon from '../../components/ui/Icon';
import s from './Mods.module.css';
export default function Mods() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [game, setGame] = useState('all');
  const games = [...new Set(mods.flatMap((mod) => mod.games))];
  const result = mods.filter(
    (mod) =>
      (!query || `${mod.title} ${mod.summary}`.toLowerCase().includes(query.toLowerCase())) &&
      (type === 'all' || mod.type === type) &&
      (game === 'all' || mod.games.includes(game)),
  );
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow">Разработано Quper</span>
        <h1>Моды и плагины</h1>
        <p>
          Собственные разработки для любимых симуляторов. Больше реализма, удобства и удовольствия
          от игры.
        </p>
      </div>
      <div className={s.filters}>
        <label className="search-field">
          <Icon name="search" size={18} />
          <input
            aria-label="Поиск модов и плагинов"
            placeholder="Найти разработку…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="filter-chips">
          {[
            ['all', 'Все'],
            ['mod', 'Моды'],
            ['plugin', 'Плагины'],
          ].map(([value, label]) => (
            <button
              key={value}
              className="chip"
              aria-pressed={type === value}
              onClick={() => setType(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <select aria-label="Игра" value={game} onChange={(event) => setGame(event.target.value)}>
          <option value="all">Все игры</option>
          {games.map((id) => (
            <option key={id} value={id}>
              {GAME_NAMES[id] || id}
            </option>
          ))}
        </select>
      </div>
      <p className={s.count} role="status">
        Найдено разработок: {result.length}
      </p>
      <div className={s.list}>
        {result.map((mod) => (
          <article key={mod.id} className={s.modCard}>
            <Link to={`/mods/${mod.id}`} className={s.cover} tabIndex={-1} aria-hidden="true">
              <img src={mod.cover} alt="" width="640" height="360" loading="lazy" />
            </Link>
            <div className={s.modBody}>
              <div className={s.tags}>
                <span className="badge badge-green">
                  {mod.type === 'plugin' ? 'Плагин' : 'Мод'}
                </span>
                {mod.games.map((id) => (
                  <span key={id} className="badge">
                    {GAME_NAMES[id] || id}
                  </span>
                ))}
                {mod.version && <span className="badge">Версия {mod.version}</span>}
              </div>
              <h2>
                <Link to={`/mods/${mod.id}`}>{mod.title}</Link>
              </h2>
              <p>{mod.summary}</p>
              <Link to={`/mods/${mod.id}`} className="text-link">
                Подробнее и скачать <Icon name="arrow" size={17} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {!result.length && (
        <div className="empty-state">
          <h2>Пока ничего не найдено</h2>
          <p>Попробуй другой запрос или выбери все типы разработок.</p>
          <button
            className="button button-secondary"
            onClick={() => {
              setQuery('');
              setType('all');
              setGame('all');
            }}
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
}
