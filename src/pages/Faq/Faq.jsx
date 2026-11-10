import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import questions from '../../../content/faq.json';
import site from '../../../content/site.json';
import ExternalLink from '../../components/ui/ExternalLink';
import { useTranslation } from '../../i18n/Language';
import s from './Faq.module.css';

const contacts = [
  { platform: 'telegram-direct', label: 'Telegram · @quper24', url: 'https://t.me/quper24' },
  ...site.socialLinks.filter(({ platform }) => ['telegram-chat', 'boosty'].includes(platform)),
];

function Screenshot({ image }) {
  const { t } = useTranslation();
  const dialog = useRef(null);
  const alt = t(image.alt);
  return (
    <>
      <button
        type="button"
        className={s.preview}
        aria-haspopup="dialog"
        onClick={() => dialog.current.showModal()}
      >
        <img className={s.screenshot} src={image.src} alt={alt} loading="lazy" />
      </button>
      <dialog ref={dialog} className={s.viewer} aria-label={alt}>
        <form method="dialog">
          <button className="button button-secondary">{t('Закрыть')}</button>
        </form>
        <img src={image.src} alt={alt} loading="lazy" />
      </dialog>
    </>
  );
}

export default function Faq() {
  const { t } = useTranslation();
  const { hash } = useLocation();

  useEffect(() => {
    document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <div className={`container page ${s.faq}`}>
      <header className="prose">
        <span className="eyebrow">FAQ</span>
        <h1>{t('Частые вопросы')}</h1>
        <p>
          {t(
            'Установка сборок, настройка игры, подключение к серверу и помощь при вылетах в ETS2 и ATS.',
          )}
        </p>
      </header>
      <nav className={s.index} aria-labelledby="faq-index">
        <h2 id="faq-index">{t('Перейти к вопросу')}</h2>
        <ul>
          {questions.map(({ id, question }) => (
            <li key={id}>
              <a href={`#${id}`}>{t(question)}</a>
            </li>
          ))}
          <li>
            <a href="#contacts">{t('Куда обратиться за помощью')}</a>
          </li>
        </ul>
      </nav>
      <div className={s.answers}>
        {questions.map(({ id, question, paragraphs, code, image, examples, links }) => (
          <section key={id} id={id} className={`prose ${s.answer}`}>
            <h2>
              <a href={`#${id}`}>{t(question)}</a>
            </h2>
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{t(paragraph)}</p>
            ))}
            {code && (
              <pre>
                <code>{code}</code>
              </pre>
            )}
            {image && <Screenshot image={image} />}
            {examples?.map(({ title, text, images }) => (
              <div key={title} className={s.example}>
                <h3>{t(title)}</h3>
                <p>{t(text)}</p>
                <div className={s.gallery}>
                  {images.map((image) => (
                    <Screenshot key={image.src} image={image} />
                  ))}
                </div>
              </div>
            ))}
            {links && (
              <div className="actions">
                {links.map(({ url, label }) =>
                  url.startsWith('/') ? (
                    <Link key={url} className="button button-secondary" to={url}>
                      {t(label)}
                    </Link>
                  ) : url.startsWith('#') ? (
                    <a key={url} className="button button-secondary" href={url}>
                      {t(label)}
                    </a>
                  ) : (
                    <ExternalLink key={url} className="button button-secondary" href={url}>
                      {t(label)}
                    </ExternalLink>
                  ),
                )}
              </div>
            )}
          </section>
        ))}
        <section id="contacts" className={`prose ${s.answer}`}>
          <h2>
            <a href="#contacts">{t('Куда обратиться за помощью')}</a>
          </h2>
          <p>
            {t(
              'Отчёт о вылете с логами отправь в личные сообщения @quper24. Общие вопросы о сборках можно задать в Telegram-чате.',
            )}
          </p>
          <div className="actions">
            {contacts.map(({ platform, label, url }) => (
              <ExternalLink key={platform} className="button button-secondary" href={url}>
                {t(label)}
              </ExternalLink>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
