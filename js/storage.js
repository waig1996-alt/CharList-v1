// ============ СОХРАНЕНИЕ / ЗАГРУЗКА ============
// Зависит от: state.js, character-model.js, auth-service.js
//
// Два уровня сохранения:
//   1. localStorage — быстро, офлайн, каждое изменение
//   2. Сервер (через AuthService) — надёжно, debounced, при закрытии страницы

// ========== АВТОСОХРАНЕНИЕ (localStorage + debounced server) ==========

var _serverSaveTimer = null;
var _serverSavePending = false;

function autoSave() {
    // 1. Всегда сохраняем в localStorage (мгновенно)
    localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(CharacterModel.toJSON()));

    // 2. Серверное сохранение — debounced (раз в 10 секунд)
    if (AuthService.isLoggedIn() && !_serverSavePending) {
        _serverSavePending = true;
        clearTimeout(_serverSaveTimer);
        _serverSaveTimer = setTimeout(function () {
            _serverSavePending = false;
            saveToServer();
        }, 10000);
    }
}

/** Принудительно сохранить на сервер сейчас (сбрасывает таймер) */
function flushServerSave() {
    clearTimeout(_serverSaveTimer);
    _serverSavePending = false;
    if (AuthService.isLoggedIn()) {
        saveToServer();
    }
}

// Сохранение при закрытии страницы
window.addEventListener('beforeunload', function () {
    flushServerSave();
});

// ========== МИГРАЦИЯ ВЕРСИЙ ==========

function checkAndMigrateVersion() {
    var savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    var currentVersion = APP_VERSION;

    if (!savedVersion) {
        localStorage.setItem(STORAGE_VERSION_KEY, currentVersion);
        return;
    }

    if (savedVersion !== currentVersion) {
        if (typeof addToLog === 'function') {
            addToLog('📌 Обновление с версии ' + savedVersion + ' до ' + currentVersion);
        }
        localStorage.setItem(STORAGE_VERSION_KEY, currentVersion);
        if (typeof addToLog === 'function') {
            addToLog('✅ Обновление завершено');
        }
    }
}

// ========== ЗАГРУЗКА ИЗ LOCALSTORAGE ==========

function loadData() {
    var saved = localStorage.getItem(STORAGE_DATA_KEY);
    if (!saved) return;

    try {
        var data = JSON.parse(saved);
        CharacterModel.fromJSON(data, { manualHpForced: true });
        addToLog('📀 Загружено сохранение');
    } catch (e) {
        console.error('Ошибка загрузки из localStorage:', e);
    }
}

// ========== ПОЛНЫЙ СБРОС ==========

function resetAll() {
    if (confirm("Сбросить всё? Это удалит все данные персонажа.")) {
        localStorage.clear();
        location.reload();
    }
}

// ========== СЕРВЕРНОЕ СОХРАНЕНИЕ / ЗАГРУЗКА ==========

/**
 * Сохранить текущего персонажа на сервер.
 * Требует активной сессии AuthService.
 */
async function saveToServer() {
    if (!AuthService.isLoggedIn()) return null;

    try {
        var sheetData = CharacterModel.toJSON();
        var result = await AuthService.saveCharacter({
            name: state.charName || 'Безымянный',
            sheetData: JSON.stringify(sheetData),
            characterId: state.serverCharacterId
        });

        if (result && result.id) {
            state.serverCharacterId = result.id;
        }

        return result;
    } catch (e) {
        return null;
    }
}

/**
 * Загрузить персонажа с сервера.
 */
async function loadFromServer(characterId) {
    try {
        var sheetData = await AuthService.loadCharacter(characterId);
        state.serverCharacterId = characterId;

        CharacterModel.fromJSON(sheetData, { manualHpForced: true });
        autoSave();

        addToLog('☁️ Загружено с сервера');
        return true;
    } catch (e) {
        addToLog('❌ Ошибка загрузки с сервера: ' + e.message);
        return false;
    }
}
