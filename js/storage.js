// ============ СОХРАНЕНИЕ / ЗАГРУЗКА / ИМПОРТ / ЭКСПОРТ ============
// Зависит от: state.js, constants.js, ui-core.js, character-model.js
//
// ПОСЛЕ РЕФАКТОРИНГА: все знания о полях персонажа живут в CharacterModel.
// Этот файл — ТОЛЬКО обвязка над localStorage и файловым вводом/выводом.

// ========== АВТОСОХРАНЕНИЕ ==========

function autoSave() {
    localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(CharacterModel.toJSON()));
}

// ========== МИГРАЦИЯ ВЕРСИЙ ==========

function checkAndMigrateVersion() {
    var savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    var currentVersion = APP_VERSION;

    if (!savedVersion) {
        localStorage.setItem(STORAGE_VERSION_KEY, currentVersion);
        // addToLog здесь не вызываем — DOM может быть ещё не готов
        return;
    }

    if (savedVersion !== currentVersion) {
        // Миграция будет вызвана после загрузки DOM
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
        // manualHpForced = true: после загрузки из localStorage принудительно
        // включаем ручное редактирование HP (историческое поведение)
        CharacterModel.fromJSON(data, { manualHpForced: true });
        addToLog('📀 Загружено сохранение');
    } catch (e) {
        console.error('Ошибка загрузки из localStorage:', e);
    }
}

// ========== СОХРАНЕНИЕ В JSON-ФАЙЛ ==========

async function saveToFile() {
    await CharacterModel.saveToFile();
}

// ========== ЗАГРУЗКА ИЗ JSON-ФАЙЛА ==========

function loadFromFile() {
    CharacterModel.loadFromFile();
}

// ========== ИМПОРТ ДАННЫХ ПЕРСОНАЖА (без очистки localStorage) ==========

function importCharacterData(data) {
    // Используется при загрузке из файла (loadFromFile уже делает fromJSON сам)
    // и при сбросе. Оставлен для обратной совместимости.
    CharacterModel.fromJSON(data, { manualHpForced: false, debugLog: true });
    autoSave();
}

// ========== ТРИГГЕР ИМПОРТА (при старте приложения) ==========

function triggerFileImport() {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = function (e) {
        var file = e.target.files[0];
        if (!file) return;

        var reader = new FileReader();
        reader.onload = function (ev) {
            try {
                var data = JSON.parse(ev.target.result);
                // Очищаем старые данные перед импортом
                localStorage.removeItem(STORAGE_DATA_KEY);
                localStorage.removeItem('dnd_roll_history');

                CharacterModel.fromJSON(data, { manualHpForced: false, debugLog: true });
                autoSave();
                addToLog('📀 Импортирован персонаж ' + (state.charName || 'Безымянный'));
            } catch (err) {
                addToLog('❌ Ошибка импорта: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    // Авто-клик: открыть диалог выбора файла
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
}

// ========== ПОЛНЫЙ СБРОС ==========

function resetAll() {
    if (confirm("Сбросить всё? Это удалит все данные персонажа.")) {
        localStorage.clear();
        location.reload();
    }
}
