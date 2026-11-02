import { Component, Suspense, lazy } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import Layout from './Layout';
const Home = lazy(() => import('../pages/Home/Home'));
const Catalog = lazy(() => import('../pages/Catalog/Catalog'));
const Combo = lazy(() => import('../pages/Combo/Combo'));
const Vtc = lazy(() => import('../pages/Vtc/Vtc'));
const Mods = lazy(() => import('../pages/Mods/Mods'));
const Mod = lazy(() => import('../pages/Mods/Mod'));
const Videos = lazy(() => import('../pages/Videos/Videos'));
const ServerGuide = lazy(() => import('../pages/ServerGuide/ServerGuide'));
function LegacyCombo() {
  const { slug } = useParams();
  return <Navigate to={`/combos/${encodeURIComponent(slug)}`} replace />;
}
function NotFound() {
  return (
    <div className="container page empty-state">
      <span className="eyebrow">404 / Конец дороги</span>
      <h1>Здесь пока нет маршрута</h1>
      <p>Проверь адрес или выбери раздел сайта.</p>
      <Link className="button" to="/">
        На главную
      </Link>
    </div>
  );
}
class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="container page empty-state">
        <h1>Не удалось загрузить страницу</h1>
        <p>Попробуй обновить страницу.</p>
        <button className="button" onClick={() => window.location.reload()}>
          Обновить
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  const location = useLocation();
  return (
    <ErrorBoundary key={location.pathname}>
      <Suspense
        fallback={
          <div className="container page" role="status">
            Загружаем маршрут…
          </div>
        }
      >
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="combos" element={<Catalog />} />
            <Route path="combos/:slug" element={<Combo />} />
            <Route path="vtc" element={<Vtc />} />
            <Route path="mods" element={<Mods />} />
            <Route path="mods/:slug" element={<Mod />} />
            <Route path="videos" element={<Videos />} />
            <Route path="server-guide" element={<ServerGuide />} />
            <Route path=":slug" element={<LegacyCombo />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
