window.APP_CONFIG = {
  birthday: {
    celebrantName: "Костя",
    finalGreeting:
      "Костя, с днём рождения! Пусть этот год будет щедрым на крутые идеи, тёплые встречи, вдохновение и радостные поводы для улыбки.",
  },
  gift: {
    title: "Максим и Андрей дарят тебе подписку на Gemini 3 Pro на год",
    description: "Это крутая нейросеть для идей, текстов, поиска, учёбы и повседневных задач. Костя, с днём рождения — пусть этот подарок приятно удивляет и реально приносит пользу.",
    additionalMessage:
      "Ниже — почта и пароль от аккаунта. Забирай подарок и кайфуй от новых возможностей.",
    link: "",
    login: "your-gemini-mail@gmail.com",
    password: "your-password",
  },
  ui: {
    heroLabel: "ПРАЗДНИЧНАЯ КУХНЯ",
    heroTitle: "{name}, приготовь праздничный плов",
    heroSubtitle: "",
    bannerText: "{name}, С ДНЁМ РОЖДЕНИЯ",
    startButton: "Начать игру",
    taskButton: "Задание",
    restartButton: "Сначала",
    finalBadge: "ПОДАРОК",
    finalTitle: "Плов готов — подарок открыт",
    finalSubtitle: "Всё получилось как надо. Ниже — данные от аккаунта.",
    playAgainButton: "Сыграть ещё раз",
    giftLoginLabel: "Почта",
    giftPasswordLabel: "Пароль",
    inventoryHint: "Открой сундук и достань нужный продукт.",
  },
  game: {
    storageKey: "birthday-plov-pixel-v14-mobile",
    autoHintMs: 2600,
    foodItems: [
      { id: "rice", label: "Рис" },
      { id: "meat", label: "Мясо" },
      { id: "carrot", label: "Морковь" },
      { id: "onion", label: "Лук" },
      { id: "garlic", label: "Чеснок" },
      { id: "oil", label: "Масло" },
      { id: "spices", label: "Специи" },
      { id: "water", label: "Вода" },
    ],
    toolItems: [
      { id: "lid", label: "Крышка" },
      { id: "ladle", label: "Половник" },
    ],
    preparedLabels: {
      rice: "Замоченный рис",
      carrot: "Нарезанная морковь",
      onion: "Нарезанный лук",
      garlic: "Очищенный чеснок"
    },
    steps: [
      { id: "select-rice", type: "select-item", item: "rice", prompt: "Открой сундук и достань рис на доску.", successText: "Рис уже на доске." },
      { id: "wash-rice", type: "tap-count", target: "board", item: "rice", count: 6, effect: "wash", prompt: "Промой рис быстрыми тапами.", successText: "Рис стал чище." },
      { id: "soak-rice", type: "hold", target: "board", item: "rice", duration: 1100, effect: "wash", prompt: "Теперь подержи палец на рисе, чтобы замочить его.", successText: "Рис отдохнул как надо.", result: { storePrepared: "rice" } },

      { id: "select-carrot", type: "select-item", item: "carrot", prompt: "Достань морковь из сундука.", successText: "Морковь на доске." },
      { id: "peel-carrot", type: "swipe-count", target: "board", item: "carrot", count: 3, effect: "peel", prompt: "Очисти морковь свайпами по доске.", successText: "Морковь очищена." },
      { id: "slice-carrot", type: "tap-count", target: "board", item: "carrot", count: 5, effect: "chop", prompt: "Нарежь морковь быстрыми тапами.", successText: "Морковь нарезана.", result: { storePrepared: "carrot" } },

      { id: "select-onion", type: "select-item", item: "onion", prompt: "Теперь достань лук.", successText: "Лук на доске." },
      { id: "peel-onion", type: "swipe-count", target: "board", item: "onion", count: 2, effect: "peel", prompt: "Сними шелуху с лука свайпами.", successText: "Лук очищен." },
      { id: "slice-onion", type: "tap-count", target: "board", item: "onion", count: 4, effect: "chop", prompt: "Нарежь лук.", successText: "Лук готов.", result: { storePrepared: "onion" } },

      { id: "select-garlic", type: "select-item", item: "garlic", prompt: "Достань чеснок.", successText: "Чеснок на доске." },
      { id: "peel-garlic", type: "tap-count", target: "board", item: "garlic", count: 3, effect: "peel", prompt: "Очисти чеснок несколькими тапами.", successText: "Чеснок очищен.", result: { storePrepared: "garlic" } },

      { id: "heat-stove", type: "tap-count", target: "stove", item: "stove", count: 4, effect: "fire", prompt: "Разогрей плиту под казаном быстрыми тапами.", successText: "Огонь разогрелся.", result: { flameOn: true } },

      { id: "select-oil", type: "select-item", item: "oil", prompt: "Открой сундук и достань масло.", successText: "Масло на доске." },
      { id: "pour-oil", type: "board-to-pot", item: "oil", prompt: "Нажми на масло на доске, чтобы налить его в казан.", successText: "Масло уже в казане.", result: { potAdd: "oil" } },

      { id: "select-meat", type: "select-item", item: "meat", prompt: "Достань мясо.", successText: "Мясо на доске." },
      { id: "add-meat", type: "board-to-pot", item: "meat", prompt: "Отправь мясо в казан.", successText: "Мясо уже в казане.", result: { potAdd: "meat" } },

      { id: "add-onion", type: "inventory-to-pot", item: "onion", prompt: "Открой сундук и добавь нарезанный лук в казан.", successText: "Лук добавлен.", result: { potAdd: "onion" } },
      { id: "add-carrot", type: "inventory-to-pot", item: "carrot", prompt: "Теперь достань из сундука нарезанную морковь и отправь её в казан.", successText: "Морковь добавлена.", result: { potAdd: "carrot" } },

      { id: "select-spices", type: "select-item", item: "spices", prompt: "Достань специи.", successText: "Специи на доске." },
      { id: "add-spices", type: "board-to-pot", item: "spices", prompt: "Добавь специи в казан.", successText: "Специи пошли в дело.", result: { potAdd: "spices" } },

      { id: "select-water", type: "select-item", item: "water", prompt: "Достань воду.", successText: "Вода на доске." },
      { id: "add-water", type: "board-to-pot", item: "water", prompt: "Влей воду в казан.", successText: "Вода уже в казане.", result: { potAdd: "water" } },

      { id: "add-rice", type: "inventory-to-pot", item: "rice", prompt: "Открой сундук и засыпай подготовленный рис в казан.", successText: "Рис в казане.", result: { potAdd: "rice" } },
      { id: "add-garlic", type: "inventory-to-pot", item: "garlic", prompt: "Достань из сундука очищенный чеснок и добавь его в казан.", successText: "Чеснок добавлен.", result: { potAdd: "garlic" } },

      { id: "cover-kazan", type: "tool-tap", item: "lid", prompt: "Накрой казан крышкой.", successText: "Казан накрыт.", result: { lidOn: true } },
      { id: "wait-cook", type: "hold", target: "kazan", item: "kazan", duration: 1500, prompt: "Подержи палец на казане, пока плов дойдёт до готовности.", successText: "Плов почти готов.", result: { cooked: true } },
      { id: "stir-plov", type: "tap-count", target: "kazan", item: "kazan", count: 5, effect: "steam", prompt: "Несколько раз нажми на казан, чтобы перемешать плов.", successText: "Плов перемешан как надо." },

      { id: "plate-plov", type: "tool-tap", item: "ladle", prompt: "Возьми половник и переложи плов на тарелку.", successText: "Подача почти готова.", result: { plateFood: true } },
      { id: "finish", type: "plate-tap", item: "plate", prompt: "Нажми на тарелку, чтобы красиво подать плов.", successText: "Праздничный плов готов.", result: { served: true } },
    ],
  },
};
