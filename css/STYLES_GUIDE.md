# 🎨 Руководство по стилям D&D 5e Character Sheet

## Обзор

Этот документ описывает все основные стили и компоненты приложения. Следуйте этому руководству при добавлении новых элементов для поддержания единообразного дизайна.

---

## 📦 CSS Переменные (CSS Variables)

Все основные цвета и размеры определены как CSS переменные в `:root`:

```css
/* Фоны */
--bg-body: #09090d;              /* Фон страницы */
--bg-sheet: #13131a;             /* Фон листа персонажа */
--bg-card: rgba(20, 20, 30, 0.85); /* Фон карточек */

/* Текст */
--text-primary: #f0edf7;         /* Основной текст */
--text-secondary: #9b98ac;       /* Вспомогательный текст */

/* Inputs и формы */
--input-bg: rgba(30, 30, 44, 0.95);           /* Фон input */
--input-border: rgba(255, 255, 255, 0.12);    /* Граница input */
--input-radius: 10px;                         /* Скругление input */

/* Кнопки */
--button-bg: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); /* Основной градиент */
--button-text: #ffffff;                                          /* Текст на кнопке */

/* Акценты */
--accent: #7c3aed;               /* Фиолетовый акцент */
--accent-light: #a78bfa;         /* Светлый фиолетовый */

/* Размеры */
--card-radius: 16px;             /* Скругление карточек */
--input-radius: 10px;            /* Скругление input */
```

**Как использовать:** `background: var(--accent);` или `color: var(--text-primary);`

---

## 🔘 Кнопки (Buttons)

### Базовый стиль кнопки

```html
<!-- Основная кнопка (Primary/Purple) -->
<button class="btn">Действие</button>

<!-- Вспомогательная кнопка (Secondary/Gray) -->
<button class="btn-secondary">Отмена</button>

<!-- Кнопка опасного действия (Danger/Red) -->
<button class="btn-danger">Удалить</button>

<!-- Кнопка успеха (Success/Green) -->
<button class="btn-success">Применить</button>

<!-- Кнопка предупреждения (Warning/Orange) -->
<button class="btn-warning">Осторожно</button>
```

### Размеры кнопок

```html
<!-- Маленькая кнопка: 28px высота -->
<button class="btn btn-small">Маленькая</button>

<!-- Средняя кнопка: 36px высота (по умолчанию) -->
<button class="btn btn-medium">Средняя</button>

<!-- Большая кнопка: 44px высота -->
<button class="btn btn-large">Большая</button>
```

### Предустановленные кнопки

```html
<!-- Dice/Action кнопка (для бросков и действий) -->
<button class="dice">🎲 Бросить</button>

<!-- Collapse кнопка -->
<button class="collapse-all-btn">⬇️ Свернуть все</button>

<!-- Toggle для темы -->
<button class="theme-toggle">🌙 Тема</button>

<!-- Level up кнопка -->
<button class="level-up-btn">⬆️ Повысить уровень</button>
```

### Примеры в коде

```html
<!-- ✅ Правильно -->
<button class="btn btn-primary">Основное действие</button>
<button class="btn-success btn-small">Применить</button>
<button class="btn-danger">Удалить</button>

<!-- ❌ Неправильно (избегать) -->
<button style="background: red;">Кнопка</button>
<button class="custom-btn">Кнопка</button>
```

---

## 📝 Input поля (Input/Form Elements)

### Базовый стиль input

```html
<!-- Text input -->
<input type="text" placeholder="Введите текст">

<!-- Number input -->
<input type="number" min="0" max="100" value="10">

<!-- Email -->
<input type="email" placeholder="email@example.com">

<!-- Select -->
<select>
    <option>Вариант 1</option>
    <option>Вариант 2</option>
</select>
```

### Базовый CSS стиль для input элементов

**Название:** `input[type="text"], input[type="number"], select`

**Описание:** Основной стиль для всех input и select элементов

**CSS:**
```css
input[type="text"],
input[type="number"],
input[type="email"],
input[type="password"],
input[type="search"],
input[type="tel"],
input[type="url"],
select {
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: var(--input-radius);
    padding: 6px 10px;
    font-size: 0.85rem;
    color: var(--text-primary);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}

/* При фокусе */
input:focus,
select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.15);
}
```

### Input группа (для нескольких input на одной строке)

```html
<!-- Input группа используется для удобного размещения -->
<div class="input-group">
    <input type="text" placeholder="Первое поле">
    <input type="text" placeholder="Второе поле">
    <button class="btn btn-small">Применить</button>
</div>
```

**CSS:**
```css
.input-group {
    display: flex;
    gap: 8px;
    margin: 10px 0;
    flex-wrap: wrap;
    align-items: center;
}
```

### Примеры в коде

```html
<!-- ✅ Правильно -->
<input type="number" id="maxHpInput" value="27">
<div class="input-group">
    <input type="text" placeholder="Название">
    <button class="btn btn-small">Добавить</button>
</div>

<!-- ❌ Неправильно (избегать) -->
<input type="number" style="width:60px; background: #333;">
<input type="text" class="custom-input">
```

---

## 🎨 Специальные компоненты

### Карточка (Card)

```html
<div class="stat-card">
    <div class="card-header">
        <h3>📦 Название блока</h3>
        <span class="collapse-icon">▼</span>
    </div>
    <div class="card-content">
        <!-- Содержимое -->
    </div>
</div>
```

### Деньги (Money row)

```html
<div class="money-row">
    <div>🪙 PP <input id="pp" value="0"></div>
    <div>🪙 GP <input id="gp" value="0"></div>
    <div>🪙 SP <input id="sp" value="0"></div>
    <div>🪙 CP <input id="cp" value="0"></div>
</div>
```

### Modal окно

```html
<div class="modal-content">
    <input type="text" placeholder="Введите данные">
    <textarea placeholder="Описание"></textarea>
    <button class="btn btn-primary">Сохранить</button>
</div>
```

---

## 📐 Макет и сетка

### Grid макет (2 колонны)

```css
.grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}
```

### Flexbox контейнер

```html
<div style="display: flex; gap: 10px;">
    <!-- Элементы -->
</div>
```

---

## 🌓 Темизация и адаптивность

Приложение имеет тёмную тему по умолчанию. Переменные CSS можно переопределить для светлой темы или других вариантов:

```css
:root.light-theme {
    --bg-body: #ffffff;
    --text-primary: #1a1a1a;
    /* и т.д. */
}
```

---

## ✅ Чеклист при добавлении новых элементов

- [ ] Используются ли CSS переменные вместо хардкода цветов?
- [ ] Используются ли классы `.btn`, `.btn-small`, `.btn-medium`, `.btn-large` для кнопок?
- [ ] Используются ли классы `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-success`, `.btn-warning` для цветов?
- [ ] Используются ли базовые стили для input вместо inline стилей `style="..."`?
- [ ] Есть ли скругления углов (border-radius)?
- [ ] Есть ли переход при фокусе или hover?
- [ ] Протестировано ли в разных разрешениях?

---

## 📋 Примеры использования

### Пример 1: Добавление новой карточки

```html
<!-- ✅ Правильно -->
<div class="stat-card">
    <div class="card-header">
        <h3>🆕 Новая функция</h3>
        <span class="collapse-icon">▼</span>
    </div>
    <div class="card-content">
        <div class="input-group">
            <input type="text" placeholder="Данные">
            <button class="btn btn-success btn-small">Добавить</button>
        </div>
    </div>
</div>
```

### Пример 2: Добавление группы кнопок

```html
<!-- ✅ Правильно -->
<div class="input-group">
    <button class="btn btn-primary">Сохранить</button>
    <button class="btn-secondary">Отмена</button>
    <button class="btn-danger btn-small">Удалить</button>
</div>
```

### Пример 3: Форма ввода

```html
<!-- ✅ Правильно -->
<div class="input-group">
    <input type="number" placeholder="Количество" min="1">
    <input type="text" placeholder="Описание" style="flex: 1;">
    <button class="btn btn-success">✓ OK</button>
</div>
```

---

## 📞 Контакты для вопросов

При возникновении вопросов о стилях - обратитесь к этому документу или проверьте исходный файл стилей: `css/style.css`

**Последнее обновление:** 2026-06-01
