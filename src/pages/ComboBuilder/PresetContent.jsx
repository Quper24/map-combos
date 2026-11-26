import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/Language';
import {
  BeforeLaunchDetails,
  ComboDisclosure,
  LauncherDetails,
  ServerGuideCallout,
} from '../../components/ComboContent/ComboGuides';
import ExternalLink from '../../components/ui/ExternalLink';
import Video from '../../components/Video/Video';
import {
  addToCombo,
  entriesByLoadOrder,
  isSelectable,
  removeFromCombo,
  resolveCombo,
} from '../../lib/comboBuilder';
import { youtubeVideoId } from '../../lib/content';
import { comboPath, combinedPresetPairs, isCatalogCombo, presetCombo } from '../../lib/presetCombos';
import { diffPresetEntries } from '../../lib/presetReleases';
import {
  EntryBadge,
  ModVersion,
  OrderDownloads,
  OrderList,
  OrderProfileInstall,
  RemovePaidEntriesButton,
} from './ComboBuilder';
import ShareCombo from './ShareCombo';
import s from './ComboBuilder.module.css';
import page from '../Combo/Combo.module.css';

export default function PresetContent({ catalog, preset, share = true }) {
  const { t } = useTranslation();
  const heading = useId();
  const accordion = `combo-info-${heading}`;
  const server = preset.tags?.includes('server');
  const optionalIds = new Set(server ? preset.optionalSelection || [] : []);
  const requiredSelection = preset.selection.filter((id) => !optionalIds.has(id));
  const defaultSelection = server ? requiredSelection : preset.selection;
  const [selection, setSelection] = useState(defaultSelection);
  const result = useMemo(
    () => resolveCombo(catalog, selection, { server }),
    [catalog, selection, server],
  );
  const byId = new Map(catalog.entries.map((entry) => [entry.id, entry]));
  const original =
    selection.length === defaultSelection.length &&
    defaultSelection.every((id) => selection.includes(id));
  const pairs = combinedPresetPairs(catalog).filter(
    ({ preset: pair }) => !resolveCombo(catalog, pair.selection).conflicts.length,
  );
  const selectedPair = pairs.find(({ preset: pair }) => sameSelection(selection, pair.selection));
  const activePair = selectedPair
    ? presetCombo(catalog, selectedPair.preset)
    : preset.composition
      ? presetCombo(catalog, preset)
      : null;
  const relatedPairs = preset.composition
    ? []
    : pairs.filter(
        ({ mapPreset, modPreset, preset: combined }) =>
          isCatalogCombo(combined) && (mapPreset.id === preset.id || modPreset.id === preset.id),
      );
  const canUseOrder = result.files.length > 0 && !result.conflicts.length;
  const orderTitle = activePair?.title || (original ? preset.title : 'Своя сборка');
  const removals = server
    ? new Map(
        preset.selection
          .filter((id) => optionalIds.has(id) && result.active.has(id))
          .map((id) => [id, { selection: selection.filter((selected) => selected !== id) }]),
      )
    : new Map(
        catalog.entries
          .filter((entry) => isSelectable(entry) && result.active.has(entry.id))
          .map(({ id }) => [id, removeFromCombo(catalog, selection, id, result.active)]),
      );

  return (
    <div className={page.layout}>
      <aside aria-label={t('Информация о сборке')}>
        <h2>{t('Информация о сборке')}</h2>
        <div className={s.toolbar}>
          {(original || server) && preset.profile && (
            <ExternalLink href={preset.profile}>{t('Готовый профиль')}</ExternalLink>
          )}
          {preset.boosty && (
            <ExternalLink className="button button-boosty" href={preset.boosty}>
              {t(
                server || activePair || original ? 'Сборка на Boosty' : 'Исходная сборка на Boosty',
              )}
            </ExternalLink>
          )}
          {server && preset.cloud && (
            <ExternalLink className="button button-secondary" href={preset.cloud}>
              {t('Скачать комплект из облака')}
            </ExternalLink>
          )}
          {server && preset.company && (
            <ExternalLink className="button button-secondary" href={preset.company}>
              {t('Скачать комплект из ВТК компании')}
            </ExternalLink>
          )}
          {!server && (
            <RemovePaidEntriesButton
              catalog={catalog}
              selection={selection}
              active={result.active}
              onRemove={setSelection}
            />
          )}
          {!original && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => setSelection(defaultSelection)}
            >
              {t('Вернуть исходную сборку')}
            </button>
          )}
          {!server && !activePair && relatedPairs.length > 0 && (
            <ComboCompositionAction
              t={t}
              catalog={catalog}
              pairs={relatedPairs}
              preset={preset}
              selection={selection}
              onSelect={setSelection}
            />
          )}
        </div>
        {server && <ServerGuideCallout />}
        {canUseOrder && (
          <ComboDisclosure name={accordion} title="Автоматическая расстановка модов">
            <OrderProfileInstall catalog={catalog} files={result.files} title={orderTitle} />
          </ComboDisclosure>
        )}
        {preset.video && (
          <ComboDisclosure name={accordion} title="Видеообзор сборки">
            <PresetVideo url={preset.video} title={preset.title} />
          </ComboDisclosure>
        )}
        <ComboDisclosure name={accordion} title="Перед запуском">
          <BeforeLaunchDetails
            game={catalog.game}
            gameVersion={catalog.version}
            dlcs={result.dlcs}
          />
        </ComboDisclosure>
        <ComboDisclosure name={accordion} title="DQ Лаунчер">
          <LauncherDetails />
        </ComboDisclosure>
        {!server && (
          <ComboDisclosure name={accordion} title="Список модов">
            <InactiveMods
              catalog={catalog}
              selection={selection}
              active={result.active}
              byId={byId}
              onChange={setSelection}
            />
          </ComboDisclosure>
        )}
        {server && (
          <ComboDisclosure name={accordion} title="Опциональные моды">
            <p>{t('Обязательные моды уже включены. Дополнительные моды по желанию.')}</p>
            <OptionalServerMods
              catalog={catalog}
              preset={preset}
              selection={selection}
              active={result.active}
              onChange={setSelection}
            />
          </ComboDisclosure>
        )}
        {preset.releases?.length > 0 && (
          <ComboDisclosure name={accordion} title="История обновлений">
            <ReleaseHistory releases={preset.releases} />
          </ComboDisclosure>
        )}
      </aside>
      <section className={`${page.order} ${s.presetOrder}`} tabIndex={0} aria-labelledby={heading}>
        <span className="eyebrow">{t('Менеджер модификаций')}</span>
        <h2 id={heading}>{t('Порядок карт и модов')}</h2>
        <p role="status">
          {t(
            activePair
              ? 'Официальная сборка карт и модов'
              : original
                ? 'Готовая сборка'
                : 'Своя сборка',
          )}{' '}
          · {t('Файлов — ')}
          {result.files.length}
        </p>
        {activePair && !preset.composition && (
          <p>
            <Link className="text-link" to={comboPath(activePair)}>
              {t('Короткая ссылка на сборку карт и модов')}
            </Link>
          </p>
        )}
        {share && selection.length > 0 && canUseOrder && (
          <ShareCombo
            catalog={catalog}
            selection={selection}
            shortPath={
              activePair
                ? comboPath(activePair)
                : original
                  ? comboPath(presetCombo(catalog, preset))
                  : undefined
            }
          />
        )}
        <ConflictList rules={result.conflicts} byId={byId} announce />
        {result.files.length ? (
          <OrderList
            result={result}
            byId={byId}
            showLinks={server ? (entry) => optionalIds.has(entry.id) : true}
            compact
            removals={removals}
            onRemove={setSelection}
          />
        ) : (
          <p>{t('Выбери карты, чтобы увидеть порядок.')}</p>
        )}
        {canUseOrder && (
          <OrderDownloads catalog={catalog} files={result.files} title={orderTitle} />
        )}
      </section>
    </div>
  );
}

const sameSelection = (left = [], right = []) =>
  left.length === right.length && left.every((id) => right.includes(id));

function ComboCompositionAction({ t, catalog, pairs, preset, selection, onSelect }) {
  const isMapPreset = pairs[0].mapPreset.id === preset.id;
  const mapPresets = [
    ...new Map(pairs.map((pair) => [pair.mapPreset.id, pair.mapPreset])).values(),
  ];
  const [chosenMap, setChosenMap] = useState(mapPresets[0].id);
  const pair = isMapPreset
    ? pairs[0]
    : pairs.find(({ mapPreset }) => mapPreset.id === chosenMap) || pairs[0];
  const additions = isMapPreset ? pair.modPreset.selection : pair.mapPreset.selection;
  const composition = additions.reduce(
    (current, id) => {
      const next = addToCombo(catalog, current.selection, id);
      return {
        selection: next.selection,
        conflicts: [...current.conflicts, ...next.conflicts],
      };
    },
    { selection, conflicts: [] },
  );
  const combinedSelection = composition.selection;
  const action = isMapPreset ? 'Добавить сборку модов' : 'Добавить сборку карт';
  const result = resolveCombo(catalog, combinedSelection);
  const conflicts = composition.conflicts.length > 0 || result.conflicts.length > 0;

  return (
    <div className={s.compositionAction}>
      {!isMapPreset && mapPresets.length > 1 && (
        <label className={s.field}>
          {t('Сборка карт')}
          <select value={pair.mapPreset.id} onChange={(event) => setChosenMap(event.target.value)}>
            {mapPresets.map((item) => (
              <option key={item.id} value={item.id}>
                {t(item.title)}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        type="button"
        className="button button-secondary"
        disabled={conflicts}
        onClick={() => onSelect(combinedSelection)}
      >
        {t(action)}
      </button>
      {conflicts && <p role="alert">{t('В этой комбинации есть конфликтующие позиции.')}</p>}
    </div>
  );
}

function OptionalServerMods({ catalog, preset, selection, active, onChange }) {
  const { t } = useTranslation();
  const entries = entriesByLoadOrder(catalog).filter((entry) =>
    (preset.optionalSelection || []).includes(entry.id),
  );
  const byId = new Map(catalog.entries.map((entry) => [entry.id, entry]));
  return entries.length ? (
    <ul className={s.inactiveMods}>
      {entries.map((entry) => {
        const enabled = active.has(entry.id);
        const candidate = {
          selection: enabled ? selection.filter((id) => id !== entry.id) : [...selection, entry.id],
          conflicts: [],
        };
        const blocked = false;
        return (
          <li key={entry.id}>
            <div className={s.inactiveRow}>
              {entry.image && <img className={s.thumb} src={entry.image} alt="" loading="lazy" />}
              <label>
                <input
                  type="checkbox"
                  checked={enabled}
                  disabled={blocked}
                  onChange={() => onChange(candidate.selection)}
                />{' '}
                <strong>{t(entry.title)}</strong>
                <EntryBadge entry={entry} /> <ModVersion entry={entry} />
              </label>
              {entry.link && (
                <ExternalLink className="button button-secondary" href={entry.link}>
                  {t('Скачать опциональный мод')}
                </ExternalLink>
              )}
            </div>
            {entry.description && <p className={s.description}>{t(entry.description)}</p>}
            {blocked && <ConflictList rules={candidate.conflicts} byId={byId} />}
          </li>
        );
      })}
    </ul>
  ) : (
    <p>{t('Опциональных модов нет.')}</p>
  );
}

function ReleaseHistory({ releases }) {
  const { t, language } = useTranslation();
  const formatDate = new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'ru-RU', {
    dateStyle: 'long',
    timeZone: 'UTC',
  });
  return (
    <ol className={s.releaseHistory}>
      {[...releases].reverse().map(({ version, date, entries }, index) => {
        const previous = releases[releases.length - index - 2];
        return (
          <li key={version}>
            <header>
              <h3>
                {t('Версия')} {version}
              </h3>
              <time dateTime={date}>{formatDate.format(new Date(date))}</time>
            </header>
            {previous ? (
              <ReleaseChanges previous={previous.entries} current={entries} />
            ) : (
              <p>{t('Первый выпуск')}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ReleaseChanges({ previous, current }) {
  const { t } = useTranslation();
  const { added, removed, versionChanges } = diffPresetEntries(previous, current);
  if (!added.length && !removed.length && !versionChanges.length) {
    return <p>{t('Состав и версии модов без изменений.')}</p>;
  }
  return (
    <>
      {[
        ['Добавлено', added],
        ['Удалено', removed],
      ].map(
        ([label, entries]) =>
          entries.length > 0 && (
            <div key={label}>
              <h4>{t(label)}</h4>
              <ul>
                {entries.map(({ id, title, version }) => (
                  <li key={id}>
                    {t(title)}
                    {version && <small> · {version}</small>}
                  </li>
                ))}
              </ul>
            </div>
          ),
      )}
      {versionChanges.length > 0 && (
        <div>
          <h4>{t('Изменения версий')}</h4>
          <ul>
            {versionChanges.map(({ entry, previousVersion }) => (
              <li key={entry.id}>
                {t(entry.title)}
                <small>
                  {' · '}
                  {previousVersion
                    ? `${previousVersion} → ${entry.version || t('Версия неизвестна')}`
                    : `${t('Версия уточнена')} · ${entry.version}`}
                </small>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function PresetVideo({ url, title }) {
  const { t } = useTranslation();
  const youtube = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(
    new URL(url).hostname,
  );
  const videoId = youtube ? youtubeVideoId(url) : null;
  return /^[\w-]{11}$/.test(videoId || '') ? (
    <Video videoId={videoId} title={t(title)} platforms={{ youtube: url }} />
  ) : (
    <ExternalLink href={url}>{t('Смотреть видео')}</ExternalLink>
  );
}

function ConflictList({ rules, byId, announce }) {
  const { t } = useTranslation();
  return rules.map(({ entries, reason }) => (
    <p key={entries.join('/')} role={announce ? 'alert' : undefined} className={s.reason}>
      {t('Несовместимые позиции')} — {entries.map((id) => t(byId.get(id).title)).join(' + ')}
      {reason && ` · ${t(reason)}`}
    </p>
  ));
}

function InactiveMods({ catalog, selection, active, byId, onChange }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const inactive = entriesByLoadOrder(catalog).filter(
    (entry) => isSelectable(entry) && !active.has(entry.id),
  );
  const matches = inactive.filter((entry) =>
    (type === 'all' || entry.type === type) &&
    `${entry.title} ${t(entry.title)} ${entry.family || ''} ${entry.variant || ''}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <label className={s.field}>
        {t('Поиск карт и модов')}
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
      </label>
      <label className={s.field}>
        {t('Фильтр по типу')}
        <select value={type} onChange={(event) => setType(event.target.value)}>
          <option value="all">{t('Все типы')}</option>
          <option value="map">{t('Карты')}</option>
          <option value="mod">{t('Моды')}</option>
        </select>
      </label>
      {matches.length ? (
        <ul className={s.inactiveMods}>
          {matches.map((entry) => {
            const candidate = addToCombo(catalog, selection, entry.id);
            return (
              <li key={entry.id}>
                <div className={s.inactiveRow}>
                  {entry.image && (
                    <img className={s.thumb} src={entry.image} alt="" loading="lazy" />
                  )}
                  <strong>
                    {t(entry.title)}
                    <EntryBadge entry={entry} />
                    <ModVersion entry={entry} />
                  </strong>
                  <button
                    type="button"
                    className="button button-secondary"
                    disabled={candidate.conflicts.length > 0}
                    aria-label={`${t('Подключить')} — ${t(entry.title)}`}
                    onClick={() => onChange(candidate.selection)}
                  >
                    {t('Подключить')}
                  </button>
                </div>
                <ConflictList rules={candidate.conflicts} byId={byId} />
              </li>
            );
          })}
        </ul>
      ) : (
        <p>
          {t(
            inactive.length
              ? 'По этому запросу моды не найдены.'
              : 'Все доступные карты и моды уже подключены.',
          )}
        </p>
      )}
    </>
  );
}
