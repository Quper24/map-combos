import Video from "./Video";

export default function ComboContent({ table, profile }) {
  return (
    <div className="combo-content">
      <p>Обо всех изменениях я сообщаю в Телеграм канале и на boosty</p>

      <div className="links-group">
        <p>
          <a
            href="https://t.me/qupersimulator"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link">
            https://t.me/qupersimulator
          </a>
        </p>
        <p>
          <a
            href="https://boosty.to/qupersimulator"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link">
            https://boosty.to/qupersimulator
          </a>
        </p>
      </div>

      <h2>Рекомендую посмотреть видео</h2>

      <details className="spoiler">
        <summary className="spoiler-summary">спрятать под спойлер</summary>
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
          <span className="btn-icon">🎮</span>
          <span className="btn-text">Все DLC карт в Steam</span>
        </a>
      </div>

      <div className="notice">
        <strong>💡 Для корректной работы модов</strong> необходимо в файле
        config.cfg сменить значение (файл находится в папке "Документы/Euro
        Truck Simulator 2") uset r_buffer_page_size на "30".
      </div>

      <div className="notice">
        <strong>Также добавьте параметры запуска</strong> в steam или ярлыке в
        зависимости от объема оперативной памяти:
      </div>

      <pre className="code-block">
        <code>{`8GB RAM: -nointro -unlimitedlog -mm_pool_size 4096 -mm_max_tmp_buffers_size 1000
12GB RAM: -nointro -unlimitedlog -mm_pol_size 6144 -mm_max_tmp_buffers_size 1000
16GB RAM (Recommended minimum RAM size): -nointro -unlimitedlog -mm_pool_size 8192 -mm_max_tmp_buffers_size 1000
32GB RAM: -nointro -unlimitedlog -mm_pool_size 16384 -mm_max_tmp_buffers_size 1000
64GB RAM: -nointro -unlimitedlog -mm_pool_size 32768 -mm_max_tmp_buffers_size 1000`}</code>
      </pre>

      <div className="image-display">
        <img src="img/combos/steam-params.jpg" alt="Пример конфигурации" />
      </div>

      <h2>
        <a
          href={table}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-link">
          <span className="btn-text">ТАБЛИЦА СО ВСЕМИ ФАЙЛАМИ КАРТ</span>
        </a>
      </h2>

      <h2>
        <a
          href={profile}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-link">
          <span className="btn-text">Профиль с расставленными модами</span>
        </a>
      </h2>

      <h2>
        <a
          href="https://boosty.to/qupersimulator/posts/00504721-c22e-4638-a203-5a5d86745a80"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-link">
          <span className="btn-text">
            Новые версии сборок раньше и файлы на Boosty
          </span>
        </a>
      </h2>

      <p>Скриншоты порядка модификаций из игры:</p>
    </div>
  );
}
