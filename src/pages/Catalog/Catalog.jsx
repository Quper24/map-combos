import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { COMBOS_BY_VERSION, VERSIONS } from '../../data';
import site from '../../../content/site.json';
import ComboCard from '../../components/ComboCard/ComboCard';
import useFavorites from '../../components/hooks/useFavorites';
import Icon from '../../components/ui/Icon';
import { tagUtils } from '../../utils/tags';
import { dateValue } from '../../lib/content';
import s from './Catalog.module.css';
export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const { favorites } = useFavorites();
  const version = VERSIONS[params.get('version')] ? params.get('version') : site.currentGameVersion;
  const query = params.get('q') || '';
  const tags = params.getAll('tag');
  const onlyFavorites = params.get('favorites') === '1';
  const sort = params.get('sort') || 'date';
  const combos = COMBOS_BY_VERSION[version] || [];
  const allTags = tagUtils.extractUniqueTags(combos);
  function update(key, value) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        value ? next.set(key, value) : next.delete(key);
        return next;
      },
      { replace: true },
    );
  }
  function toggleTag(tag) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const selected = next.getAll('tag');
        next.delete('tag');
        (selected.includes(tag)
          ? selected.filter((item) => item !== tag)
          : [...selected, tag]
        ).forEach((item) => next.append('tag', item));
        return next;
      },
      { replace: true },
    );
  }
  const result = useMemo(() => {
    const filtered = combos.filter(
      (combo) =>
        (!query || `${combo.title} ${combo.id}`.toLowerCase().includes(query.toLowerCase())) &&
        tags.every((tag) => combo.tags?.includes(tag)) &&
        (!onlyFavorites || favorites.includes(combo.id)),
    );
    return sort === 'date'
      ? filtered.sort(
          (a, b) => dateValue(b.date) - dateValue(a.date) || a.title.localeCompare(b.title),
        )
      : filtered;
  }, [combos, query, tags, onlyFavorites, favorites, sort]);
  const filtered = query || tags.length || onlyFavorites;
  function reset() {
    setParams({ version }, { replace: true });
  }
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow">Маршруты без границ</span>
        <h1>Сборки карт</h1>
        <p>
          Выбери свой мир. Ссылки, готовые профили и порядок карт для ETS2 и ATS — всё собрано
          здесь.
        </p>
      </div>
      <section className={s.filters} aria-label="Фильтры сборок">
        <div className={s.top}>
          <label className={s.version}>
            Версия игры
            <select
              value={version}
              onChange={(event) => {
                update('version', event.target.value);
                try {
                  localStorage.setItem('mapCombos_selectedVersion', event.target.value);
                } catch {}
              }}
              aria-label="Версия игры"
            >
              {Object.keys(VERSIONS)
                .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
                .map((id) => (
                  <option key={id} value={id}>
                    {id}
                    {id === site.currentGameVersion ? ' — актуальная' : ' — архив'}
                  </option>
                ))}
            </select>
          </label>
          <label className={`search-field ${s.search}`}>
            <Icon name="search" size={18} />
            <input
              aria-label="Поиск сборок"
              placeholder="Название сборки…"
              value={query}
              onChange={(event) => update('q', event.target.value)}
            />
          </label>
          <label className={s.sort}>
            Порядок
            <select
              aria-label="Сортировка"
              value={sort}
              onChange={(event) => update('sort', event.target.value)}
            >
              <option value="date">Сначала обновлённые</option>
              <option value="original">Исходный порядок</option>
            </select>
          </label>
        </div>
        <div className={s.bottom}>
          <div className="filter-chips">
            {allTags.map((tag) => (
              <button
                key={tag}
                className="chip"
                aria-pressed={tags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                {tagUtils.getLabel(tag)}
              </button>
            ))}
            <button
              className="chip"
              aria-pressed={onlyFavorites}
              onClick={() => update('favorites', onlyFavorites ? '' : '1')}
            >
              ☆ Избранное
            </button>
          </div>
          {filtered && (
            <button className={s.reset} onClick={reset}>
              Сбросить фильтры <Icon name="close" size={13} />
            </button>
          )}
        </div>
      </section>
      <div className={s.results}>
        <span role="status">
          Найдено сборок: <b>{result.length}</b>
        </span>
        <span className={`badge ${version === site.currentGameVersion ? 'badge-green' : ''}`}>
          {version === site.currentGameVersion ? `Версия ${version}` : `Архив / ${version}`}
        </span>
      </div>
      {result.length ? (
        <div className="card-grid">
          {result.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Сборок не найдено</h2>
          <p>Попробуй изменить запрос или убрать часть фильтров.</p>
          <button className="button button-secondary" onClick={reset}>
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
}
