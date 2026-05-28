// ============ МОДЕЛЬ КНИГИ ЗАКЛИНАНИЙ ============
// Зависит от: state.js, ability-scores.js
//
// Инкапсулирует управление заклинаниями и ячейками.
// Сложная логика пересчёта слотов (мультикласс) пока в spells.js.

var SpellBook = {
    // ========== СПИСОК ЗАКЛИНАНИЙ ==========

    /** Все известные заклинания */
    all: function () { return state.spells; },

    /** Количество заклинаний */
    count: function () { return state.spells.length; },

    /**
     * Добавить заклинание в книгу.
     * @param {Object} spell — { name, level, action, castTime, attr, damage, description, ... }
     */
    add: function (spell) {
        state.spells.push(spell);
    },

    /**
     * Удалить заклинание по индексу.
     * @param {number} idx — индекс в массиве state.spells
     */
    remove: function (idx) {
        if (idx >= 0 && idx < state.spells.length) {
            state.spells.splice(idx, 1);
            return true;
        }
        return false;
    },

    /**
     * Получить заклинание по индексу.
     * @param {number} idx
     * @returns {Object|null}
     */
    get: function (idx) {
        return state.spells[idx] || null;
    },

    /**
     * Сгруппировать заклинания по уровню для отображения.
     * @returns {Object} — { 0: [spell, ...], 1: [...], ... }
     */
    getByLevel: function () {
        var grouped = {};
        state.spells.forEach(function (spell) {
            var lvl = spell.level || 0;
            if (!grouped[lvl]) grouped[lvl] = [];
            grouped[lvl].push(spell);
        });
        return grouped;
    },

    // ========== ЗАКРЕПЛЁННЫЕ ЗАКЛИНАНИЯ ==========

    pinned: function () { return state.pinnedSpells || []; },

    pin: function (name, notes) {
        if (!state.pinnedSpells) state.pinnedSpells = [];
        state.pinnedSpells.push({ name: name, notes: notes || '' });
    },

    unpin: function (idx) {
        if (state.pinnedSpells && idx >= 0 && idx < state.pinnedSpells.length) {
            state.pinnedSpells.splice(idx, 1);
            return true;
        }
        return false;
    },

    // ========== ЯЧЕЙКИ ЗАКЛИНАНИЙ ==========

    /** Все ячейки заклинаний */
    slots: function () { return state.spellSlots; },

    /**
     * Проверить, есть ли доступная ячейка указанного уровня.
     * @param {number} level — 1-9
     * @returns {boolean}
     */
    hasSlot: function (level) {
        var slot = state.spellSlots.find(function (s) { return parseInt(s.level) === level; });
        return slot ? slot.current > 0 : false;
    },

    /**
     * Использовать ячейку указанного уровня (уменьшить current на 1).
     * @param {number} level
     * @returns {boolean} — true если ячейка была использована
     */
    useSlot: function (level) {
        var slot = state.spellSlots.find(function (s) { return parseInt(s.level) === level; });
        if (slot && slot.current > 0) {
            slot.current--;
            return true;
        }
        return false;
    },

    /** Восстановить все ячейки заклинаний до максимума */
    restoreAllSlots: function () {
        state.spellSlots.forEach(function (slot) {
            slot.current = slot.max;
        });
    },

    /**
     * Добавить новый уровень ячеек.
     * @param {number} level
     * @param {number} max
     * @param {number} [current] — если не указан, равен max
     */
    addSlotLevel: function (level, max, current) {
        if (state.spellSlots.some(function (s) { return s.level === level; })) {
            return false; // уже есть
        }
        state.spellSlots.push({
            level: level,
            max: max,
            current: (current !== undefined) ? current : max
        });
        state.spellSlots.sort(function (a, b) { return a.level - b.level; });
        return true;
    },

    // ========== БОНУС АТАКИ ЗАКЛИНАНИЕМ ==========

    /**
     * Рассчитать бонус атаки заклинанием.
     * @param {string} attr — 'int', 'wis', 'cha'
     * @param {boolean} proficient — есть ли владение
     * @returns {number}
     */
    getAttackBonus: function (attr, proficient) {
        var attrMod = typeof AbilityScores !== 'undefined'
            ? AbilityScores.modifier(attr)
            : Math.floor(((state.stats[attr] || 10) - 10) / 2);

        var profBonus = state.profBonus || 2;
        return attrMod + (proficient ? profBonus : 0);
    },

    // ========== ХЕЛПЕРЫ ==========

    /**
     * Проверить, является ли класс кастером.
     * @param {string} className
     * @returns {boolean}
     */
    isSpellcaster: function (className) {
        var casters = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard', 'warlock', 'paladin', 'ranger'];
        return casters.indexOf(className) !== -1;
    }
};
