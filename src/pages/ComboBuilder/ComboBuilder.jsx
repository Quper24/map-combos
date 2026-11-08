import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/Language';
import ExternalLink from '../../components/ui/ExternalLink';
import AutoProfileInstall from '../../components/AutoProfileInstall/AutoProfileInstall';
import { builderCatalogs } from '../../data/builderCatalogs';
import {
  addToCombo,
  entryBadge,
  entryTypeLabels,
  isSelectable,
  resolveCombo,
  serializeModOrder,
} from '../../lib/comboBuilder';
import { download, fileImage, orderImage, previewSize } from './downloads';
import s from './ComboBuilder.module.css';

const releaseKey = ({ game, version }) => `${game}-${version}`;

export default function ComboBuilder() {
  const { t } = useTranslation();
  const [release, setRelease] = useState(builderCatalogs[0]);
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow">ETS2 / ATS · 1.62+</span>
        <h1>{t('Конструктор сборок')}</h1>
        <p>
          {t(
            'Выбери карты или возьми готовый пресет. Фиксы, коннекторы и порядок файлов подберутся автоматически.',
          )}
        </p>
        {import.meta.env.DEV && import.meta.env.MODE === 'editor' && (
          <Link className="text-link" to="/combos/builder/editor">
            {t('Редактор каталога')}
          </Link>
        )}
      </div>
      {release ? (
        <>
          <label className={s.field}>
            {t('Версия игры')}
            <select
              value={releaseKey(release)}
              onChange={(event) =>
                setRelease(builderCatalogs.find((item) => releaseKey(item) === event.target.value))
              }
            >
              {builderCatalogs.map((item) => (
                <option key={releaseKey(item)} value={releaseKey(item)}>
                  {item.game.toUpperCase()} · {item.version}
                </option>
              ))}
            </select>
          </label>
          <Builder key={releaseKey(release)} catalog={release} />
        </>
      ) : (
        <div className="empty-state">
          <h2>{t('Каталог для конструктора готовится')}</h2>
          <Link className="button button-secondary" to="/combos">
            {t('Открыть готовые сборки')}
          </Link>
        </div>
      )}
    </div>
  );
}

export function Builder({ catalog }) {
  const { t } = useTranslation();
  const [presetId, setPresetId] = useState('');
  const preset = catalog.presets.find(({ id }) => id === presetId);
  const [selection, setSelection] = useState([]);
  const [query, setQuery] = useState('');
  const result = useMemo(() => resolveCombo(catalog, selection), [catalog, selection]);
  const byId = new Map(catalog.entries.map((entry) => [entry.id, entry]));
  const groups = new Map();
  for (const entry of catalog.entries.filter(isSelectable)) {
    const key = entry.family ? `family:${entry.family}` : entry.id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  const conflictText = ({ entries, reason }) => {
    const names = entries.map((id) => t(byId.get(id).title)).join(' + ');
    return `${t('Несовместимые позиции')} — ${names}${reason ? ` · ${t(reason)}` : ''}`;
  };
  const isPreset =
    preset &&
    selection.length === preset.selection.length &&
    preset.selection.every((id) => selection.includes(id));
  return (
    <>
      <div className={s.toolbar}>
        <label className={s.field}>
          {t('Готовая сборка')}
          <select
            value={presetId}
            onChange={(event) => {
              const id = event.target.value;
              setPresetId(id);
              setSelection(catalog.presets.find((item) => item.id === id)?.selection || []);
            }}
          >
            <option value="">{t('Своя сборка')}</option>
            {catalog.presets
              .filter((item) => !item.tags?.includes('server'))
              .map(({ id, title }) => (
                <option key={id} value={id}>
                  {t(title)}
                </option>
              ))}
          </select>
        </label>
        {preset?.boosty && (
          <ExternalLink className="button button-boosty" href={preset.boosty}>
            {t(isPreset ? 'Сборка на Boosty' : 'Исходная сборка на Boosty')}
          </ExternalLink>
        )}
        {isPreset && preset.profile && (
          <ExternalLink className="button button-secondary" href={preset.profile}>
            {t('Готовый профиль')}
          </ExternalLink>
        )}
        <label className={s.field}>
          {t('Поиск карт и модов')}
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
      </div>
      <div className={s.columns}>
        <section aria-label={t('Доступные карты и моды')}>
          <h2>{t('Доступные карты и моды')}</h2>
          <div className={s.cards}>
            {[...groups]
              .filter(([, items]) =>
                items.some((entry) =>
                  `${entry.title} ${t(entry.title)} ${entry.family || ''} ${entry.variant || ''}`
                    .toLowerCase()
                    .includes(query.trim().toLowerCase()),
                ),
              )
              .map(([key, items]) => (
                <article className={s.card} key={key}>
                  <h3>
                    {t(items[0].family || items[0].title)}
                    {!items[0].family && <EntryBadge entry={items[0]} />}
                  </h3>
                  {items.map((entry) => {
                    const selected = result.manual.has(entry.id);
                    const required = result.active.has(entry.id) && !selected;
                    const candidate =
                      !selected && !required ? addToCombo(catalog, selection, entry.id) : null;
                    return (
                      <div key={entry.id} className={s.variant}>
                        {entry.image && (
                          <img className={s.thumb} src={entry.image} alt="" loading="lazy" />
                        )}
                        {entry.variant && <strong>{t(entry.variant)}</strong>}
                        {entry.variant && <EntryBadge entry={entry} />}
                        {entry.version && <small className={s.modVersion}>{entry.version}</small>}
                        {entry.paid && <span className={s.paid}>{t('Платная')}</span>}
                        {entry.link && (
                          <ExternalLink className="text-link" href={entry.link}>
                            {t('Скачать')}
                          </ExternalLink>
                        )}
                        <button
                          type="button"
                          className="chip"
                          aria-pressed={selected || required}
                          disabled={required || Boolean(candidate?.conflicts.length)}
                          onClick={() =>
                            setSelection(
                              selected
                                ? selection.filter((id) => id !== entry.id)
                                : candidate.selection,
                            )
                          }
                        >
                          {t(
                            required ? 'Подключено автоматически' : selected ? 'Убрать' : 'Выбрать',
                          )}
                        </button>
                        {candidate?.conflicts.map((rule) => (
                          <p className={s.reason} key={rule.entries.join('/')}>
                            {conflictText(rule)}
                          </p>
                        ))}
                        {entry.description && (
                          <p className={s.description}>{t(entry.description)}</p>
                        )}
                      </div>
                    );
                  })}
                </article>
              ))}
          </div>
        </section>
        <section aria-label={t('Порядок загрузки')}>
          <h2>{t('Порядок загрузки')}</h2>
          {result.conflicts.map((rule) => (
            <p className={s.reason} role="alert" key={rule.entries.join('/')}>
              {conflictText(rule)}
            </p>
          ))}
          {result.files.length ? (
            <>
              <p role="status">
                {t(isPreset ? 'Готовая сборка' : 'Своя сборка')} · {t('Файлов — ')}
                {result.files.length}
              </p>
              {result.dlcs.length > 0 && (
                <p>
                  {t('Требуемые DLC')} · {result.dlcs.join(', ')}
                </p>
              )}
              <OrderList result={result} byId={byId} />
              {!result.conflicts.length && (
                <OrderDownloads
                  catalog={catalog}
                  files={result.files}
                  title={isPreset ? preset.title : 'Своя сборка'}
                />
              )}
            </>
          ) : (
            <p>{t('Выбери карты, чтобы увидеть порядок.')}</p>
          )}
        </section>
      </div>
    </>
  );
}

export function EntryBadge({ entry }) {
  const badge = entryBadge(entry);
  return badge ? (
    <span className={badge === 'NEW' ? s.newBadge : s.updateBadge}>{badge}</span>
  ) : null;
}

export function OrderList({
  result: { files, manual, reasons },
  byId,
  showLinks = true,
  compact = false,
  removals,
  onRemove,
}) {
  const { t } = useTranslation();
  const topFile = new Map(files.map((file) => [file.entry.id, file.key]));
  return (
    <ol className={s.order}>
      {[...files].reverse().map((file) => {
        const because = !manual.has(file.entry.id) && reasons.get(file.entry.id);
        const image = fileImage(file);
        const link = file.link || file.entry.link;
        const removal =
          topFile.get(file.entry.id) === file.key ? removals?.get(file.entry.id) : undefined;
        const removeLabel = t(file.entry.type === 'map' ? 'Отключить карту' : 'Отключить мод');
        const requiredBy = removal?.requiredBy.map((id) => t(byId.get(id).title)).join(' + ');
        return (
          <li key={file.key}>
            <div className={s.orderRow}>
              {image && <img className={s.thumb} src={image} alt="" loading="lazy" />}
              <div className={s.orderTitle}>
                <strong>{file.name}</strong>
                <EntryBadge entry={file.entry} />
                {!compact && (
                  <>
                    <code>{file.filename || file.key}</code>
                    <small>
                      {t(entryTypeLabels[file.entry.type])} · {t(file.entry.title)}
                    </small>
                    {because?.length > 0 && (
                      <small>
                        {t('Нужно для ')}
                        {because.map((id) => t(byId.get(id).title)).join(' + ')}
                      </small>
                    )}
                    {file.entry.autoWithMaps && !because?.length && (
                      <small>{t('Подключается при выборе любой карты')}</small>
                    )}
                  </>
                )}
              </div>
              {(removal || (showLinks && link)) && (
                <div className={s.orderActions}>
                  {showLinks && link && (
                    <ExternalLink className="button" href={link}>
                      {t('Скачать')}
                    </ExternalLink>
                  )}
                  {removal && (
                    <button
                      type="button"
                      className="button button-secondary"
                      disabled={Boolean(requiredBy)}
                      title={requiredBy ? t('Нужно для ') + requiredBy : undefined}
                      aria-label={`${removeLabel} — ${t(file.entry.title)}`}
                      onClick={() => onRemove(removal.selection)}
                    >
                      {removeLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function OrderDownloads({ catalog, files, title }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const modBlock = serializeModOrder(files);
  const prefix = releaseKey(catalog);
  const count = Math.ceil(files.length / previewSize);
  async function saveImage(part) {
    setBusy(true);
    setFailed(false);
    try {
      const offset = part * previewSize;
      const page = [...files].reverse().slice(offset, offset + previewSize);
      const blob = await orderImage(
        page,
        offset,
        `${t(title)} · ${catalog.game.toUpperCase()} ${catalog.version} · ${part + 1}/${count}`,
      );
      download(blob, `${prefix}-order-${part + 1}.png`);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={s.downloads}>
      <div className={s.actions}>
        <button
          className="button button-secondary"
          onClick={() =>
            download(
              new Blob([modBlock], { type: 'text/plain;charset=utf-8' }),
              `${prefix}-active-mods.txt`,
            )
          }
        >
          {t('Скачать список')}
        </button>
        {Array.from({ length: count }, (_, part) => (
          <button
            key={part}
            className="button button-secondary"
            disabled={busy}
            onClick={() => saveImage(part)}
          >
            {t('Скачать PNG')}
            {count > 1 && ` ${part + 1}/${count}`}
          </button>
        ))}
      </div>
      {failed && <p role="alert">{t('Не удалось создать картинку порядка.')}</p>}
      <h3>{t('Автоматическая расстановка')}</h3>
      <p>{t('Авторасстановка полностью заменит список активных модов в скачанном профиле.')}</p>
      <AutoProfileInstall
        combo={{ id: prefix, tags: [catalog.game], title, version_game: catalog.version }}
        modBlock={modBlock}
      />
    </div>
  );
}
