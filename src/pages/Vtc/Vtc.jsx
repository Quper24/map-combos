import { useTranslation } from '../../i18n/Language';
import { Link } from 'react-router-dom';
import vtc from '../../../content/vtc.json';
import ServerList from '../../components/ServerList/ServerList';
import ExternalLink from '../../components/ui/ExternalLink';
import Icon from '../../components/ui/Icon';
import s from './Vtc.module.css';
export default function Vtc() {
  const { t } = useTranslation();
  return (
    <div className="container page">
      <section className={s.hero}>
        <div>
          <span className="eyebrow">Quper Simulator / VTC</span>
          <h1>{t(vtc.tagline)}</h1>
          {vtc.description.map((text, index) => (
            <p key={index}>{t(text)}</p>
          ))}
          <div className="actions">
            {vtc.links.map((link, index) => (
              <ExternalLink
                key={link.platform}
                href={link.url}
                className={`button ${index ? 'button-secondary' : ''}`}
              >
                {t(link.label)}
              </ExternalLink>
            ))}
          </div>
        </div>
        <div className={s.logo}>
          <img src="/img/logo.jpg" width="350" height="350" alt={'Quper Simulator VTC'} />
          <span>{t('Дороги разные. Команда одна.')}</span>
        </div>
      </section>
      <section className={s.benefits}>
        <h2>{t('Свобода быть за рулём.')}</h2>
        <div>
          {vtc.benefits.map((text, index) => (
            <article key={text}>
              <span>0{t(index + 1)}</span>
              <Icon name="check" />
              <p>{t(text)}</p>
            </article>
          ))}
        </div>
        <p className={s.closing}>{t(vtc.closing)}</p>
      </section>
      <section className="section" id="servers">
        <div className="section-heading">
          <div>
            <span className="eyebrow">{t('Встречаемся в конвое')}</span>
            <h2>{t('Наши серверы')}</h2>
            <p>{t('Четыре сервера для совместных рейсов: два в ETS2 и два в ATS.')}</p>
          </div>
          <Link className="button" to="/server-guide">
            {t('Как подключиться ')}
            <Icon name="arrow" size={17} />
          </Link>
        </div>
        <ServerList />
      </section>
      <section className={s.join}>
        <span className="eyebrow">{t('Твой следующий рейс')}</span>
        <h2>{t(vtc.headline)}</h2>
        <p>{t('Новичок или опытный дальнобойщик — будем рады ехать вместе.')}</p>
        <div className="actions">
          {vtc.links.map((link) => (
            <ExternalLink key={link.platform} href={link.url}>
              {t(link.label)}
            </ExternalLink>
          ))}
        </div>
      </section>
    </div>
  );
}
