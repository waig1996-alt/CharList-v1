// ============ ПРОГРЕССИЯ КЛАССОВ (D&D 5e) — СЕРВЕРНЫЙ МОДУЛЬ ============
// Единый источник истины для таблиц ячеек заклинаний и классовых ресурсов.
// Клиентский spell-slots-tables.js и class-resource-registry.js — копии/кэш.

// ========== ГРУППЫ КАСТЕРОВ ==========

const SPELLCASTER_GROUPS = {
    FULL_CASTER:  { classes: ['bard', 'cleric', 'druid', 'sorcerer', 'wizard'], label: 'Полный кастер' },
    HALF_CASTER:  { classes: ['paladin', 'ranger', 'artificer'], label: 'Полукастер' },
    WARLOCK:      { classes: ['warlock'], label: 'Колдун (пакт)' }
};

const ALL_CASTER_CLASSES = ['bard', 'cleric', 'druid', 'sorcerer', 'wizard', 'paladin', 'ranger', 'artificer', 'warlock'];

// ========== ТАБЛИЦЫ ЯЧЕЕК ЗАКЛИНАНИЙ (уровень персонажа → массив {level, max}) ==========

const FULL_CASTER_SLOTS = {
    1:  [{ level: 1, max: 2 }],
    2:  [{ level: 1, max: 3 }],
    3:  [{ level: 1, max: 4 }, { level: 2, max: 2 }],
    4:  [{ level: 1, max: 4 }, { level: 2, max: 3 }],
    5:  [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 2 }],
    6:  [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }],
    7:  [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 1 }],
    8:  [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 2 }],
    9:  [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 1 }],
    10: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }],
    11: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }],
    12: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }],
    13: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }, { level: 7, max: 1 }],
    14: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }, { level: 7, max: 1 }],
    15: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }, { level: 7, max: 1 }, { level: 8, max: 1 }],
    16: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }, { level: 7, max: 1 }, { level: 8, max: 1 }],
    17: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }, { level: 6, max: 1 }, { level: 7, max: 1 }, { level: 8, max: 1 }, { level: 9, max: 1 }],
    18: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 3 }, { level: 6, max: 1 }, { level: 7, max: 1 }, { level: 8, max: 1 }, { level: 9, max: 1 }],
    19: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 3 }, { level: 6, max: 2 }, { level: 7, max: 1 }, { level: 8, max: 1 }, { level: 9, max: 1 }],
    20: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 3 }, { level: 6, max: 2 }, { level: 7, max: 2 }, { level: 8, max: 1 }, { level: 9, max: 1 }]
};

const HALF_CASTER_SLOTS = {
    1:  [],
    2:  [{ level: 1, max: 2 }],
    3:  [{ level: 1, max: 3 }],
    4:  [{ level: 1, max: 3 }],
    5:  [{ level: 1, max: 4 }, { level: 2, max: 2 }],
    6:  [{ level: 1, max: 4 }, { level: 2, max: 2 }],
    7:  [{ level: 1, max: 4 }, { level: 2, max: 3 }],
    8:  [{ level: 1, max: 4 }, { level: 2, max: 3 }],
    9:  [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 2 }],
    10: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 2 }],
    11: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }],
    12: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }],
    13: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 1 }],
    14: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 1 }],
    15: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 2 }],
    16: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 2 }],
    17: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 1 }],
    18: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 1 }],
    19: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }],
    20: [{ level: 1, max: 4 }, { level: 2, max: 3 }, { level: 3, max: 3 }, { level: 4, max: 3 }, { level: 5, max: 2 }]
};

const WARLOCK_SLOTS = {
    1:  [{ level: 1, max: 1 }],
    2:  [{ level: 1, max: 2 }],
    3:  [{ level: 1, max: 2 }],
    4:  [{ level: 1, max: 3 }],
    5:  [{ level: 1, max: 3 }],
    6:  [{ level: 1, max: 3 }],
    7:  [{ level: 1, max: 4 }],
    8:  [{ level: 1, max: 4 }],
    9:  [{ level: 1, max: 4 }],
    10: [{ level: 1, max: 5 }],
    11: [{ level: 1, max: 5 }],
    12: [{ level: 1, max: 5 }],
    13: [{ level: 1, max: 5 }],
    14: [{ level: 1, max: 5 }],
    15: [{ level: 1, max: 5 }],
    16: [{ level: 1, max: 5 }],
    17: [{ level: 1, max: 5 }],
    18: [{ level: 1, max: 5 }],
    19: [{ level: 1, max: 5 }],
    20: [{ level: 1, max: 5 }]
};

// ========== УРОВНИ КАНТРИПОВ (сколько заговоров знает класс) ==========

const CANTRIPS_KNOWN = {
    bard:     { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 },
    cleric:   { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5 },
    druid:    { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 },
    sorcerer: { 1: 4, 2: 4, 3: 4, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5, 10: 6, 11: 6, 12: 6, 13: 6, 14: 6, 15: 6, 16: 6, 17: 6, 18: 6, 19: 6, 20: 6 },
    warlock:  { 1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4 },
    wizard:   { 1: 3, 2: 3, 3: 3, 4: 4, 5: 4, 6: 4, 7: 4, 8: 4, 9: 4, 10: 5, 11: 5, 12: 5, 13: 5, 14: 5, 15: 5, 16: 5, 17: 5, 18: 5, 19: 5, 20: 5 }
};

// ========== КЛАССОВЫЕ РЕСУРСЫ (calcMax) ==========

const CLASS_RESOURCE_MAX = {
    barbarian: function (level) {
        if (level >= 20) return Infinity;
        if (level >= 17) return 6;
        if (level >= 12) return 5;
        if (level >= 6)  return 4;
        if (level >= 3)  return 3;
        return 2;
    },
    bard: function (level) {
        if (level >= 5) return 3;
        if (level >= 1) return 1;
        return 0;
    },
    cleric: function (level) { return (level >= 6) ? 2 : 1; },
    druid: function (level) {
        if (level >= 18) return Infinity;
        if (level >= 2)  return 2;
        return 0;
    },
    fighter: function (level) { return (level >= 17) ? 2 : 1; },
    monk: function (level) { return level; },
    paladin: function (level) {
        if (level >= 18) return Infinity;
        if (level >= 6)  return 2;
        if (level >= 2)  return 1;
        return 0;
    },
    ranger: function (level) { return (level >= 1) ? 1 : 0; },
    rogue: function (level) { return (level >= 1) ? 1 : 0; },
    sorcerer: function (level) { return level; },
    warlock: function (level) { return 0; },
    wizard: function (level) { return (level >= 1) ? 1 : 0; }
};

// ========== ИМЕНА РЕСУРСОВ ==========

const CLASS_RESOURCE_NAMES = {
    barbarian: 'Ярость',
    bard: 'Вдохновение барда',
    cleric: 'Божественный канал',
    druid: 'Дикая форма',
    fighter: 'Всплеск действий',
    monk: 'Очки Ци',
    paladin: 'Божественная кара',
    ranger: 'Метка охотника',
    rogue: 'Скрытая атака',
    sorcerer: 'Очки чародейства',
    warlock: 'Ячейки заклинаний',
    wizard: 'Восстановление заклинаний'
};

// ========== ХЕЛПЕРЫ ==========

/**
 * Определить группу кастера.
 */
function getCasterGroup(className) {
    for (var key in SPELLCASTER_GROUPS) {
        if (SPELLCASTER_GROUPS[key].classes.indexOf(className) !== -1) {
            return key;
        }
    }
    return null;
}

/**
 * Проверить, может ли класс кастовать заклинания.
 */
function isSpellcasterClass(className) {
    return ALL_CASTER_CLASSES.indexOf(className) !== -1;
}

/**
 * Получить таблицу ячеек для класса.
 */
function getSlotTable(className) {
    var group = getCasterGroup(className);
    if (group === 'FULL_CASTER') return FULL_CASTER_SLOTS;
    if (group === 'HALF_CASTER') return HALF_CASTER_SLOTS;
    if (group === 'WARLOCK')    return WARLOCK_SLOTS;
    return null;
}

/**
 * Получить ячейки заклинаний для класса на заданном уровне.
 * @returns {Array<{level, max}>}
 */
function getSpellSlots(className, level) {
    var table = getSlotTable(className);
    if (!table) return [];
    var slots = table[level] || table[20] || [];
    // Копируем и добавляем current=max
    return slots.map(function (s) { return { level: s.level, max: s.max, current: s.max }; });
}

/**
 * Получить уровень слота колдуна (warlock pact magic level).
 */
function getWarlockSlotLevel(level) {
    if (level >= 17) return 5;
    if (level >= 15) return 5;
    if (level >= 11) return 5;
    if (level >= 9)  return 5;
    if (level >= 7)  return 4;
    if (level >= 5)  return 3;
    if (level >= 3)  return 2;
    return 1;
}

/**
 * Объединить ячейки для мультикласса.
 */
function mergeMulticlassSlots(classList) {
    var slotsMap = {};
    classList.forEach(function (mc) {
        var slots = getSpellSlots(mc.className, mc.level);
        slots.forEach(function (slot) {
            if (!slotsMap[slot.level]) {
                slotsMap[slot.level] = { level: slot.level, max: 0, current: 0 };
            }
            slotsMap[slot.level].max += slot.max;
            slotsMap[slot.level].current += slot.max;
        });
    });
    return Object.values(slotsMap).sort(function (a, b) { return a.level - b.level; });
}

/**
 * Получить ПОЛНУЮ прогрессию класса на заданном уровне.
 * @returns {{ className, level, casterGroup, spellSlots, cantripsKnown, resourceMax, resourceName }}
 */
function getClassProgression(className, level) {
    level = Math.max(1, Math.min(20, parseInt(level) || 1));
    var group = getCasterGroup(className);

    var result = {
        className: className,
        level: level,
        casterGroup: group,
        isSpellcaster: group !== null,
        spellSlots: getSpellSlots(className, level),
        proficiencyBonus: level <= 4 ? 2 : (level <= 8 ? 3 : (level <= 12 ? 4 : (level <= 16 ? 5 : 6)))
    };

    // Кантрипы (только для полных кастеров и warlock)
    if (CANTRIPS_KNOWN[className]) {
        result.cantripsKnown = CANTRIPS_KNOWN[className][level] || 0;
    }

    // Классовый ресурс
    if (CLASS_RESOURCE_MAX[className]) {
        var maxVal = CLASS_RESOURCE_MAX[className](level);
        result.resourceName = CLASS_RESOURCE_NAMES[className] || '';
        result.resourceMax = maxVal;
        result.resourceIsInfinite = (maxVal === Infinity);
    }

    // Warlock: уровень пакта
    if (className === 'warlock') {
        result.pactSlotLevel = getWarlockSlotLevel(level);
    }

    return result;
}

module.exports = {
    FULL_CASTER_SLOTS,
    HALF_CASTER_SLOTS,
    WARLOCK_SLOTS,
    CANTRIPS_KNOWN,
    CLASS_RESOURCE_MAX,
    CLASS_RESOURCE_NAMES,
    getCasterGroup,
    isSpellcasterClass,
    getSpellSlots,
    getWarlockSlotLevel,
    mergeMulticlassSlots,
    getClassProgression
};
