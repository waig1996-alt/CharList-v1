// ============ МОДЕЛЬ ПЕРСОНАЖА — ЕДИНАЯ ТОЧКА СЕРИАЛИЗАЦИИ ============
// Зависит от: state.js (state, APP_VERSION), constants.js, ui-core.js
// Все render-функции должны быть подключены ДО этого файла.
//
// Этот класс — ЕДИНСТВЕННОЕ место, которое знает полный список полей
// персонажа. storage.js и все импорты/экспорты используют только его.
// ПРИ ДОБАВЛЕНИИ НОВОГО ПОЛЯ В state добавляй его СЮДА, и никуда больше.

const CharacterModel = {
    // ========== КОНФИГУРАЦИЯ ПОЛЕЙ ==========
    // Каждое поле: { key, defaultVal, domId (опционально) }

    _FIELD_CONFIG: [
        // --- Массивы ---
        { key: 'spells',              defaultVal: [] },
        { key: 'spellSlots',          defaultVal: [] },
        { key: 'pinnedSpells',        defaultVal: [] },   // БАГФИКС: раньше не сохранялось
        { key: 'attacks',             defaultVal: [] },
        { key: 'inventoryItems',      defaultVal: [] },
        { key: 'features',            defaultVal: [] },
        { key: 'customSkills',        defaultVal: [] },
        { key: 'notes',               defaultVal: [] },
        { key: 'selectedRaceTraits',  defaultVal: [] },

        // --- Объекты ---
        { key: 'multClasses', defaultVal: [{ className: "fighter", level: 1, hitDice: 8 }] },
        { key: 'skillExtraBonuses', defaultVal: {} },
        { key: 'extraSaveBonuses',   defaultVal: {} },
        { key: 'stats',              defaultVal: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
          domIds: ['str', 'dex', 'con', 'int', 'wis', 'cha'] },
        { key: 'money',              defaultVal: { pp: 0, gp: 0, sp: 0, cp: 0 },
          domIds: ['pp', 'gp', 'sp', 'cp'] },
        { key: 'classResources',     defaultVal: null }, // обрабатывается отдельно
        { key: 'appliedRaceBoosts',  defaultVal: null },

        // --- Числа ---
        { key: 'currentHp',     defaultVal: 27,  domId: null },
        { key: 'maxHp',         defaultVal: 27,  domId: 'maxHpInput' },
        { key: 'deathSuccess',  defaultVal: 0 },
        { key: 'deathFail',     defaultVal: 0 },
        { key: 'tempHp',        defaultVal: 0,   domId: 'tempHp' },
        { key: 'profBonus',     defaultVal: 2,   domId: 'profBonus' },

        // --- Строки ---
        { key: 'primaryClass',  defaultVal: 'fighter' },
        { key: 'charName',      defaultVal: '',  domId: 'charName' },
        { key: 'charRace',      defaultVal: '',  domId: 'charRace' },

        // --- Специальные ---
        { key: 'hpHistory',       defaultVal: [] },
        { key: 'manualHpEnabled', defaultVal: false },
    ],

    // ========== СЕРИАЛИЗАЦИЯ: state → plain object ==========

    /**
     * Собрать полный JSON-слепок из глобального state.
     * ЕДИНСТВЕННЫЙ метод для автосохранения и экспорта.
     */
    toJSON: function () {
        var data = { version: APP_VERSION };

        this._FIELD_CONFIG.forEach(function (field) {
            if (field.key === 'classResources') {
                // Глубокая копия classResources
                data.classResources = JSON.parse(JSON.stringify(state.classResources));
            } else {
                data[field.key] = state[field.key];
            }
        });

        return data;
    },

    // ========== ДЕСЕРИАЛИЗАЦИЯ: plain object → state + DOM ==========

    /**
     * Загрузить данные в глобальный state и обновить DOM.
     * @param {Object} data   — распарсенный JSON
     * @param {Object} opts   — { manualHpForced: bool, debugLog: bool }
     *   manualHpForced=true  → игнорировать сохранённый manualHpEnabled, включить принудительно
     *   debugLog=true        → выводить console.log при каждом шаге
     */
    fromJSON: function (data, opts) {
        opts = opts || {};
        var self = this;

        if (opts.debugLog) {
            console.log('CharacterModel.fromJSON: начало импорта');
            console.log('CharacterModel.fromJSON: атаки=' + (data.attacks ? data.attacks.length : 0));
            console.log('CharacterModel.fromJSON: заклинания=' + (data.spells ? data.spells.length : 0));
            console.log('CharacterModel.fromJSON: инвентарь=' + (data.inventoryItems ? data.inventoryItems.length : 0));
        }

        // Шаг 1: заполнить state из data
        this._FIELD_CONFIG.forEach(function (field) {
            var val = data[field.key];
            if (val === undefined || val === null) {
                // Тип-чувствительный default: массивы/объекты копируем, примитивы — как есть
                if (Array.isArray(field.defaultVal)) {
                    state[field.key] = field.defaultVal.slice();
                } else if (field.defaultVal !== null && typeof field.defaultVal === 'object') {
                    state[field.key] = JSON.parse(JSON.stringify(field.defaultVal));
                } else {
                    state[field.key] = field.defaultVal;
                }
            } else {
                state[field.key] = val;
            }
        });

        // classResources — глубокая замена (merge с дефолтами, чтобы не потерять ключи)
        if (data.classResources) {
            var merged = {};
            var defaults = {
                barbarian: { name: "Ярость", current: 2, max: 2 },
                bard: { name: "Вдохновение барда", current: 0, max: 0 },
                cleric: { name: "Божественный канал", current: 1, max: 1 },
                druid: { name: "Дикая форма", current: 0, max: 0 },
                fighter: { name: "Всплеск действий", current: 1, max: 1 },
                monk: { name: "Очки Ци", current: 0, max: 0 },
                paladin: { name: "Божественная кара", current: 0, max: 0 },
                ranger: { name: "Метка охотника", current: 0, max: 0 },
                rogue: { name: "Скрытая атака", current: 0, max: 0 },
                sorcerer: { name: "Очки чародейства", current: 0, max: 0 },
                warlock: { name: "Ячейки заклинаний", current: 0, max: 0 },
                wizard: { name: "Восстановление заклинаний", current: 0, max: 0 }
            };
            Object.keys(defaults).forEach(function (k) {
                merged[k] = data.classResources[k] || defaults[k];
            });
            state.classResources = merged;
        }

        // primaryClass: если нет в данных, берём из первого класса
        if (!state.primaryClass || state.primaryClass === 'fighter') {
            if (data.primaryClass) {
                state.primaryClass = data.primaryClass;
            } else if (state.multClasses.length > 0) {
                state.primaryClass = state.multClasses[0].className;
            }
        }

        // manualHpEnabled: принудительно или из данных
        if (opts.manualHpForced) {
            state.manualHpEnabled = true;
        } else {
            state.manualHpEnabled = data.manualHpEnabled || false;
        }

        // Шаг 2: обновить DOM-инпуты из state
        this._syncDOMFromState(opts);

        // Шаг 3: перерисовать все UI-компоненты
        this._renderAll(opts);

        if (opts.debugLog) {
            console.log('CharacterModel.fromJSON: импорт завершён');
        }
    },

    // ========== DOM-СИНХРОНИЗАЦИЯ ==========

    /**
     * Записать значения из state в соответствующие DOM-элементы.
     */
    _syncDOMFromState: function (opts) {
        // Характеристики
        if (state.stats) {
            ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.value = state.stats[id] || 0;
            });
        }

        // Деньги
        if (state.money) {
            ['pp', 'gp', 'sp', 'cp'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.value = state.money[id] || 0;
            });
        } else {
            ['pp', 'gp', 'sp', 'cp'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.value = state.money ? (state.money[id] || 0) : 0;
            });
        }

        // Простые DOM-биндинги из конфига
        var self = this;
        var simpleBindings = [
            { stateKey: 'profBonus',  domId: 'profBonus' },
            { stateKey: 'tempHp',     domId: 'tempHp' },
            { stateKey: 'charName',   domId: 'charName' },
            { stateKey: 'charRace',   domId: 'charRace' },
            { stateKey: 'maxHp',      domId: 'maxHpInput' }
        ];

        simpleBindings.forEach(function (b) {
            var el = document.getElementById(b.domId);
            if (el) el.value = state[b.stateKey];
        });

        // Ручное редактирование HP
        var hpCheckbox = document.getElementById('manualHpCheckbox');
        var maxHpInput = document.getElementById('maxHpInput');
        if (hpCheckbox) {
            hpCheckbox.checked = state.manualHpEnabled;
            hpCheckbox.disabled = state.manualHpEnabled; // если принудительно — disabled
        }
        if (maxHpInput) {
            maxHpInput.disabled = !state.manualHpEnabled;
            maxHpInput.value = state.maxHp;
        }
    },

    // ========== ПОЛНЫЙ РЕРЕНДЕР (вызов всех render-функций) ==========

    /**
     * Вызвать все render-функции в правильном порядке.
     * Используется при загрузке и импорте персонажа.
     * Делегирует в CharacterSheetView — единственный координатор рендеринга.
     */
    _renderAll: function (opts) {
        if (opts && opts.debugLog) console.log('CharacterModel._renderAll: начало...');
        if (typeof CharacterSheetView !== 'undefined' && CharacterSheetView.renderAll) {
            CharacterSheetView.renderAll({ debug: !!(opts && opts.debugLog) });
        }
        // Fallback: если View ещё не загружен, вызываем напрямую
        else {
            if (typeof updateExhaustionEffects === 'function') updateExhaustionEffects();
            if (typeof updateSpeedDisplay === 'function') updateSpeedDisplay();
            if (typeof updateMaxHp === 'function') updateMaxHp();
            if (typeof renderMulticlass === 'function') renderMulticlass();
            if (typeof renderSavingThrows === 'function') renderSavingThrows();
            if (typeof renderSkills === 'function') renderSkills();
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof renderSpells === 'function') renderSpells();
            if (typeof renderSlots === 'function') renderSlots();
            if (typeof renderAttacks === 'function') renderAttacks();
            if (typeof renderFeatures === 'function') renderFeatures();
            if (typeof renderNotes === 'function') renderNotes();
            if (typeof renderClassResource === 'function') renderClassResource();
            if (typeof updateUI === 'function') updateUI();
            if (typeof updateRaceDisplay === 'function') updateRaceDisplay();
        }
    },

    // ========== СОХРАНЕНИЕ В ФАЙЛ (JSON Blob) ==========

    /**
     * Скачать персонажа как JSON-файл.
     * Использует File System Access API если доступен, иначе Blob-ссылку.
     */
    saveToFile: async function () {
        var jsonStr = JSON.stringify(this.toJSON(), null, 2);
        var blob = new Blob([jsonStr], { type: "application/json" });
        var filename = 'character_' + (state.charName || 'unnamed') + '.json';

        // File System Access API (Chrome)
        if (window.showSaveFilePicker) {
            try {
                var handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'JSON файл',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                var writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                addToLog('💾 Сохранено в файл');
                return;
            } catch (err) {
                if (err.name !== 'AbortError') console.error(err);
            }
        }

        // Fallback
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        addToLog('💾 Сохранено в файл');
    },

    // ========== ЗАГРУЗКА ИЗ ФАЙЛА ==========

    /**
     * Показать диалог выбора файла и импортировать персонажа.
     */
    loadFromFile: function () {
        var inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'application/json';

        inp.onchange = function (e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    var data = JSON.parse(ev.target.result);
                    CharacterModel.fromJSON(data, { manualHpForced: false, debugLog: true });
                    addToLog('📀 Загружено из файла');
                    autoSave();
                } catch (err) {
                    addToLog('❌ Ошибка загрузки файла: ' + err.message);
                }
            };
            reader.readAsText(file);
        };

        inp.click();
    }
};
