import AutoProfileInstall from "../AutoProfileInstall/AutoProfileInstall";
import Video from "../Video/Video";
import ComboNavigation from "../ComboNavigation/ComboNavigation";

import "./comboContent.css";

export default function ComboContent({ combo }) {
  const { table, profile } = combo;

  return (
    <div className="combo-content">
      <ComboNavigation combo={combo} />

      {combo.video && (
        <section className="combo-video">
          <h2>🎬 Видеообзор сборки</h2>

          <Video videoId={combo.video} title={combo.title} />
        </section>
      )}

      {/* Быстрые ссылки */}
      <section id="links">
        <h2>🔗 Ссылки</h2>

        <div className="resource-grid">
          {table && (
            <a
              href={table}
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card table-card">
              <span className="resource-icon">📊</span>

              <div>
                <h3>Таблица файлов карт</h3>

                <p>Все ссылки и актуальная информация</p>
              </div>
            </a>
          )}

          {profile && (
            <a
              href={profile}
              target="_blank"
              rel="noopener noreferrer"
              className="resource-card profile-card">
              <span className="resource-icon">📥</span>

              <div>
                <h3>Готовый профиль</h3>

                <p>Моды уже расставлены</p>
              </div>
            </a>
          )}

          <a
            href="https://boosty.to/qupersimulator/posts/74db1223-4ff7-4ac6-8582-808720f23992"
            target="_blank"
            rel="noopener noreferrer"
            className="resource-card early-access-card">
            <span className="resource-icon">💎</span>

            <div>
              <h3>Сборка одним архивом</h3>

              <p>Boosty ранний доступ</p>
            </div>
          </a>
        </div>
      </section>

      {/* Автопрофиль */}
      {combo.automods && (
        <section id="profile">
          <h2>📥 Автоматическая расстановка модификаций в вашем профиле</h2>

          <AutoProfileInstall combo={combo} />
        </section>
      )}

      {/* Видео установки */}
      <section>
        <h2>🎬 Инструкция по установке</h2>

        <details className="spoiler">
          <summary className="spoiler-summary">
            <span className="spoiler-icon">▶️</span>
            Открыть видеоинструкцию
          </summary>

          <div className="spoiler-content">
            <Video
              videoId="6UWd6wJa7s8"
              title="Подробная инструкция по установке сборки карт"
            />
          </div>
        </details>
      </section>

      {/* Перед запуском */}
      <section id="install">
        <h2>⚙️ Перед запуском</h2>

        <details className="spoiler">
          <summary className="spoiler-summary">⚙️ Настройка config.cfg</summary>

          <div className="spoiler-content">
            Для корректной работы модов:
            <br />
            <br />
            Откройте файл:
            <br />
            Документы/ Euro Truck Simulator 2/ config.cfg
            <br />
            <br />
            Найдите:
            <code>uset r_buffer_page_size</code>
            <br />
            <br />
            Установите значение:
            <code>30</code>
          </div>
        </details>

        <details className="spoiler">
          <summary className="spoiler-summary">
            💻 Параметры запуска Steam
          </summary>

          <div className="spoiler-content">
            <p>Добавьте параметры запуска:</p>

            <pre className="code-block">-nointro -unlimitedlog</pre>

            <div className="image-display">
              <img
                src="img/combos/steam-params.jpg"
                alt="Пример параметров запуска Steam"
              />
            </div>
          </div>
        </details>

        <details className="spoiler">
          <summary className="spoiler-summary">
            🚛 Обязательные DLC карт
          </summary>

          <div className="spoiler-content">
            Для работы сборки должны быть установлены все DLC карт.
            <br />
            <br />
            <a
              href="https://store.steampowered.com/dlc/227300/Euro_Truck_Simulator_2/list/43330"
              target="_blank"
              rel="noopener noreferrer">
              Все DLC в Steam
            </a>
          </div>
        </details>
      </section>

      {/* Лаунчер */}

      <section id="launcher">
        <h2>🚀 Лаунчер</h2>

        <details className="spoiler">
          <summary className="spoiler-summary">
            Инструкция по использованию лаунчера (нужна рубиновая подписка на
            Boosty)
          </summary>

          <div className="spoiler-content">
            <Video videoId="ey10boQxLRQ" title="Инструкция для лаунчера" />
          </div>
        </details>
      </section>
    </div>
  );
}
