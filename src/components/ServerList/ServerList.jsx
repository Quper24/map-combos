import { useState } from 'react';
import { Link } from 'react-router-dom';
import servers from '../../../content/servers.json';
import Icon from '../ui/Icon';
import s from './ServerList.module.css';

function CopyField({ label, value, serverName, game }) {
  const [status, setStatus] = useState('');
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      setStatus('error');
    }
  }
  return (
    <div className={s.field}>
      <dt className={s.fieldLabel}>{label}</dt>
      <dd className={s.fieldValue}>
        <span className={label === 'Сессия' ? s.session : s.name}>{value}</span>
        <button
          type="button"
          className={s.copy}
          aria-label={`Скопировать ${label === 'Сессия' ? 'сессию' : 'имя сервера'}: ${game.toUpperCase()} / ${serverName}`}
          onClick={copy}
        >
          <Icon name={status === 'copied' ? 'check' : 'copy'} size={15} />
          <span role="status">{status === 'copied' ? 'Скопировано' : 'Копировать'}</span>
        </button>
      </dd>
      {status === 'error' && (
        <dd className={s.error} role="alert">
          Не удалось скопировать. Выдели текст и скопируй вручную.
        </dd>
      )}
    </div>
  );
}

export default function ServerList() {
  return (
    <div className={s.groups}>
      {servers.map((group) => (
        <div className={s.group} key={group.game}>
          <div className={s.groupHeader}>
            <span className={s.game}>{group.game.toUpperCase()}</span>
            <div>
              <h3 className={s.title}>{group.title}</h3>
              <span className={s.count}>Серверов: {group.servers.length}</span>
            </div>
          </div>
          {group.combo && (
            <div className={s.combo}>
              <div>
                <span className={s.fieldLabel}>
                  Общая сборка для серверов {group.game.toUpperCase()}
                </span>
                <Link className={s.comboLink} to={`/combos/${group.combo.id}`}>
                  <Icon name="map" size={19} /> {group.combo.label}
                  <Icon name="arrow" size={17} />
                </Link>
              </div>
              <span className={s.comboHint}>Скачивание, установка и порядок карт</span>
            </div>
          )}
          <div className={s.cards}>
            {group.servers.map((server) => (
              <article
                className={s.card}
                key={server.id}
                aria-label={`${group.game.toUpperCase()} / ${server.name}`}
              >
                <dl className={s.fields}>
                  <CopyField
                    label="Имя сервера"
                    value={server.name}
                    serverName={server.name}
                    game={group.game}
                  />
                  <CopyField
                    label="Сессия"
                    value={server.sessionId}
                    serverName={server.name}
                    game={group.game}
                  />
                </dl>
              </article>
            ))}
          </div>
        </div>
      ))}
      <p className={s.hint}>
        Скопируй сессию нужного сервера и вставь её в поиск в меню «Конвои». Также можно искать по
        имени сервера.
      </p>
    </div>
  );
}
