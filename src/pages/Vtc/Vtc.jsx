import { Link } from 'react-router-dom';
import vtc from '../../../content/vtc.json';
import ServerList from '../../components/ServerList/ServerList';
import ExternalLink from '../../components/ui/ExternalLink';
import Icon from '../../components/ui/Icon';
import s from './Vtc.module.css';
export default function Vtc() {
  return (
    <div className="container page">
      <section className={s.hero}>
        <div>
          <span className="eyebrow">Quper Simulator / VTC</span>
          <h1>{vtc.tagline}</h1>
          {vtc.description.map((text, index) => (
            <p key={index}>{text}</p>
          ))}
          <div className="actions">
            {vtc.links.map((link, index) => (
              <ExternalLink
                key={link.platform}
                href={link.url}
                className={`button ${index ? 'button-secondary' : ''}`}
              >
                {link.label}
              </ExternalLink>
            ))}
          </div>
        </div>
        <div className={s.logo}>
          <img src="/img/logo.jpg" width="350" height="350" alt="Quper Simulator VTC" />
          <span>Дороги разные. Команда одна.</span>
        </div>
      </section>
      <section className={s.benefits}>
        <h2>Свобода быть за рулём.</h2>
        <div>
          {vtc.benefits.map((text, index) => (
            <article key={text}>
              <span>0{index + 1}</span>
              <Icon name="check" />
              <p>{text}</p>
            </article>
          ))}
        </div>
        <p className={s.closing}>{vtc.closing}</p>
      </section>
      <section className="section" id="servers">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Встречаемся в конвое</span>
            <h2>Наши серверы</h2>
            <p>Четыре сервера для совместных рейсов: два в ETS2 и два в ATS.</p>
          </div>
          <Link className="button" to="/server-guide">
            Как подключиться <Icon name="arrow" size={17} />
          </Link>
        </div>
        <ServerList />
      </section>
      <section className={s.join}>
        <span className="eyebrow">Твой следующий рейс</span>
        <h2>{vtc.headline}</h2>
        <p>Новичок или опытный дальнобойщик — будем рады ехать вместе.</p>
        <div className="actions">
          {vtc.links.map((link) => (
            <ExternalLink key={link.platform} href={link.url}>
              {link.label}
            </ExternalLink>
          ))}
        </div>
      </section>
    </div>
  );
}
