// ============ ТОЧКА ВХОДА - ЗАПУСК ПРИЛОЖЕНИЯ ============
// Зависит от: ВСЕХ модулей (подключены в index.html перед этим файлом)
//
// ПОСЛЕ РЕФАКТОРИНГА: рендеринг делегирован в CharacterSheetView.
// app.js занимается только: версией, темой, диалогом, маршрутизацией.

document.addEventListener('DOMContentLoaded', async () => {
    // Версия
    const versionSpan = document.getElementById('appVersion');
    if (versionSpan) versionSpan.textContent = APP_VERSION;

    // Миграция
    checkAndMigrateVersion();

    // Загрузка рас из БД
    if (typeof loadRaceOptionsFromDb === 'function') {
        await loadRaceOptionsFromDb();
    }

    // Базовый рендер интерфейса (до загрузки данных)
    CharacterSheetView.renderAll();

    // Биндинг событий (один раз)
    CharacterSheetView.bindEvents();

    // Тема
    const savedTheme = localStorage.getItem('dnd_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.innerHTML = '☀️ Светлая тема';
    }

    // Проверка наличия сохранения
    const saved = localStorage.getItem(STORAGE_DATA_KEY);
    var savedData = null;
    var hasSavedData = false;

    if (saved) {
        try {
            savedData = JSON.parse(saved);
            hasSavedData = savedData.charName ||
                           (savedData.primaryClass !== 'fighter') ||
                           (savedData.multClasses[0]?.level > 1);
        } catch(e) {}
    }

    var action = '1';
    var needImport = false;

    if (hasSavedData) {
        action = prompt(
            '🔄 Найдено сохранение персонажа "' + (savedData.charName || 'Безымянный') + '" (' + (classNames[savedData.primaryClass] || savedData.primaryClass) + ', уровень ' + (savedData.multClasses[0]?.level || 1) + ').' +
            '\n\nВведите номер действия:\n' +
            '1 - Загрузить сохранение\n' +
            '2 - Создать нового персонажа\n' +
            '3 - Импортировать персонажа из JSON файла'
        );
        needImport = (action === '3');
    } else {
        action = prompt(
            '🎭 Добро пожаловать в D&D 5e Character Sheet!\n\n' +
            'Введите номер действия:\n' +
            '1 - Создать нового персонажа\n' +
            '2 - Импортировать персонажа из JSON файла'
        );
        needImport = (action === '2');
    }

    // Если выбран импорт — сразу открываем диалог выбора файла
    if (needImport) {
        if (typeof triggerFileImport === 'function') {
            setTimeout(function () { triggerFileImport(); }, 100);
        } else {
            addToLog('📀 Нажмите кнопку "📂 Загрузить" в блоке Журнал для импорта персонажа из JSON файла');
            alert('Для импорта персонажа нажмите кнопку "📂 Загрузить" в блоке "Журнал"');
        }
        return;
    }

    // Обработка остальных вариантов
    if (hasSavedData && action === '1') {
        loadData();
    }
    else if ((hasSavedData && action === '2') || (!hasSavedData && action === '1')) {
        if (hasSavedData) {
            localStorage.removeItem(STORAGE_DATA_KEY);
            localStorage.removeItem('dnd_roll_history');
        }
        await initNewCharacter();
    }
    else {
        if (!hasSavedData) {
            await initNewCharacter();
        } else {
            loadData();
        }
    }

    addToLog("🌸 Лист персонажа загружен.");
});
