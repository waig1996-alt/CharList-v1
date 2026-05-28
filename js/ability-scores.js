// ============ МОДЕЛЬ ХАРАКТЕРИСТИК (6 ability scores) ============
// Зависит от: state.js (state.stats)
//
// Инкапсулирует 6 характеристик D&D: STR, DEX, CON, INT, WIS, CHA.
// Заменяет: getMod() в utils.js и roll-engine.js (раньше читали из DOM!)
// Теперь все модификаторы считаются из state.stats — единственного источника истины.

var AbilityScores = {
    // Порядок характеристик (используется для итерации)
    KEYS: ['str', 'dex', 'con', 'int', 'wis', 'cha'],

    // Русские названия (используются в UI)
    NAMES: {
        str: 'Сила',       dex: 'Ловкость',      con: 'Телосложение',
        int: 'Интеллект',  wis: 'Мудрость',       cha: 'Харизма'
    },

    // Короткие названия (3 буквы)
    SHORT: {
        str: 'СИЛ',  dex: 'ЛОВ',  con: 'ТЕЛ',
        int: 'ИНТ',  wis: 'МУД',  cha: 'ХАР'
    },

    // ========== ГЕТТЕРЫ / СЕТТЕРЫ ==========

    /**
     * Получить значение характеристики из state (не из DOM!)
     * @param {string} ability — 'str', 'dex', 'con', 'int', 'wis', 'cha'
     * @returns {number} значение (по умолчанию 10)
     */
    get: function (ability) {
        return (state.stats && typeof state.stats[ability] === 'number')
            ? state.stats[ability]
            : 10;
    },

    /**
     * Установить значение характеристики в state И в DOM-инпут.
     * @param {string} ability
     * @param {number} value
     */
    set: function (ability, value) {
        state.stats[ability] = value;
        var el = document.getElementById(ability);
        if (el) el.value = value;
    },

    // ========== МОДИФИКАТОРЫ ==========

    /**
     * Модификатор характеристики: Math.floor((value - 10) / 2)
     * @param {string} ability
     * @returns {number} модификатор (например, +3, -1, 0)
     */
    modifier: function (ability) {
        return Math.floor((this.get(ability) - 10) / 2);
    },

    /**
     * Модификатор в виде строки: "+3", "-1", "0"
     * @param {string} ability
     * @returns {string}
     */
    modifierString: function (ability) {
        var m = this.modifier(ability);
        return (m >= 0 ? '+' : '') + m;
    },

    // ========== МАССОВЫЕ ОПЕРАЦИИ ==========

    /**
     * Применить бонусы к характеристикам (например, расовые).
     * Не опускает значение ниже 3.
     * @param {Object} boosts — { str: 2, dex: -1, cha: 1 }
     */
    applyBoosts: function (boosts) {
        var self = this;
        Object.keys(boosts).forEach(function (ability) {
            var current = self.get(ability);
            var newVal = Math.max(3, current + boosts[ability]);
            self.set(ability, newVal);
        });
    },

    /**
     * Откатить бонусы к характеристикам.
     * @param {Object} boosts — { str: 2, dex: -1 }
     */
    revertBoosts: function (boosts) {
        var self = this;
        Object.keys(boosts).forEach(function (ability) {
            var current = self.get(ability);
            var newVal = Math.max(3, current - boosts[ability]);
            self.set(ability, newVal);
        });
    },

    // ========== UI-СИНХРОНИЗАЦИЯ ==========

    /**
     * Обновить DOM-спаны с модификаторами (strMod, dexMod, ...)
     */
    updateModifierDisplay: function () {
        var self = this;
        this.KEYS.forEach(function (ability) {
            var spanEl = document.getElementById(ability + 'Mod');
            if (spanEl) {
                spanEl.innerText = self.modifierString(ability);
            }
        });
    },

    /**
     * Синхронизировать все DOM-инпуты и модификаторы из state.
     */
    syncDOM: function () {
        var self = this;
        this.KEYS.forEach(function (ability) {
            var inputEl = document.getElementById(ability);
            if (inputEl) inputEl.value = self.get(ability);
        });
        this.updateModifierDisplay();
    },

    /**
     * Получить все характеристики как массив для итерации.
     * @returns {Array<{key, value, modifier, name, short}>}
     */
    getAll: function () {
        var self = this;
        return this.KEYS.map(function (k) {
            return {
                key: k,
                value: self.get(k),
                modifier: self.modifier(k),
                modifierStr: self.modifierString(k),
                name: self.NAMES[k],
                short: self.SHORT[k]
            };
        });
    }
};
