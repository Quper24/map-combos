import fs from 'node:fs';
const p = 'src/i18n/en.json';
const en = JSON.parse(fs.readFileSync(p, 'utf8'));
const add = {
  'Управление грузами, Road Trip и автобусными рейсами Coaches в ETS2 и ATS.': 'Cargo, Road Trip, and Coaches management for ETS2 and ATS.',
  'Cargo Control управляет предложениями грузов, заказами Road Trip в ATS и автобусными рейсами Coaches в ETS2. Плагин поддерживает массовое обновление предложений и ручное создание маршрутов и заказов с учётом данных загруженного профиля.': 'Cargo Control manages cargo offers, Road Trip jobs in ATS, and Coaches routes in ETS2. It supports bulk offer updates and manual route and job creation based on the loaded profile.',
  'Все версии 1.1.0–1.3.0 рассчитаны на ATS и ETS2 1.61–1.62, но набор функций зависит от версии игры. Для Road Trip нужен соответствующий DLC ATS, для Coaches — DLC Coaches в ETS2.': 'Versions 1.1.0–1.3.0 support ATS and ETS2 1.61–1.62, but available features depend on the game version. Road Trip requires the relevant ATS DLC, and Coaches requires the Coaches DLC in ETS2.',
  'Обновляй рынок грузоперевозок и заказы агентств из загруженного гаража, сохраняя прежние предложения, если игра не смогла подобрать новые.': 'Refresh the Freight Market and agency jobs from a loaded garage while keeping existing offers if the game cannot find new ones.',
  'Создавай грузовые заказы вручную с выбором города, базы отправления, груза, города и базы назначения. Поддерживаются собственные прицепы, фильтр совместимых грузов, режим «Показывать все грузы» и время доставки ×4.': 'Create cargo jobs manually by selecting the city, origin company, cargo, destination city, and destination company. Own trailers, compatible-cargo filtering, Show all cargo, and ×4 delivery time are supported.',
  'В ATS 1.62 доступна вкладка Road Trip: массовое обновление предложений и ручное создание заказов для собственной машины.': 'In ATS 1.62, the Road Trip tab supports bulk offer updates and manual job creation for your own vehicle.',
  'В ETS2 1.62 доступна вкладка Coaches: массовое обновление до 10 рейсов и создание маршрута из 2–24 остановок с поиском, добавлением, удалением и изменением порядка станций.': 'In ETS2 1.62, the Coaches tab supports bulk updates for up to 10 routes and route creation with 2–24 stops, including station search, adding, deleting, and reordering.',
  'Прогресс операций, сохранение прежних предложений, подсказки и сообщения об ошибках помогают понять состояние загруженного профиля.': 'Progress indicators, offer preservation, tips, and empty-list messages make the state of the loaded profile easier to understand.',
  'Запусти игру в режиме DirectX 11 и открой меню Cargo Control. Для Road Trip и Coaches установи соответствующий DLC.': 'Launch the game in DirectX 11 and open the Cargo Control menu. Install the relevant DLC for Road Trip or Coaches.',
  'Скачать 1.3.0 · ShareMods': 'Download 1.3.0 · ShareMods',
  'Автобусные рейсы Coaches': 'Coaches routes',
  'Road Trip и создание заказов': 'Road Trip and job creation',
  'Ручное создание грузовых заказов': 'Manual cargo job creation',
  'Добавлена вкладка Coaches для ETS2 с поддержкой собственного и предоставленного автобуса.': 'Added the Coaches tab for ETS2 with support for owned and provided buses.',
  'Добавлено массовое обновление рейсов штатным генератором игры — до 10 точек с учётом навыков игрока.': 'Added bulk route updates using the game generator, with up to 10 stops based on the player’s skills.',
  'Добавлено ручное создание маршрута из 2–24 точек, включая отправление и конечную остановку.': 'Added manual route creation with 2–24 stops, including the departure and final stop.',
  'Добавлены поиск станций, добавление, удаление и изменение порядка остановок.': 'Added station search and the ability to add, remove, and reorder stops.',
  'Добавлены индикатор прогресса и сохранение прежних предложений, если новые рейсы подобрать не удалось.': 'Added a progress indicator and preservation of existing offers when new routes cannot be found.',
  'Улучшены контраст кнопок, выравнивание полей, подсказки и сообщения для пустых списков. Исправлено положение окна при изменении разрешения экрана.': 'Improved button contrast, field alignment, tips, and empty-list messages. Fixed the window position when the screen resolution changes.',
  'Добавлена вкладка Road Trip для ATS: массовое обновление предложений и ручное создание заказа для собственной машины.': 'Added the Road Trip tab for ATS with bulk offer updates and manual job creation for your own vehicle.',
  'Добавлена опция «Показывать все грузы» и время на доставку ×4 для создаваемых грузовых заказов.': 'Added Show all cargo and ×4 delivery time options for created cargo jobs.',
  'Замена одного предложения при создании заказа выполняется автоматически.': 'Replacing one offer when creating a job is now automatic.',
  'Улучшены определение доступности Road Trip и сообщения о готовности загруженного профиля.': 'Improved Road Trip availability detection and loaded-profile readiness messages.',
  'Добавлена вкладка «Создать заказ» с выбором города, баз отправления и назначения и груза.': 'Added a Create job tab with city, origin and destination company, and cargo selection.',
  'Добавлено чтение городов, компаний и грузов из загруженной сессии с поддержкой карт и модов.': 'Added reading of cities, companies, and cargo from the loaded session, including map and mod content.',
  'Добавлено создание заказов для собственного прицепа с фильтрацией грузов по совместимости.': 'Added own-trailer job creation with compatible-cargo filtering.',
  'Добавлены индикаторы прогресса, подсказки при чтении сессии и улучшения интерфейса.': 'Added progress indicators, session-reading tips, and interface improvements.'
};
Object.assign(en, add);
fs.writeFileSync(p, `${JSON.stringify(en, null, 2)}\n`);
