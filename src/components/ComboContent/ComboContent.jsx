import Video from "../Video/Video";
import "./comboContent.css";

export default function ComboContent({ table, profile }) {
  return (
    <div className="combo-content">
      <p>Обо всех изменениях я сообщаю в Телеграм канале и на boosty!</p>

      <div className="social-links">
        <a
          href="https://t.me/qupersimulator"
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn telegram-btn">
          <span className="btn-icon">📢</span>
          <span className="btn-text">Telegram канал</span>
        </a>

        <a
          href="https://boosty.to/qupersimulator"
          target="_blank"
          rel="noopener noreferrer"
          className="social-btn boosty-btn">
          <span className="btn-icon">💎</span>
          <span className="btn-text">Boosty (поддержать)</span>
        </a>
      </div>

      <h2>Рекомендую посмотреть видео</h2>

      <details className="spoiler">
        <summary className="spoiler-summary">
          <span className="spoiler-icon">▶️</span>
          Инструкция по установке (видео)
        </summary>
        <div className="spoiler-content">
          <Video
            videoId="6UWd6wJa7s8"
            title="Подробная наглядная инструкция по установке любой сборки карт"
          />
        </div>
      </details>

      <h3>Для работы сборки важно чтобы были установлены все DLC карт</h3>
      <div className="link-buttons">
        <a
          href="https://store.steampowered.com/dlc/227300/Euro_Truck_Simulator_2/list/43330"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-link steam-dlc">
          <span className="btn-icon">🚚</span>
          <span className="btn-text">Все DLC карт в Steam</span>
        </a>
      </div>

      <div className="notice">
        <span className="notice-icon">⚙️</span>
        <div className="notice-content">
          <strong>Для корректной работы модов</strong> необходимо в файле
          config.cfg сменить значение (файл находится в папке "Документы/Euro
          Truck Simulator 2") uset r_buffer_page_size на "30".
        </div>
      </div>

      <div className="notice">
        <span className="notice-icon">💻</span>
        <div className="notice-content">
          <strong>Также добавьте параметры запуска</strong> в steam или ярлыке в
          зависимости от объема оперативной памяти:
        </div>
      </div>

      <pre className="code-block">
        <div className="code-header">
          <span className="code-icon">📝</span>
          <span>Параметры запуска для разного объема RAM</span>
        </div>
        <code>{`8GB RAM: -nointro -unlimitedlog -mm_pool_size 4096 -mm_max_tmp_buffers_size 1000
12GB RAM: -nointro -unlimitedlog -mm_pol_size 6144 -mm_max_tmp_buffers_size 1000
16GB RAM (Recommended minimum RAM size): -nointro -unlimitedlog -mm_pool_size 8192 -mm_max_tmp_buffers_size 1000
32GB RAM: -nointro -unlimitedlog -mm_pool_size 16384 -mm_max_tmp_buffers_size 1000
64GB RAM: -nointro -unlimitedlog -mm_pool_size 32768 -mm_max_tmp_buffers_size 1000`}</code>
      </pre>

      <div className="image-display">
        <img src="img/combos/steam-params.jpg" alt="Пример конфигурации" />
      </div>

      <h2>Видео по работе Лаунчера для бустеров</h2>

      <details className="spoiler">
        <summary className="spoiler-summary">
          <span className="spoiler-icon">▶️</span>
          Инструкция по использованию лаунчера
        </summary>
        <div className="spoiler-content">
          <Video videoId="_j4XNEikPow" title="Инструкция для лаунчера" />
        </div>
      </details>

      <h2>ССЫЛКИ</h2>

      <div className="resource-grid">
        {table && (
          <a
            href={table}
            target="_blank"
            rel="noopener noreferrer"
            className="resource-card table-card">
            <span className="resource-icon">📊</span>
            <div className="resource-content">
              <h3>ТАБЛИЦА СО ВСЕМИ ФАЙЛАМИ КАРТ</h3>
              <p>Google Sheets таблица с актуальными ссылками</p>
            </div>
            <span className="resource-arrow">→</span>
          </a>
        )}

        {profile && (
          <a
            href={profile}
            target="_blank"
            rel="noopener noreferrer"
            className="resource-card profile-card">
            <span className="resource-icon">📥</span>
            <div className="resource-content">
              <h3>Профиль с расставленными модами</h3>
              <p>Готовый профиль для загрузки</p>
            </div>
            <span className="resource-arrow">→</span>
          </a>
        )}

        <a
          href="https://boosty.to/qupersimulator/posts/e95fc2f9-303b-43af-a582-25b6e24baebf"
          target="_blank"
          rel="noopener noreferrer"
          className="resource-card early-access-card">
          <span className="resource-icon">🌟</span>
          <div className="resource-content">
            <h3>Ранний доступ и эксклюзив</h3>
            <p>Новые версии раньше + дополнительные файлы</p>
          </div>
          <span className="resource-arrow">→</span>
        </a>
      </div>

      <p className="image-note">
        <span className="note-icon">🖼️</span>
        Скриншоты порядка модификаций из игры:
      </p>
    </div>
  );
}
