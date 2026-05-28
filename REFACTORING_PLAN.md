# План рефакторинга Character Sheet v1.0.8.4

## Статус: выполнено 4 из 7 этапов (+ 3 этапа БД/авторизации)

---

## ✅ Завершённые этапы (коммит `b80645f`)

### Этап 1: CharacterModel — единая сериализация

**Проблема:** Поля персонажа вручную перечислены 4 раза: `autoSave()`, `saveToFile()`, `loadData()`, `importCharacterData()`.

**Решение:**
- Создан `js/character-model.js` — объект `CharacterModel` с конфигурацией из 27 полей
- `toJSON()` — единственный метод сериализации (state → JSON)
- `fromJSON(data, opts)` — десериализация + DOM-синхронизация + вызов render-функций
- `storage.js` сокращён с 351 до 117 строк (−67%)
- **Багфикс:** `pinnedSpells` теперь сохраняются (раньше не попадали в save)

**Изменённые файлы:** `character-model.js` (новый), `storage.js`, `index.html`

---

### Этап 2: ClassResourceRegistry — полиморфные ресурсы классов

**Проблема:** 12-кратное дублирование `if/else` в `class-resources.js` (177 строк) и `character-init.js` (17 строк хардкода).

**Решение:**
- Создан `js/class-resource-registry.js` — реестр `ClassResourceRegistry` с `calcMax(level)` для каждого класса
- `renderClassResource()` — обобщённый UI без единого `if/else` по имени класса (80 строк)
- `character-init.js` — `resetAllClassResources()` вместо 17 строк хардкода
- Use/Restore обработчики обобщены: работают для ВСЕХ 12 классов одной функцией

**Изменённые файлы:** `class-resource-registry.js` (новый), `class-resources.js`, `character-init.js`, `index.html`

---

### Этап 3: Domain Models — инкапсуляция бизнес-логики

**Проблема:** Логика характеристик/хитов/заклинаний разбросана, `getMod()` читает из DOM.

**Решение:**
- **`js/ability-scores.js`** — `AbilityScores.get()`, `.modifier()`, `.applyBoosts()`, `.syncDOM()`
- **`js/hit-points.js`** — `HitPoints.heal()`, `.damage()`, `.rollDeathSave()`, `.longRest()`
- **`js/spell-book.js`** — `SpellBook.add()`, `.useSlot()`, `.getAttackBonus()`
- `getMod()` переписан: читает из `state.stats`, а не из `document.getElementById()`
- `hp-system.js` — функции стали обёртками над `HitPoints` моделью

**Изменённые файлы:** `ability-scores.js`, `hit-points.js`, `spell-book.js` (новые), `roll-engine.js`, `utils.js`, `hp-system.js`, `index.html`

---

### Этап 4: CharacterSheetView — координатор рендеринга

**Проблема:** Рендер-последовательность из 15 вызовов скопирована в 3 местах (`app.js`, `character-model.js`, `character-init.js`).

**Решение:**
- Создан `js/character-sheet-view.js` — `CharacterSheetView` с 4 режимами:
  - `renderAll()` — 15 шагов, 5 слоёв (полный рендер)
  - `renderAfterInit()` — 4 шага (после создания персонажа)
  - `softSync()` — 4 шага (HP/скорость/истощение)
  - `bindEvents()` — инициализация обработчиков (один раз)
- Все места вызова заменены на `CharacterSheetView`

**Изменённые файлы:** `character-sheet-view.js` (новый), `character-model.js`, `app.js`, `character-init.js`, `index.html`

---

## 📊 Итоги первой половины

| Метрика | До | После |
|---------|-----|-------|
| JS-файлов | 25 | 31 (+6 новых моделей/View) |
| Строк кода | ~1965 | ~2535 (+570, но −340 дублирования) |
| Дублирование полей state | 4 копии | 1 конфиг `_FIELD_CONFIG` |
| `if/else` по классам | 36 блоков | 0 |
| Чтение характеристик из DOM | 4 места | 0 (только `state.stats`) |
| Копий render-последовательности | 3 | 1 координатор |

---

## ⏳ Этап 5: Фильтрация заклинаний на сервер

**Проблемы:**
- `spells.js:showSpellSelectionModal()` — 223 строки клиентской фильтрации 300+ заклинаний
- `spells.js:getSpellClasses()` — использует `eval()` для парсинга JS-файла (КРИТИЧЕСКАЯ УЯЗВИМОСТЬ)
- `spells.js:getLocalizedSpellData()` — 60 строк парсинга jsonData на клиенте

**План:**

### 5a. API: поиск заклинаний с фильтрацией
```
GET /api/spells?name=огонь&level=3&class=wizard&school=evocation&lang=ru
→ возвращает уже отфильтрованные и локализованные заклинания
```

**Реализация в `server.js`:**
- Добавить параметры `class`, `lang` в обработчик `/api/spells`
- Перенести логику `getSpellClasses()` на сервер (маппинг classSpells)
- Локализацию делать на сервере: парсить `jsonData`, возвращать нужный язык

### 5b. API: маппинг «заклинание → классы»
```
GET /api/spells/class-map
→ возвращает { "Fireball": ["wizard", "sorcerer"], ... }
```
**Убирает `eval()` из `getSpellClasses()`!**

### 5c. Упрощение клиента
- `showSpellSelectionModal()` → фильтры отправляются на сервер, клиент только рендерит результаты
- Удалить `getLocalizedSpellData()` — сервер возвращает готовые локализованные данные
- Удалить `getSpellClasses()` — сервер возвращает маппинг

**Изменяемые файлы:** `server.js`, `spells.js`, `models/database.js`

---

## ⏳ Этап 6: Таблицы прогрессии на сервер

**Проблема:** Прогрессия классов (spell slots, class resources) захардкожена в клиентских JS-файлах.

**План:**

### 6a. API: прогрессия класса
```
GET /api/classes/wizard/progression?level=5
→ { spellSlots: [...], features: [...], proficiencyBonus: 3 }
```

### 6b. Миграция данных
- `spell-slots-tables.js` → серверная логика
- `class-resource-registry.js` → `calcMax` переезжает на сервер (опционально)
- Клиент получает готовые слоты/ресурсы через API

**Изменяемые файлы:** `server.js`, `spell-slots-tables.js`, `spells.js`, `models/database.js`

---

## ⏳ Этап 7: Локализация на сервер

**Проблема:** Локализация заклинаний (ru/en) парсится на клиенте из `jsonData`.

**План:**

### 7a. API: локализованное заклинание
```
GET /api/spells/42/localized?lang=ru
→ { name: "Огненный шар", description: "...", school: "Воплощение", ... }
```

### 7b. Удаление клиентской логики
- Удалить `getLocalizedSpellData()` полностью
- API всегда возвращает данные на нужном языке

**Изменяемые файлы:** `server.js`, `spells.js`

---

## ⏳ Этап 8: База данных — миграция

**Цель:** Убрать зависимость от `localStorage`, перевести сохранение на сервер.

### 8a. Модель `users`

```sql
CREATE TABLE users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    login     TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL,   -- bcrypt hash
    created   TEXT    DEFAULT (datetime('now'))
);
```

### 8b. Модификация `characters`

```sql
-- Добавить колонку (миграция существующей таблицы):
ALTER TABLE characters ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Триггер на лимит 3 персонажа:
CREATE TRIGGER check_character_limit
BEFORE INSERT ON characters
BEGIN
    SELECT CASE
        WHEN (SELECT COUNT(*) FROM characters WHERE user_id = NEW.user_id) >= 3
        THEN RAISE(ABORT, 'Лимит: 3 персонажа на пользователя')
    END;
END;
```

### 8c. API endpoints

```
POST /api/auth/register   { login, password }           → { token, user }
POST /api/auth/login      { login, password }           → { token, user }
GET  /api/characters/mine                                → [{ id, name, race, level }]
POST /api/characters       { name, sheetData }           → { id }
PUT  /api/characters/:id   { sheetData }                 → { id }
```

### 8d. Миграция с localStorage

- При первой авторизации: предложить импортировать персонажа из localStorage
- После импорта: удалить localStorage-ключи
- Все последующие сохранения — через API

**Изменяемые файлы:** `server.js`, `models/database.js`, `storage.js`, `app.js`

---

## ⏳ Этап 9: UI авторизации

**Цель:** Заменить `prompt()` на модальные окна.

### 9a. Модальное окно логина/регистрации
- Поля: логин, пароль
- Кнопки: «Войти», «Зарегистрироваться»
- Валидация на клиенте + сервере
- JWT токен сохраняется в `localStorage`

### 9b. Экран выбора персонажа
- Показывается после успешной авторизации
- Список персонажей пользователя (до 3)
- Кнопки: «Загрузить», «Создать нового», «Импортировать», «Выйти»

### 9c. Замена prompt() в app.js
- `app.js:31-56` — prompt-диалоги заменяются на кастомные модалки
- Добавляется middleware проверки токена при старте

---

## 🏗️ Архитектура ПОСЛЕ завершения всех этапов

```
КЛИЕНТ (браузер)                    СЕРВЕР (Node.js)
├── CharacterModel                  ├── POST /api/auth/register
├── AbilityScores                   ├── POST /api/auth/login
├── HitPoints                       ├── GET/POST /api/characters
├── SpellBook                       ├── PUT/DELETE /api/characters/:id
├── ClassResourceRegistry           ├── GET /api/spells?name=&level=&class=&lang=
├── CharacterSheetView              ├── GET /api/spells/class-map
├── UI (рендеринг)                  ├── GET /api/classes/:name/progression
│   ├── stats / skills / saves      ├── GET /api/races
│   ├── spells / slots              ├── GET /api/classes
│   ├── attacks / resources         ├── bcrypt (хэши паролей)
│   ├── inventory / features        ├── JWT (токены)
│   └── notes / log                 └── SQLite (users + characters + spells + races + classes)
├── auth (JWT в localStorage)
└── fallback: localStorage (офлайн)
```

---

## 📅 Оценка по времени

| Этап | Описание | Часов | Критичность |
|------|----------|-------|-------------|
| 5. Фильтрация заклинаний | `eval()` + 223 строки → серверный поиск | 4 | 🔴 Critical (безопасность) |
| 6. Таблицы прогрессии | Хардкод → API | 3 | 🟡 Medium |
| 7. Локализация | Клиентский парсинг → сервер | 2 | 🟢 Low |
| 8. БД + миграция | users, FK, триггеры, API | 5 | 🔴 Critical |
| 9. UI авторизации | Модалки, замена prompt() | 4 | 🔴 Critical |
| **Итого** | | **~18 часов** | |
