// C:\Quper-projects\map-combos\src\pages\ServerGuide\ServerGuide.jsx
import "./serverGuide.css";

export default function ServerGuide() {
  return (
    <div className="container server-guide-container">
      <header className="guide-header">
        <h1>SERVER ETS2 / ATS SETTING 1.57 - 1.58</h1>
        <p>Инструкция по подключению к серверу Quper Simulator</p>
      </header>

      <section>
        <h2>Видеоинструкции</h2>
        <div className="video-links">
          <a
            href="https://youtu.be/Cuq6zaBQRQo"
            className="video-link"
            target="_blank"
            rel="noopener noreferrer">
            YouTube: Инструкция по подключению
          </a>
          <a
            href="https://rutube.ru/video/private/c111659ed9f251fde552789067bfbfd/?p=na8rllug3JmdpS1QZyUldQ"
            className="video-link"
            target="_blank"
            rel="noopener noreferrer">
            Rutube: Инструкция по подключению
          </a>
        </div>
        <p className="note">Видео немного старое, подробнее ниже текстом</p>
      </section>

      <section>
        <div className="warning">
          <h2>ВНИМАНИЕ</h2>
          <p>
            Внимательно и полностью прочтите данную инструкцию перед
            подключением к серверу.
          </p>
          <p>
            Несоблюдение описанных шагов приведёт к невозможности подключения и
            игре на сервере.
          </p>

          <h3>Важно:</h3>
          <ul>
            <li>
              Работа нелицензионных копий игры не гарантируется. Методы
              подключения таких версий не предоставляются.
            </li>
            <li>
              Рекомендуется использовать чистый профиль, скачанный по ссылке или
              созданный вручную.
            </li>
            <li>
              После создания профиля настройте его (управление, звук, игровой
              процесс и пр.) до выполнения шагов подключения.
            </li>
            <li>При желании профиль можно подключить к WoTr.</li>
          </ul>
        </div>
      </section>

      <section>
        <h2>Подключение к серверу</h2>

        <div className="steps">
          <div className="step">
            <h3>1. Подготовка модов</h3>
            <ol>
              <li>Скачайте модпак, необходимый для игры на сервере.</li>
              <li>
                При желании скачайте дополнительные необязательные модификации.
              </li>
              <li>
                Переместите все файлы модов (.scs) в папку:
                <ul>
                  <li>
                    <strong>ETS2:</strong> Документы\Euro Truck Simulator 2\mod
                  </li>
                  <li>
                    <strong>ATS:</strong> Документы\American Truck Simulator\mod
                  </li>
                </ul>
              </li>
            </ol>
          </div>

          <div className="step">
            <h3>2. Настройка конфигурационного файла</h3>
            <ol>
              <li>
                Откройте файл:
                <ul>
                  <li>
                    <strong>ETS2:</strong> Документы\Euro Truck Simulator
                    2\config.cfg
                  </li>
                  <li>
                    <strong>ATS:</strong> Документы\American Truck
                    Simulator\config.cfg
                  </li>
                </ul>
              </li>
              <li>
                Найдите и измените параметры:
                <ul>
                  <li>
                    <code>uset g_max_convoy_size "8" → "128"</code>
                  </li>
                  <li>
                    <code>uset r_buffer_page_size "10" → "30"</code>
                  </li>
                </ul>
              </li>
              <li>Сохраните файл.</li>
            </ol>
            <p className="note">
              Без этих изменений игра будет вылетать при использовании модов!
            </p>
          </div>

          <div className="step">
            <h3>3. Подключение в игре</h3>
            <ol>
              <li>Запустите игру и нажмите "Продолжить карьеру".</li>
              <li>Перейдите в меню Конвои → Конвои.</li>
              <li>Дождитесь загрузки списка серверов.</li>
              <li>
                В поиске слева введите <code>quper</code> и нажмите{" "}
                <code>Enter</code>.
              </li>
              <li>
                Выберите сервер:
                <ul>
                  <li>
                    <strong>ETS2:</strong> Quper Simulator ETS2
                  </li>
                  <li>
                    <strong>ATS:</strong> Quper Simulator ATS
                  </li>
                </ul>
              </li>
              <li>
                Дождитесь, пока игра проверит моды, и нажмите "Активировать моды
                сессии".
              </li>
              <li>Нажмите "Присоединиться к Конвою".</li>
              <li>
                Если всё сделано правильно, вы окажетесь в Конвое и увидите
                других игроков на карте.
              </li>
            </ol>
          </div>
        </div>

        <div className="note">
          <h3>Порядок модов в игре</h3>
          <p>Следуйте схеме ниже для правильного расположения модов:</p>
          <ul className="mod-order-links">
            <li>
              <a href="/#/ets2-server-map" className="mod-link">
                Порядок server ETS2 Promods
              </a>
            </li>
            <li>
              <a href="/#/ets2-contracts-map" className="mod-link">
                Порядок server ETS2 Contracts (без карт)
              </a>
            </li>
            <li>
              <a href="/#/ats-server-map" className="mod-link">
                Порядок server ATS
              </a>
            </li>
          </ul>
        </div>

        <div className="note">
          <h3>Примечание:</h3>
          <ul>
            <li>
              Допускаются ваши собственные модификации, но перед использованием
              убедитесь, что они не мешают подключению к серверу.
            </li>
            <li>
              Обычно допускаются:
              <ul>
                <li>графические моды,</li>
                <li>моды на погоду,</li>
                <li>внешний тюнинг,</li>
                <li>аксессуары,</li>
                <li>звуковые пакеты.</li>
              </ul>
            </li>
          </ul>
          <p>Пример: мод Customized Route Advisor работает без проблем.</p>
        </div>
      </section>

      <section>
        <h2>Правила поведения на сервере Quper Simulator</h2>
        <p>Главное правило: уважайте других участников.</p>
        <p>
          Все игроки могут преследовать разные цели — не мешайте друг другу.
        </p>
        <p>Избегайте конфликтов и ищите компромиссы.</p>
        <p className="warning">
          Подключаясь к серверу, вы автоматически принимаете данные правила.
          Нарушение некоторых правил ведёт к мгновенному и пожизненному бану без
          возможности обжалования!
        </p>

        <div className="prohibitions">
          <h3>Запрещается:</h3>
          <ol>
            <li>
              Умышленный грифинг (блокировка проезда, создание аварий и т.п.).
            </li>
            <li>
              Постоянное умышленное превышение скорости вблизи других игроков:
              <ul>
                <li>Лимит: 100 км/ч + 5 км/ч.</li>
              </ul>
            </li>
            <li>Гонки в городах и на оживлённых дорогах.</li>
            <li>
              Спам в голосовом чате:
              <ul>
                <li>Если не планируете общаться, отключите микрофон.</li>
              </ul>
            </li>
          </ol>
        </div>

        <div className="note">
          <h3>Жалобы</h3>
          <p>Если вы хотите подать жалобу, обязательно ведите видеозапись.</p>
          <p>Подойдут:</p>
          <ul>
            <li>nVidia Overlay → Alt+Z</li>
            <li>TruckyApp → Настройки → Захват и воспроизведение видео</li>
            <li>OBS</li>
          </ul>
          <p className="warning">Без видеозаписи жалобы не рассматриваются!</p>
        </div>
      </section>

      <section>
        <h2>Настройки сервера Quper Simulator</h2>

        <table>
          <thead>
            <tr>
              <th>Параметр</th>
              <th>Значение</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Трафик</td>
              <td>Включён</td>
            </tr>
            <tr>
              <td>Столкновения между игроками</td>
              <td>Включены</td>
            </tr>
            <tr>
              <td>Столкновения в зонах сервиса</td>
              <td>Выключены</td>
            </tr>
            <tr>
              <td>Скрытие игроков в зонах без столкновений</td>
              <td>Выключено</td>
            </tr>
            <tr>
              <td>Столкновения в меню</td>
              <td>Включены</td>
            </tr>
            <tr>
              <td>Ограничение скорости</td>
              <td>Выключено</td>
            </tr>
            <tr>
              <td>Часовые пояса</td>
              <td>Включены</td>
            </tr>
            <tr>
              <td>Необязательные моды</td>
              <td>Включены</td>
            </tr>
          </tbody>
        </table>

        <div className="note">
          <h3>Рекомендуемые настройки для комфортной игры</h3>
          <p>Модпак включает моды на физику и звуки окружения.</p>
          <p>
            Если вам не нравятся звуки или поведение грузовика — начните с этих
            значений и подстройте под себя.
          </p>
        </div>

        <div className="settings-grid">
          <div className="setting-category">
            <h3>Звук:</h3>
            <ul>
              <li>Общий уровень громкости — 50%</li>
              <li>Двигатель — 100%</li>
              <li>Выхлоп — 100%</li>
              <li>Турбонаддув — 100%</li>
              <li>Эффекты — 100%</li>
              <li>Шумы грузовика — 60%</li>
              <li>Шумы прицепа — 60%</li>
              <li>Интерьер — 100%</li>
              <li>Трафик — 80%</li>
              <li>Окружающие звуки — 60%</li>
            </ul>
          </div>

          <div className="setting-category">
            <h3>Игровой процесс:</h3>
            <ul>
              <li>Устойчивость грузовика — 50%</li>
              <li>Жёсткость амортизации кабины — 0%</li>
              <li>Жёсткость подвески — 0%</li>
              <li>
                Симуляция крутящего момента трансмиссии — до 50% (по желанию)
              </li>
              <li>Интенсивность торможения — 100%</li>
              <li>Симуляция неровностей — до 70% (по желанию)</li>
              <li>Устойчивость прицепа — 50%</li>
            </ul>
          </div>

          <div className="setting-category">
            <h3>Устройства:</h3>
            <ul>
              <li>Чувствительность руля — 0.75</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2>Часто задаваемые вопросы (FAQ)</h2>

        <div className="faq-item">
          <p className="faq-q">В: Как говорить в голосовом чате?</p>
          <p className="faq-a">
            О: Зажмите клавишу X (английская). Отпустите после окончания фразы.
          </p>
          <p>
            Голосовой чат общий. Для общения в группе используйте Discord или
            другие мессенджеры.
          </p>
        </div>

        <div className="faq-item">
          <p className="faq-q">В: Как написать сообщение в текстовом чате?</p>
          <p className="faq-a">О:</p>
          <ul>
            <li>Нажмите Tab (или стрелку влево в меню).</li>
            <li>Либо F9, если грузовик полностью остановлен.</li>
          </ul>
        </div>
      </section>

      <section className="acknowledgments">
        <h2>Благодарности</h2>
        <p>
          Хочу выразить искреннюю благодарность людям, без которых этот проект
          был бы невозможен.
        </p>

        <h3>Werwolf (Александр)</h3>
        <p>
          За поднятие сервера, постоянную помощь и поддержку — как техническую,
          так и моральную.
        </p>
        <p>
          Спасибо тебе, ты лучший! Без тебя этот проект не достиг бы такого
          уровня.
        </p>

        <p>
          Также огромное спасибо многим другим ребятам, которые помогали
          советами, тестами и подсказками на разных этапах.
        </p>
        <p>
          Ваша поддержка вдохновляет и делает сообщество Quper Simulator дружным
          и живым!
        </p>
      </section>

      <footer className="guide-footer">
        <p>
          Quper Simulator — Сервер для Euro Truck Simulator 2 и American Truck
          Simulator
        </p>
        <p>Инструкция актуальна для версий игры 1.57 - 1.58</p>
      </footer>
    </div>
  );
}
