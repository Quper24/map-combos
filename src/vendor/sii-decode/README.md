# sii-decode-rs (MIT)

Источник: https://github.com/ivsema/sii-decode-rs
Зафиксированный коммит: `079852576740ab5d09d9bec09573e4eeef83264d`.

`sii_decode_bg.wasm` взят без изменений из
`docs/assets/sii_decode_bg-BokP88yo.wasm` этого коммита.
`decoder.js` — wasm-bindgen glue из `docs/assets/decode.worker-D3jbBnB1.js`:
путь заменён на Vite URL import, инициализация вынесена в `init`,
`decode` экспортирован; обработчик worker и создание Blob удалены.
Лицензия сохранена в LICENSE. Rust на машине пользователя и сервере не нужен.

Для обновления пересоберите upstream через wasm-pack по HACKING.md либо
возьмите соответствующую пару glue/WASM из одного коммита. Обновите оба файла,
коммит в этом описании и выполните `npm test` и `npm run build`.
