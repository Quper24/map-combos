import { useTranslation, LanguageContext } from '../i18n/Language';
import { Component, Suspense, lazy } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './Layout';
const Home = lazy(() => import('../pages/Home/Home'));
const Catalog = lazy(() => import('../pages/Catalog/Catalog'));
const Combo = lazy(() => import('../pages/Combo/Combo'));
const ComboBuilder = lazy(() => import('../pages/ComboBuilder/ComboBuilder'));
const ComboEditor =
  import.meta.env.DEV && import.meta.env.MODE === 'editor'
    ? lazy(() => import('../pages/ComboBuilder/ComboEditor'))
    : null;
const Vtc = lazy(() => import('../pages/Vtc/Vtc'));
const Mods = lazy(() => import('../pages/Mods/Mods'));
const Mod = lazy(() => import('../pages/Mods/Mod'));
const Videos = lazy(() => import('../pages/Videos/Videos'));
const ServerGuide = lazy(() => import('../pages/ServerGuide/ServerGuide'));
function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="container page empty-state">
      <span className="eyebrow">{t('404 / Конец дороги')}</span>
      <h1>{t('Здесь пока нет маршрута')}</h1>
      <p>{t('Проверь адрес или выбери раздел сайта.')}</p>
      <Link className="button" to="/">
        {t('На главную')}
      </Link>
    </div>
  );
}
class ErrorBoundary extends Component {
  static contextType = LanguageContext;
  state = {
    error: false,
  };
  static getDerivedStateFromError() {
    return {
      error: true,
    };
  }
  render() {
    const t = this.context.t;
    return this.state.error ? (
      <div className="container page empty-state">
        <h1>{t('Не удалось загрузить страницу')}</h1>
        <p>{t('Попробуй обновить страницу.')}</p>
        <button className="button" onClick={() => window.location.reload()}>
          {t('Обновить')}
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const { t } = useTranslation();
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <Suspense
        fallback={
          <div className="container page" role="status">
            {t('Загружаем маршрут…')}
          </div>
        }
      >
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="combos" element={<Catalog />} />
            <Route path="combos/builder" element={<ComboBuilder />} />
            {ComboEditor && <Route path="combos/builder/editor" element={<ComboEditor />} />}
            <Route path="combos/:slug" element={<Combo />} />
            <Route path="vtc" element={<Vtc />} />
            <Route path="mods" element={<Mods />} />
            <Route
              path="mods/cargo-control-ets2"
              element={<Navigate to="/mods/cargo-control" replace />}
            />
            <Route path="mods/:slug" element={<Mod />} />
            <Route path="videos" element={<Videos />} />
            <Route path="server-guide" element={<ServerGuide />} />
            <Route path=":slug" element={<Combo root />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
