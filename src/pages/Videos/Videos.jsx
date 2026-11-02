import { useTranslation } from '../../i18n/Language';
import { useState } from 'react';
import { videos, GAME_NAMES, VIDEO_CATEGORIES, videoGames, sortVideos } from '../../lib/content';
import VideoCard from '../../components/VideoCard/VideoCard';
import Icon from '../../components/ui/Icon';
import s from './Videos.module.css';
export default function Videos() {
  const { t } = useTranslation();
  const [category, setCategory] = useState('all');
  const [game, setGame] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const games = [...new Set(videos.flatMap(videoGames))];
  const result = sortVideos(
    videos.filter(
      (video) =>
        (category === 'all' || video.category === category) &&
        (game === 'all' || videoGames(video).includes(game)) &&
        `${t(video.title)} ${video.title}`.toLowerCase().includes(query.toLowerCase()),
    ),
    sort,
  );
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow">{t('За рулём и за его пределами')}</span>
        <h1>{t('Видео')}</h1>
        <p>
          {t(
            'Обзоры сборок, полезные моды, покатушки и другие игры. Выбирай, что посмотреть, и удобную площадку.',
          )}
        </p>
      </div>
      <div className={s.filters}>
        <div className={s.top}>
          <label className="search-field">
            <Icon name="search" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={t('Поиск видео')}
              placeholder={t('Найти видео…')}
            />
          </label>
          <select
            aria-label={t('Игра в видео')}
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
          <select
            aria-label={t('Сортировка видео')}
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">{t('Сначала новые')}</option>
            <option value="oldest">{t('Сначала старые')}</option>
          </select>
        </div>
        <div className="filter-chips">
          {[['all', 'Все видео'], ...Object.entries(VIDEO_CATEGORIES)].map(([id, label]) => (
            <button
              key={id}
              className="chip"
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              {t(label)}
            </button>
          ))}
        </div>
      </div>
      <p className={s.count} role="status">
        {t('Найдено видео: ')}
        {result.length}
      </p>
      <div className="card-grid">
        {result.map((video) => (
          <VideoCard video={video} key={video.id} showRelations />
        ))}
      </div>
      {!result.length && (
        <div className="empty-state">
          <h2>{t('Здесь пока нет видео')}</h2>
          <p>{t('Выбери другую категорию или измени поиск.')}</p>
          <button
            className="button button-secondary"
            onClick={() => {
              setCategory('all');
              setGame('all');
              setQuery('');
            }}
          >
            {t('Показать все видео')}
          </button>
        </div>
      )}
    </div>
  );
}
