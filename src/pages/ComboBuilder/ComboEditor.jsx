import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { builderCatalogs } from '../../data/builderCatalogs';
import { useTranslation } from '../../i18n/Language';
import {
  canAutoWithMaps,
  catalogDate,
  entryTypeLabels,
  isFixOrConnector,
  isSelectable,
  mergeModOrders,
  moveMod,
  parseModOrder,
  reconcilePresetSelections,
  replaceEntryFiles,
  validateCatalog,
} from '../../lib/comboBuilder';
import { processProfile } from '../../lib/processProfile';
import { MAX_PROFILE_SIZE } from '../../lib/profileMods';
import { Builder } from './ComboBuilder';
import PresetContent from './PresetContent';
import { builderDraftKey, readBuilderDraft, restorePresetFileSlugs } from '../../lib/builderDraft';
import { attachPresetFiles, catalogKey, presetFileName, presetTags } from '../../lib/presetCombos';
import { tagUtils } from '../../utils/tags';
import EditorImageField from './EditorImageField';
import { download } from './downloads';
import s from './ComboBuilder.module.css';

const blank = { game: 'ats', version: '1.62', entries: [], order: [], conflicts: [], presets: [] };

function getForm(event) {
  event.preventDefault();
  return new FormData(event.currentTarget);
}

const valueOf = (form, key) => form.get(key)?.trim() || undefined;
const replace = (list, key, item) =>
  list.some((existing) => existing[key] === item[key])
    ? list.map((existing) => (existing[key] === item[key] ? item : existing))
    : [...list, item];

function downloadJson(data, name) {
  download(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' }), name);
}

function Field({ label, ...props }) {
  const { t } = useTranslation();
  return (
    <label className={s.field}>
      {t(label)}
      <input {...props} />
    </label>
  );
}

function Choices({ label, name, items, selected = [], onChecked, disabled = false }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  return (
    <fieldset className={s.choices} disabled={disabled}>
      <legend>{t(label)}</legend>
      <Field
        label="Фильтр списка"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className={s.choiceList}>
        {items.map(({ id, title }) => (
          <label
            key={id}
            hidden={!`${title} ${id}`.toLowerCase().includes(query.trim().toLowerCase())}
          >
            <input
              type="checkbox"
              name={name}
              value={id}
              defaultChecked={selected.includes(id)}
              onChange={onChecked ? (event) => onChecked(id, event.target.checked) : undefined}
            />{' '}
            {t(title)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function ComboEditor() {
  const { t } = useTranslation();
  const [catalog, setCatalog] = useState(() =>
    restorePresetFileSlugs(readBuilderDraft() || blank, builderCatalogs),
  );
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(null);
  const [revision, setRevision] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [entryRequest, setEntryRequest] = useState({ id: '', files: [], key: 0 });
  const unassigned = unassignedFiles(catalog);
  function editImportedFiles(id, files) {
    setEntryRequest(({ key }) => ({ id, files, key: key + 1 }));
    requestAnimationFrame(() => document.getElementById('combo-entry-editor')?.focus());
  }
  function commit(next) {
    try {
      validateCatalog(next, true);
    } catch (error) {
      setNotice(error.message);
      return false;
    }
    setCatalog(next);
    try {
      localStorage.setItem(builderDraftKey, JSON.stringify(next));
      setNotice('Черновик сохранён в этом браузере.');
    } catch {
      setNotice('Хранилище браузера недоступно. Скачай черновик JSON.');
    }
    return true;
  }
  async function loadOrder(file) {
    setPending(null);
    const isProfile = file.name.toLowerCase().endsWith('.sii');
    if (isProfile && (!file.size || file.size > MAX_PROFILE_SIZE))
      throw new Error('Выбери непустой profile.sii размером до 300 КБ.');
    const source = isProfile ? await processProfile(await file.arrayBuffer()) : await file.text();
    const files = parseModOrder(source);
    if (!files.length) throw new Error('The template contains no files');
    setPending(files);
  }
  async function readInput(event, handler) {
    const files = Array.from(event.currentTarget.files);
    event.currentTarget.value = '';
    if (!files.length) return;
    setBusy(true);
    try {
      if (files.some((file) => file.size > 5 * 1024 * 1024)) throw new Error('File exceeds 5 MB');
      await handler(files);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function openCatalog(files) {
    const records = await Promise.all(files.map(async (file) => JSON.parse(await file.text())));
    const shared = records.filter((record) => !Object.hasOwn(record ?? {}, 'preset'));
    if (shared.length > 1) throw new Error('Выбери один общий каталог и файлы его сборок.');
    const base = validateCatalog(shared.length ? shared[0] : catalog, true);
    const presetFiles = records.filter((record) => Object.hasOwn(record ?? {}, 'preset'));
    const importedIds = new Set(presetFiles.map((file) => file.preset?.id));
    const [next] = attachPresetFiles(
      [{ ...base, presets: base.presets.filter(({ id }) => !importedIds.has(id)) }],
      presetFiles,
    );
    if (commit(restorePresetFileSlugs(next, builderCatalogs))) {
      setPending(null);
      setEntryRequest({ id: '', files: [], key: 0 });
      setShowPreview(false);
      setRevision((number) => number + 1);
    }
  }
  function applyImport(preferImported) {
    const { order } = mergeModOrders(catalog.order, pending, preferImported);
    if (commit({ ...catalog, order })) setPending(null);
  }
  function exportCatalog(publish) {
    try {
      const data = publish ? { ...catalog, presets: [] } : catalog;
      validateCatalog(data, !publish);
      downloadJson(data, `${catalogKey(catalog)}${publish ? '' : '-draft'}.json`);
    } catch (error) {
      setNotice(error.message);
    }
  }
  function exportPreset(preset) {
    try {
      validateCatalog({ ...catalog, presets: [preset] });
      downloadJson(
        { game: catalog.game, version: catalog.version, preset },
        presetFileName(catalog, preset),
      );
    } catch (error) {
      setNotice(error.message);
    }
  }
  const imported = pending && mergeModOrders(catalog.order, pending);
  const displayOrder = imported ? [...imported.order].reverse() : [];
  const incomingOrder = imported?.orderConflict
    ? mergeModOrders(catalog.order, pending, true).order.slice().reverse()
    : [];
  return (
    <div className="container page">
      <div className="page-heading">
        <span className="eyebrow">ETS2 / ATS</span>
        <h1>{t('Редактор каталога')}</h1>
        <p>
          {t(
            'Начни с импорта профиля ниже. JSON создаётся в редакторе и нужен для переноса черновика или публикации каталога.',
          )}
        </p>
        <Link className="text-link" to="/combos/builder">
          {t('Конструктор сборок')}
        </Link>
      </div>
      <div className={s.editorGrid} key={revision}>
        <section className={s.panel}>
          <h2>{t('Каталог')}</h2>
          <form
            className={s.toolbar}
            key={`${catalog.game}-${catalog.version}`}
            onSubmit={(event) => {
              const form = getForm(event);
              commit({ ...catalog, game: form.get('game'), version: form.get('version') });
            }}
          >
            <label className={s.field}>
              {t('Игра')}
              <select name="game" defaultValue={catalog.game}>
                <option value="ets2">ETS2</option>
                <option value="ats">ATS</option>
              </select>
            </label>
            <Field
              label="Версия игры"
              name="version"
              defaultValue={catalog.version}
              required
              pattern="1\.\d+"
            />
            <button className="button button-secondary">{t('Сохранить')}</button>
          </form>
          <div className={s.toolbar}>
            <Field
              label="Открыть сохранённый JSON"
              type="file"
              accept=".json"
              multiple
              disabled={busy}
              onChange={(event) => readInput(event, openCatalog)}
            />
            <button className="button button-secondary" onClick={() => exportCatalog(false)}>
              {t('Скачать черновик JSON')}
            </button>
            <button className="button" onClick={() => exportCatalog(true)}>
              {t('Выгрузить общий каталог')}
            </button>
          </div>
          <p>
            {t(
              'Для публикации выгрузи общий каталог и JSON каждой готовой сборки. Их можно открыть вместе.',
            )}
          </p>
        </section>
        <section className={s.panel}>
          <h2>{t('Импорт порядка')}</h2>
          <p>
            {t(
              'Выбери profile.sii или TXT с active_mods. Редактор прочитает список модов в браузере и покажет порядок перед импортом.',
            )}
          </p>
          <div className={s.toolbar}>
            <Field
              label="Загрузить шаблон"
              type="file"
              accept=".txt,.sii"
              disabled={busy}
              onChange={(event) => readInput(event, ([file]) => loadOrder(file))}
            />
          </div>
          {pending && (
            <div className={s.importPreview}>
              <p>
                {t('Всего файлов после объединения — ')}
                {displayOrder.length}
              </p>
              {imported.orderConflict && (
                <p className={s.reason}>
                  {t('Общие файлы идут в разном порядке. Выбери, какой порядок сохранить.')}
                </p>
              )}
              <ol className={s.importList}>
                {displayOrder.map((file) => (
                  <li key={file.key}>{file.name}</li>
                ))}
              </ol>
              {incomingOrder.length > 0 && (
                <details>
                  <summary>{t('Предпросмотр порядка из файла')}</summary>
                  <ol className={s.importList}>
                    {incomingOrder.map((file) => (
                      <li key={file.key}>{file.name}</li>
                    ))}
                  </ol>
                </details>
              )}
              <div className={s.actions}>
                <button className="button" onClick={() => applyImport(false)}>
                  {t(
                    !catalog.order.length
                      ? 'Импортировать порядок'
                      : imported.orderConflict
                        ? 'Сохранить текущий порядок'
                        : 'Объединить списки',
                  )}
                </button>
                {imported.orderConflict && (
                  <button className="button" onClick={() => applyImport(true)}>
                    {t('Применить порядок из файла')}
                  </button>
                )}
                <button className="button button-secondary" onClick={() => setPending(null)}>
                  {t('Отмена')}
                </button>
              </div>
            </div>
          )}
        </section>
        {unassigned.length > 0 && (
          <ImportedFiles files={unassigned} entries={catalog.entries} onEdit={editImportedFiles} />
        )}
        <EntryEditor
          key={entryRequest.key}
          catalog={catalog}
          commit={commit}
          request={entryRequest}
          unassigned={unassigned}
          onError={setNotice}
        />
        <OrderEditor catalog={catalog} commit={commit} />
        <RulesEditor catalog={catalog} commit={commit} />
        <PresetEditor catalog={catalog} commit={commit} onExport={exportPreset} />
        <section className={s.panel}>
          <h2>{t('Предпросмотр конструктора')}</h2>
          <button className="button button-secondary" onClick={() => setShowPreview(!showPreview)}>
            {t(showPreview ? 'Скрыть предпросмотр' : 'Открыть предпросмотр')}
          </button>
          {showPreview && <Builder key={JSON.stringify(catalog)} catalog={catalog} />}
        </section>
        {notice && (
          <p className={s.notice} role="status">
            {t(notice)}
          </p>
        )}
      </div>
    </div>
  );
}

function unassignedFiles(catalog) {
  const assigned = new Set(catalog.entries.flatMap((entry) => entry.files));
  return catalog.order.filter(({ key }) => !assigned.has(key)).reverse();
}

function ImportedFiles({ files, entries, onEdit }) {
  const { t } = useTranslation();
  const [id, setId] = useState('');
  const [missing, setMissing] = useState(false);
  return (
    <section className={s.panel}>
      <h2>
        {t('Файлы без привязки')} · {files.length}
      </h2>
      <p>{t('Отметь все части одной карты или мода, затем открой их как одну запись.')}</p>
      <form
        onSubmit={(event) => {
          const keys = getForm(event).getAll('imported');
          setMissing(!keys.length);
          if (keys.length) onEdit(id, keys);
        }}
      >
        <Choices
          label="Файлы из общего порядка"
          name="imported"
          items={files.map(({ key, name }) => ({ id: key, title: name }))}
        />
        <div className={s.toolbar}>
          <EntityPicker items={entries} id={id} setId={setId} />
          <button className="button">
            {t(id ? 'Привязать к записи' : 'Заполнить новую запись')}
          </button>
        </div>
        {missing && (
          <p className={s.reason} role="alert">
            {t('Отметь хотя бы один файл.')}
          </p>
        )}
      </form>
    </section>
  );
}

function readFileFields(form, key, prefix = '') {
  return {
    key,
    name: form.get(`${prefix}name`),
    filename: valueOf(form, `${prefix}filename`),
    link: valueOf(form, `${prefix}link`),
    image: valueOf(form, `${prefix}image`),
  };
}

function FileFields({ file, prefix = '' }) {
  return (
    <>
      <Field
        label="Имя в менеджере модов"
        name={`${prefix}name`}
        defaultValue={file?.name}
        required
      />
      <Field
        label="Имя файла с расширением"
        name={`${prefix}filename`}
        defaultValue={file?.filename}
      />
      <Field label="Ссылка на файл" type="url" name={`${prefix}link`} defaultValue={file?.link} />
      <EditorImageField
        name={`${prefix}image`}
        initialPath={file?.image}
        label="Загрузить картинку файла"
      />
    </>
  );
}

function OrderEditor({ catalog, commit }) {
  const { t } = useTranslation();
  const [fileKey, setFileKey] = useState(null);
  const [anchor, setAnchor] = useState('');
  const [query, setQuery] = useState('');
  const dragging = useRef(null);
  const { order } = catalog;
  const owners = new Map(
    catalog.entries.flatMap((entry) => entry.files.map((key) => [key, entry.title])),
  );
  const rows = [...order].reverse();
  const file = order.find(({ key }) => key === fileKey);
  const move = (key, target, above) =>
    commit({ ...catalog, order: moveMod(order, key, target, above) });
  return (
    <section className={s.panel}>
      <h2>{t('Общий порядок файлов')}</h2>
      <p>
        {t(
          'Это шаблон расположения всех файлов. Сборка берёт из него нужные строки в том же порядке. Верх списка соответствует наивысшему приоритету.',
        )}
      </p>
      <details>
        <summary>{t('Что означают поля файла')}</summary>
        <dl>
          <dt>{t('Ключ файла в профиле')}</dt>
          <dd>
            {t(
              'Идентификатор перед знаком | в profile.sii. При импорте заполняется автоматически.',
            )}
          </dd>
          <dt>{t('Имя в менеджере модов')}</dt>
          <dd>{t('Название после знака | в profile.sii. Оно видно в списке и на PNG.')}</dd>
          <dt>{t('Имя файла с расширением')}</dt>
          <dd>{t('Необязательное имя для подсказки игроку, например map.scs.')}</dd>
          <dt>{t('Ссылка на файл')}</dt>
          <dd>
            {t(
              'Необязательная отдельная ссылка. По умолчанию файл использует общую ссылку карты или мода.',
            )}
          </dd>
          <dt>{t('Загрузить картинку файла')}</dt>
          <dd>
            {t(
              'Выбери картинку для этой строки порядка. Редактор сохранит её и заполнит путь сам.',
            )}
          </dd>
          <dt>{t('Путь к картинке (/img/…)')}</dt>
          <dd>
            {t(
              'Внутренний адрес картинки на сайте. Его можно указать вручную для уже добавленного изображения.',
            )}
          </dd>
        </dl>
      </details>
      <div className={s.toolbar}>
        <Field
          label="Поиск файлов"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="button button-secondary" onClick={() => setFileKey('')}>
          {t('Добавить файл вручную')}
        </button>
      </div>
      {rows.length > 0 && (
        <ol className={s.editOrder}>
          {rows.map((item, index) => (
            <li
              key={item.key}
              hidden={
                !`${item.name} ${item.key} ${item.filename || ''}`
                  .toLowerCase()
                  .includes(query.trim().toLowerCase())
              }
              draggable
              onDragStart={(event) => {
                dragging.current = item.key;
                event.dataTransfer.setData('text/plain', item.key);
                event.dataTransfer.effectAllowed = 'move';
              }}
              onDragEnd={() => {
                dragging.current = null;
              }}
              onDragOver={(event) => {
                if (dragging.current) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const bounds = event.currentTarget.getBoundingClientRect();
                if (dragging.current)
                  move(dragging.current, item.key, event.clientY < bounds.top + bounds.height / 2);
              }}
            >
              <button
                type="button"
                className="chip"
                onClick={() => {
                  setFileKey(item.key);
                  setAnchor('');
                }}
                aria-pressed={fileKey === item.key}
              >
                {index + 1}. {item.name}
              </button>
              <small>{owners.get(item.key) || t('Без привязки')}</small>
            </li>
          ))}
        </ol>
      )}
      {file && order.length > 1 && (
        <div className={s.toolbar}>
          <label className={s.field}>
            {t('Соседний файл')}
            <select value={anchor} onChange={(event) => setAnchor(event.target.value)}>
              <option value="">{t('Выбрать файл')}</option>
              {rows
                .filter((item) => item.key !== fileKey)
                .map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.name} · {item.key}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="button button-secondary"
            disabled={!anchor}
            onClick={() => move(fileKey, anchor, true)}
          >
            {t('Поставить выше')}
          </button>
          <button
            className="button button-secondary"
            disabled={!anchor}
            onClick={() => move(fileKey, anchor, false)}
          >
            {t('Поставить ниже')}
          </button>
        </div>
      )}
      {fileKey !== null && (
        <form
          className={s.form}
          key={file?.key || 'new'}
          onSubmit={(event) => {
            const form = getForm(event);
            const key = file?.key || valueOf(form, 'key');
            const next = readFileFields(form, key);
            if (
              commit({
                ...catalog,
                order: file ? replace(order, 'key', next) : [...order, next],
              })
            )
              setFileKey(key);
          }}
        >
          <Field
            label="Ключ файла в профиле"
            name="key"
            defaultValue={file?.key}
            readOnly={Boolean(file)}
            required
          />
          <FileFields file={file} />
          <div className={s.actions}>
            <button className="button">{t('Сохранить файл')}</button>
            {file && !owners.has(file.key) && (
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  if (commit({ ...catalog, order: order.filter(({ key }) => key !== fileKey) })) {
                    setFileKey(null);
                    setAnchor('');
                  }
                }}
              >
                {t('Удалить файл')}
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

const filePrefix = (key) => `part:${key}:`;

function EntryFiles({ order, selected }) {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(() => new Set(selected));
  const [visited, setVisited] = useState(() => new Set(selected));

  function toggle(key, included) {
    setChecked((current) => {
      const next = new Set(current);
      if (included) next.add(key);
      else next.delete(key);
      return next;
    });
    if (included) setVisited((current) => new Set([...current, key]));
  }

  return (
    <>
      <Choices
        label="Файлы позиции"
        name="files"
        selected={selected}
        items={order.map(({ key, name }) => ({ id: key, title: name }))}
        onChecked={toggle}
      />
      {visited.size > 0 && (
        <div className={s.entryFiles}>
          {checked.size > 0 && (
            <>
              <h3>{t('Картинки и настройки отдельных файлов')}</h3>
              <p>
                {t(
                  'Картинка каждого файла попадёт в свою строку PNG. Чтобы использовать одну общую ссылку, оставь ссылки на файлы пустыми.',
                )}
              </p>
            </>
          )}
          <div className={s.fileParts}>
            {order
              .filter(({ key }) => visited.has(key))
              .map((file) => (
                <fieldset
                  className={s.filePart}
                  key={file.key}
                  hidden={!checked.has(file.key)}
                  disabled={!checked.has(file.key)}
                >
                  <legend>{file.name}</legend>
                  <FileFields file={file} prefix={filePrefix(file.key)} />
                </fieldset>
              ))}
          </div>
        </div>
      )}
    </>
  );
}

function EntryActivationFields({ entry, dependencies }) {
  const { t } = useTranslation();
  const [type, setType] = useState(entry?.type || 'map');
  const [auto, setAuto] = useState(Boolean(entry?.autoWithMaps));
  const autoAvailable = canAutoWithMaps(type);
  const autoEnabled = autoAvailable && auto;
  return (
    <>
      <label className={s.field}>
        {t('Тип')}
        <select name="type" value={type} onChange={(event) => setType(event.target.value)}>
          {Object.entries(entryTypeLabels).map(([id, label]) => (
            <option key={id} value={id}>
              {t(label)}
            </option>
          ))}
        </select>
      </label>
      {autoAvailable && (
        <label>
          <input
            type="checkbox"
            name="autoWithMaps"
            checked={auto}
            onChange={(event) => setAuto(event.target.checked)}
          />{' '}
          {t('Подключать при выборе любой карты')}
        </label>
      )}
      {autoEnabled && (
        <p className={s.entryFiles}>{t('Этот режим заменяет список обязательных зависимостей.')}</p>
      )}
      {type === 'resource' && (
        <p className={s.entryFiles}>
          {t('Добавь этот пакет в зависимости каждой карты, которой он нужен.')}
        </p>
      )}
      <Choices
        label={
          type === 'resource'
            ? 'Что требуется самому пакету'
            : 'Обязательные зависимости (все перечисленные)'
        }
        name="requires"
        selected={entry?.requires}
        items={dependencies}
        disabled={autoEnabled}
      />
      {isFixOrConnector(type) && (
        <Choices
          label="Альтернативные зависимости (достаточно одной)"
          name="requiresAny"
          selected={entry?.requiresAny}
          items={dependencies}
          disabled={autoEnabled}
        />
      )}
    </>
  );
}

function EntryEditor({ catalog, commit, request, unassigned, onError }) {
  const { t } = useTranslation();
  const [id, setId] = useState(request.id);
  const [seedFiles, setSeedFiles] = useState(request.files);
  const [formRevision, setFormRevision] = useState(0);
  const entry = catalog.entries.find((item) => item.id === id);
  const suggested = catalog.order.find(({ key }) => key === seedFiles[0]);
  const suggestedId = suggested?.key
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const byKey = new Map(catalog.order.map((file) => [file.key, file]));
  const owned = new Set(
    catalog.entries.filter((item) => item.id !== id).flatMap((item) => item.files),
  );
  return (
    <section className={s.panel}>
      <h2 id="combo-entry-editor" tabIndex={-1}>
        {t('Карты, моды, фиксы и коннекторы')}
      </h2>
      <EntityPicker
        items={catalog.entries}
        id={id}
        setId={(next) => {
          setId(next);
          setSeedFiles([]);
        }}
      />
      <form
        className={s.form}
        key={`${id}:${formRevision}`}
        onSubmit={(event) => {
          const form = getForm(event);
          const replacements = new Map();
          for (const key of entry?.files || []) {
            const newKey = valueOf(form, `replace:${key}`);
            if (newKey) replacements.set(key, newKey);
          }
          const files = form.getAll('files');
          const fileKeys = new Set(files);
          const order = catalog.order.map((file) =>
            fileKeys.has(file.key)
              ? { ...file, ...readFileFields(form, file.key, filePrefix(file.key)) }
              : file,
          );
          let fileChanges;
          try {
            fileChanges = replaceEntryFiles(order, files, replacements);
          } catch (error) {
            onError(error.message);
            return;
          }
          const addedAt = valueOf(form, 'addedAt') || (!entry ? catalogDate() : undefined);
          const modVersion = valueOf(form, 'modVersion');
          const type = form.get('type');
          const alternatives = form.getAll('requiresAny');
          const markUpdate =
            entry &&
            (replacements.size ||
              event.nativeEvent.submitter?.value === 'update' ||
              (entry.version && modVersion && entry.version !== modVersion));
          const next = {
            id: entry?.id || valueOf(form, 'id'),
            title: valueOf(form, 'title'),
            type,
            autoWithMaps: form.has('autoWithMaps') || undefined,
            link: valueOf(form, 'link'),
            image: valueOf(form, 'image'),
            description: valueOf(form, 'description'),
            version: modVersion,
            addedAt,
            updatedAt: markUpdate ? catalogDate() : valueOf(form, 'updatedAt'),
            paid: form.has('paid'),
            family: type === 'map' ? valueOf(form, 'family') : undefined,
            variant: type === 'map' ? valueOf(form, 'variant') : undefined,
            files: fileChanges.files,
            requires: form.getAll('requires'),
            requiresAny: alternatives.length ? alternatives : undefined,
            dlcs: (valueOf(form, 'dlcs') || '')
              .split(',')
              .map((dlc) => dlc.trim())
              .filter(Boolean),
          };
          const entries = entry ? replace(catalog.entries, 'id', next) : [...catalog.entries, next];
          const presets = reconcilePresetSelections(catalog.presets, next);
          if (commit({ ...catalog, entries, presets, order: fileChanges.order })) {
            setId(next.id);
            setSeedFiles([]);
            setFormRevision((number) => number + 1);
          }
        }}
      >
        <Field
          label="Идентификатор (a-z, 0-9, дефис)"
          name="id"
          defaultValue={entry?.id || suggestedId}
          readOnly={Boolean(entry)}
          required
        />
        <Field
          label="Название"
          name="title"
          defaultValue={entry?.title || suggested?.name}
          required
        />
        <EntryActivationFields
          entry={entry}
          dependencies={catalog.entries.filter((item) => item.id !== id)}
        />
        <Field
          label="Общая ссылка на скачивание"
          name="link"
          type="url"
          defaultValue={entry?.link}
        />
        <Field label="Версия мода" name="modVersion" defaultValue={entry?.version} />
        <Field
          label="Дата добавления"
          name="addedAt"
          type="date"
          defaultValue={entry ? entry.addedAt : catalogDate()}
        />
        <Field
          label="Дата обновления"
          name="updatedAt"
          type="date"
          defaultValue={entry?.updatedAt}
        />
        <label className={s.field}>
          {t('Описание мода')}
          <textarea name="description" rows={3} defaultValue={entry?.description} />
        </label>
        <EditorImageField initialPath={entry?.image} label="Загрузить обложку для карточки" />
        <Field label="Семейство карты" name="family" defaultValue={entry?.family} />
        <Field label="Вариант карты" name="variant" defaultValue={entry?.variant} />
        <Field
          label="Требуемые DLC через запятую"
          name="dlcs"
          defaultValue={entry?.dlcs?.join(', ')}
        />
        <label>
          <input type="checkbox" name="paid" defaultChecked={entry?.paid} /> {t('Платная')}
        </label>
        <EntryFiles
          selected={[...(entry?.files || []), ...seedFiles]}
          order={[...catalog.order].reverse().filter(({ key }) => !owned.has(key))}
        />
        {entry?.files.length > 0 && unassigned.length > 0 && (
          <details className={s.replacement}>
            <summary>{t('Заменить файлы новой версией')}</summary>
            <p>
              {t(
                'Выбери замену из непривязанных файлов. Новый файл займёт место старого в порядке загрузки.',
              )}
            </p>
            {entry.files.map((key) => (
              <label className={s.field} key={key}>
                {byKey.get(key).name}
                <select name={`replace:${key}`} defaultValue="">
                  <option value="">{t('Оставить текущий файл')}</option>
                  {unassigned.map((file) => (
                    <option key={file.key} value={file.key}>
                      {file.name} · {file.key}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </details>
        )}
        <div className={s.actions}>
          <button className="button">{t('Сохранить позицию')}</button>
          {entry && (
            <button className="button button-secondary" value="update">
              {t('Сохранить как обновление')}
            </button>
          )}
          {entry && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                if (
                  commit({ ...catalog, entries: catalog.entries.filter((item) => item.id !== id) })
                )
                  setId('');
              }}
            >
              {t('Удалить позицию')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function EntityPicker({ items, id, setId }) {
  const { t } = useTranslation();
  return (
    <label className={s.field}>
      {t('Что редактировать')}
      <select value={id} onChange={(event) => setId(event.target.value)}>
        <option value="">{t('Новая запись')}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title} · {item.id}
          </option>
        ))}
      </select>
    </label>
  );
}

function RulesEditor({ catalog, commit }) {
  const { t } = useTranslation();
  const { entries, conflicts } = catalog;
  const [index, setIndex] = useState(-1);
  const rule = conflicts[index];
  const name = (id) => entries.find((entry) => entry.id === id)?.title;
  return (
    <section className={s.panel}>
      <h2>{t('Конфликты')}</h2>
      <EntityPicker
        items={conflicts.map((item, position) => ({
          id: String(position),
          title: item.entries.map(name).join(' + '),
        }))}
        id={rule ? String(index) : ''}
        setId={(id) => setIndex(id === '' ? -1 : Number(id))}
      />
      <form
        className={s.form}
        key={index}
        onSubmit={(event) => {
          const form = getForm(event);
          const next = {
            entries: [form.get('first'), form.get('second')],
            reason: valueOf(form, 'reason'),
          };
          if (
            commit({
              ...catalog,
              conflicts: rule
                ? conflicts.map((item, position) => (position === index ? next : item))
                : [...conflicts, next],
            })
          ) {
            setIndex(rule ? index : conflicts.length);
          }
        }}
      >
        {['first', 'second'].map((field, position) => (
          <label className={s.field} key={field}>
            {t(position ? 'Вторая позиция' : 'Первая позиция')}
            <select name={field} defaultValue={rule?.entries[position] || ''} required>
              <option value="">{t('Выбрать позицию')}</option>
              {entries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.title}
                </option>
              ))}
            </select>
          </label>
        ))}
        <Field label="Причина конфликта" name="reason" defaultValue={rule?.reason} />
        <div className={s.actions}>
          <button className="button">{t('Сохранить конфликт')}</button>
          {rule && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                if (
                  commit({
                    ...catalog,
                    conflicts: conflicts.filter((_, position) => position !== index),
                  })
                )
                  setIndex(-1);
              }}
            >
              {t('Удалить конфликт')}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

function PresetEditor({ catalog, commit, onExport }) {
  const { t } = useTranslation();
  const [id, setId] = useState('');
  const preset = catalog.presets.find((item) => item.id === id);
  return (
    <section className={s.panel}>
      <h2>{t('Готовые сборки')}</h2>
      <p>
        {t(
          'Локальный каталог показывает сборку из JSON, если файл уже добавлен в проект. Изменения черновика можно проверить в предпросмотре ниже.',
        )}
      </p>
      <Link className="text-link" to={`/combos?version=${catalog.version}`}>
        {t('Открыть готовые сборки')}
      </Link>
      <EntityPicker items={catalog.presets} id={id} setId={setId} />
      <form
        className={s.form}
        key={id}
        onSubmit={(event) => {
          const form = getForm(event);
          const next = {
            id: preset?.id || valueOf(form, 'id'),
            title: valueOf(form, 'title'),
            fileSlug: valueOf(form, 'fileSlug'),
            boosty: valueOf(form, 'boosty'),
            profile: valueOf(form, 'profile'),
            video: valueOf(form, 'video'),
            image: valueOf(form, 'image'),
            tags: form.getAll('tags'),
            updatedAt: catalogDate(),
            selection: form.getAll('selection'),
          };
          const presets = preset
            ? replace(catalog.presets, 'id', next)
            : [...catalog.presets, next];
          if (commit({ ...catalog, presets })) setId(next.id);
        }}
      >
        <Field
          label="Идентификатор (a-z, 0-9, дефис)"
          name="id"
          defaultValue={preset?.id}
          readOnly={Boolean(preset)}
          required
        />
        <Field label="Название" name="title" defaultValue={preset?.title} required />
        <Field
          label="Короткое имя файла сборки"
          name="fileSlug"
          defaultValue={preset?.fileSlug}
          placeholder="quper-map"
          pattern="[a-z0-9]+(?:\x2D[a-z0-9]+)*"
        />
        <Field label="Игра" value={catalog.game.toUpperCase()} readOnly />
        <Field label="Версия игры" value={catalog.version} readOnly />
        <Field
          label="Ссылка на пост Boosty"
          name="boosty"
          type="url"
          defaultValue={preset?.boosty}
        />
        <Field
          label="Ссылка на готовый профиль"
          name="profile"
          type="url"
          defaultValue={preset?.profile}
        />
        <Field label="Ссылка на видеообзор" name="video" type="url" defaultValue={preset?.video} />
        <EditorImageField initialPath={preset?.image} label="Загрузить обложку для карточки" />
        <fieldset className={s.choices}>
          <legend>{t('Теги сборки')}</legend>
          <div className={s.choiceList}>
            {presetTags.map((tag) => (
              <label key={tag}>
                <input
                  type="checkbox"
                  name="tags"
                  value={tag}
                  defaultChecked={preset?.tags?.includes(tag)}
                />{' '}
                {t(tagUtils.getLabel(tag))}
              </label>
            ))}
          </div>
        </fieldset>
        <Choices
          label="Выбранные карты и моды"
          name="selection"
          selected={preset?.selection}
          items={catalog.entries.filter(isSelectable)}
        />
        <div className={s.actions}>
          <button className="button">{t('Сохранить сборку')}</button>
          {preset && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => onExport(preset)}
            >
              {t('Выгрузить сборку JSON')}
            </button>
          )}
          {preset && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => {
                if (
                  commit({ ...catalog, presets: catalog.presets.filter((item) => item.id !== id) })
                )
                  setId('');
              }}
            >
              {t('Удалить сборку')}
            </button>
          )}
        </div>
      </form>
      {preset && (
        <p>
          {t('Файл сборки')} · <code>{presetFileName(catalog, preset)}</code>
        </p>
      )}
      {preset && (
        <details>
          <summary>{t('Предпросмотр страницы сборки')}</summary>
          <PresetContent key={preset.id} catalog={catalog} preset={preset} share={false} />
        </details>
      )}
    </section>
  );
}
