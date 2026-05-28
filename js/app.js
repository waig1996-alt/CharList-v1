// ============ ТОЧКА ВХОДА - ЗАПУСК ПРИЛОЖЕНИЯ ============
// Зависит от: ВСЕХ модулей (подключены в index.html перед этим файлом)
//
// ПОСЛЕ РЕФАКТОРИНГА (Stage 9):
//   1. Рендеринг → CharacterSheetView
//   2. Авторизация → AuthUI + AuthService
//   3. Сохранение → localStorage (быстро) + сервер (надёжно)

document.addEventListener('DOMContentLoaded', async () => {
    // Версия
    var versionSpan = document.getElementById('appVersion');
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
    var savedTheme = localStorage.getItem('dnd_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        var themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.innerHTML = '☀️ Светлая тема';
    }

    // ========== АВТОРИЗАЦИЯ ==========

    // Пробуем восстановить сессию
    var hasSession = AuthService.loadSession();

    if (hasSession) {
        // Сессия есть — сразу к персонажам
        await handleServerFlow();
    } else {
        // Нет сессии — показываем модалку
        var authChoice = await AuthUI.showAuthModal();

        if (authChoice === 'server') {
            await handleServerFlow();
        } else {
            // Локальный режим (localStorage)
            handleLocalFlow();
        }
    }

    addToLog("🌸 Лист персонажа загружен.");
});

// ========== СЕРВЕРНЫЙ ПОТОК (авторизованный пользователь) ==========

async function handleServerFlow() {
    var characters;
    try {
        characters = await AuthService.getMyCharacters();
    } catch (e) {
        addToLog('❌ Ошибка соединения с сервером: ' + e.message);
        handleLocalFlow();
        return;
    }

    while (true) {
        var choice = await AuthUI.showCharacterSelectModal(characters);

        if (choice.action === 'logout') {
            // Показать модалку авторизации заново
            var authChoice = await AuthUI.showAuthModal();
            if (authChoice === 'server') {
                characters = await AuthService.getMyCharacters();
                continue;
            } else {
                handleLocalFlow();
                return;
            }
        }

        if (choice.action === 'create') {
            await initNewCharacter();
            // Автосохранение на сервер после создания
            await saveToServer();
            return;
        }

        if (choice.action === 'load') {
            var loaded = await loadFromServer(choice.characterId);
            if (loaded) {
                return;
            }
            // Ошибка загрузки — обновить список и показать заново
            characters = await AuthService.getMyCharacters();
        }
    }
}

// ========== ЛОКАЛЬНЫЙ ПОТОК (localStorage, без сервера) ==========

function handleLocalFlow() {
    var saved = localStorage.getItem(STORAGE_DATA_KEY);
    var savedData = null;
    var hasSavedData = false;

    if (saved) {
        try {
            savedData = JSON.parse(saved);
            hasSavedData = savedData.charName ||
                           (savedData.primaryClass !== 'fighter') ||
                           (savedData.multClasses && savedData.multClasses[0] && savedData.multClasses[0].level > 1);
        } catch(e) {}
    }

    if (hasSavedData) {
        var action = prompt(
            '🔄 Найдено сохранение персонажа "' + (savedData.charName || 'Безымянный') + '" (' +
            (classNames[savedData.primaryClass] || savedData.primaryClass) + ', уровень ' +
            (savedData.multClasses && savedData.multClasses[0] ? savedData.multClasses[0].level : 1) + ').' +
            '\n\nВведите номер действия:\n' +
            '1 - Загрузить сохранение\n' +
            '2 - Создать нового персонажа'
        );
        if (action === '1') {
            loadData();
        } else {
            localStorage.removeItem(STORAGE_DATA_KEY);
            localStorage.removeItem('dnd_roll_history');
            initNewCharacter();
        }
    } else {
        initNewCharacter();
    }
}
