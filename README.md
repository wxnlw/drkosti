# Birthday Telegram Mini App

Статическое мини-приложение ко дню рождения: мини-квест из 3 шагов и финальный экран с подарком.

## Что это

- Telegram Mini App на чистом `HTML + CSS + JavaScript`
- Без Python, без сервера, без API
- Готово к публикации на GitHub Pages

## Локальный запуск

1. Открой папку проекта в терминале.
2. Запусти статический сервер:
   - `python -m http.server 5500`
3. Открой в браузере:
   - `http://localhost:5500`

Можно и без сервера: просто открыть `index.html`, но через локальный сервер удобнее тестировать.

## Деплой на GitHub Pages

1. Залей проект в репозиторий GitHub.
2. Открой `Settings -> Pages`.
3. Выбери:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` (или `master`)
   - `Folder`: `/ (root)`
4. Сохрани и дождись ссылки вида:
   - `https://<username>.github.io/<repo>/`

## Что редактировать перед публикацией

Главный файл контента:
- `js/app-config.js`

Обычно меняют:
- `birthday.celebrantName`
- `birthday.finalGreeting`
- `gift.title`, `gift.description`, `gift.additionalMessage`
- `gift.link`, `gift.login`, `gift.password`, `gift.codeWord`
- `game.stages` (вопросы, варианты, подсказки, ошибки)
- `ui.texts`, `ui.buttons`, `ui.hints`

Визуальный стиль:
- `styles.css` (цвета, карточки, кнопки, анимации)

## Подключение к Telegram через BotFather

1. Создай бота (если его еще нет): `/newbot`
2. Настрой Mini App:
   - через `/newapp`  
   или
   - `/mybots -> Bot Settings -> Menu Button` и укажи URL Mini App
3. Вставь публичный URL с GitHub Pages.
4. Открой бота в Telegram и запусти Mini App из кнопки меню/команды.

## Тестирование в браузере

Проверь:
- стартовый экран;
- прохождение 3 этапов;
- финальный reveal экрана подарка;
- сохранение прогресса после перезагрузки;
- сброс: `resetProgress()` в консоли браузера.

## Тестирование внутри Telegram

Проверь:
- корректное открытие в Telegram-клиенте;
- работу `MainButton` на старте, в игре и на финальном экране;
- адаптацию темы Telegram;
- сохранение прогресса после повторного открытия Mini App.

## Ограничения подхода без бэкенда

- Подарок и все данные хранятся на клиенте (`js/app-config.js` и `localStorage`).
- Секретные данные таким способом не защищены.
- Для настоящей защиты (приватные ссылки, одноразовый доступ, проверка пользователя) нужен бэкенд.
