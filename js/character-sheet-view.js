// ============ КООРДИНАТОР РЕНДЕРИНГА (View-слой) ============
// Зависит от: ВСЕХ render-функций (подключены в index.html до этого файла)
//
// ЕДИНСТВЕННОЕ место, которое знает правильный порядок рендеринга.
// Заменяет 15 разрозненных вызовов в app.js, character-model.js, character-init.js.
//
// Слои рендеринга (в порядке выполнения):
//   1. Состояние (exhaustion → speed → maxHp)  — влияют друг на друга
//   2. Основные секции (multiclass, saves, skills, inventory)
//   3. Заклинания (spells → slots)
//   4. Бой (attacks, classResources)
//   5. Прочее (features, notes, UI sync, race)

var CharacterSheetView = {

    // ========== РЕНДЕР-ДВИЖОК ==========

    /**
     * Вызвать render-функцию с проверкой существования.
     * @param {string} fnName — имя глобальной функции
     * @param {boolean} [debug] — логировать вызов
     */
    _call: function (fnName, debug) {
        if (typeof window[fnName] === 'function') {
            if (debug) console.log('  render: ' + fnName);
            window[fnName]();
        }
    },

    // ========== ПОЛНЫЙ РЕНДЕР (загрузка / импорт / новый персонаж) ==========

    /**
     * Полный рендер всех секций листа персонажа.
     * Вызывается при: загрузке из localStorage, импорте из файла, создании персонажа.
     * @param {Object} [opts] — { debug: true }
     */
    renderAll: function (opts) {
        opts = opts || {};

        // --- СЛОЙ 1: Состояние (зависимости: exhaustion → speed → maxHp) ---
        this._call('updateExhaustionEffects');
        this._call('updateSpeedDisplay');
        this._call('updateMaxHp');

        // --- СЛОЙ 2: Основные секции ---
        this._call('renderMulticlass');
        this._call('renderSavingThrows');
        this._call('renderSkills');
        this._call('renderInventory');

        // --- СЛОЙ 3: Заклинания ---
        if (opts.debug) console.log('  render: renderSpells');
        this._call('renderSpells');
        this._call('renderSlots');

        // --- СЛОЙ 4: Бой ---
        if (opts.debug) console.log('  render: renderAttacks');
        this._call('renderAttacks');
        this._call('renderClassResource');

        // --- СЛОЙ 5: Прочее ---
        if (opts.debug) console.log('  render: renderFeatures');
        this._call('renderFeatures');
        if (opts.debug) console.log('  render: renderNotes');
        this._call('renderNotes');
        this._call('updateUI');
        this._call('updateRaceDisplay');
    },

    // ========== ОБЛЕГЧЁННЫЙ РЕНДЕР (после создания персонажа) ==========

    /**
     * Минимальный рендер после инициализации нового персонажа.
     * Не перерисовывает инвентарь/заклинания/атаки (их ещё нет).
     */
    renderAfterInit: function () {
        this._call('renderMulticlass');
        this._call('renderSavingThrows');
        this._call('renderClassResource');
        this._call('updateUI');
    },

    // ========== МЯГКАЯ СИНХРОНИЗАЦИЯ (HP + скорость + истощение) ==========

    /**
     * Обновить только HP, скорость и истощение — без полного ререндера.
     * Вызывается при: изменении истощения, скорости, получении урона/лечения.
     */
    softSync: function () {
        this._call('updateExhaustionEffects');
        this._call('updateSpeedDisplay');
        this._call('updateMaxHp');
        this._call('updateUI');
    },

    // ========== БИНДИНГ СОБЫТИЙ ==========

    /**
     * Инициализировать все обработчики событий.
     * Вызывается ОДИН раз при старте приложения.
     */
    bindEvents: function () {
        this._call('initEventHandlers');
    }
};
