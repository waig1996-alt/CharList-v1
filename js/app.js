// ============ ТОЧКА ВХОДА - ЗАПУСК ПРИЛОЖЕНИЯ ============
// Зависит от: ВСЕХ модулей (подключены в index.html перед этим файлом)

document.addEventListener('DOMContentLoaded', async () => {
    const versionSpan = document.getElementById('appVersion');
    if (versionSpan) versionSpan.textContent = APP_VERSION;

    checkAndMigrateVersion();

    if (typeof loadRaceOptionsFromDb === 'function') {
        await loadRaceOptionsFromDb();
    }

    const saved = localStorage.getItem(STORAGE_DATA_KEY);
    let savedData = null;
    let hasSavedData = false;

    if (saved) {
        try {
            savedData = JSON.parse(saved);
            hasSavedData = savedData.charName ||
                           (savedData.primaryClass !== 'fighter') ||
                           (savedData.multClasses[0]?.level > 1);
        } catch(e) {}
    }

    let action = '1';
    let needImport = false;

    if (hasSavedData) {
        action = prompt(
            '🔄 Найдено сохранение персонажа "' + (savedData.charName || 'Безымянный') + '" (' + (classNames[savedData.primaryClass] || savedData.primaryClass) + ', уровень ' + (savedData.multClasses[0]?.level || 1) + ').' +
            '\n' +
            '\n' +
            'Введите номер действия:' +
            '\n' +
            '1 - Загрузить сохранение' +
            '\n' +
            '2 - Создать нового персонажа' +
            '\n' +
            '3 - Импортировать персонажа из JSON файла'
        );
        needImport = (action === '3');
    } else {
        action = prompt(
            '🎭 Добро пожаловать в D&D 5e Character Sheet!' +
            '\n' +
            '\n' +
            'Введите номер действия:' +
            '\n' +
            '1 - Создать нового персонажа' +
            '\n' +
            '2 - Импортировать персонажа из JSON файла'
        );
        needImport = (action === '2');
    }

    // Сначала рендерим базовый интерфейс
    if (typeof updateSpeedDisplay === 'function') updateSpeedDisplay();
    if (typeof updateExhaustionEffects === 'function') updateExhaustionEffects();
    if (typeof updateMaxHp === 'function') updateMaxHp();
    if (typeof renderSkills === 'function') renderSkills();
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof renderSpells === 'function') renderSpells();
    if (typeof renderSlots === 'function') renderSlots();
    if (typeof renderAttacks === 'function') renderAttacks();
    if (typeof renderFeatures === 'function') renderFeatures();
    if (typeof renderNotes === 'function') renderNotes();
    if (typeof initEventHandlers === 'function') initEventHandlers();

    const savedTheme = localStorage.getItem('dnd_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.innerHTML = '☀️ Светлая тема';
    }

    // Если выбран импорт — сразу открываем диалог выбора файла
    if (needImport) {
        if (typeof triggerFileImport === 'function') {
            setTimeout(() => triggerFileImport(), 100);
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
