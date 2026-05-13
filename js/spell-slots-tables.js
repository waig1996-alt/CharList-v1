// ============ ТАБЛИЦЫ ЯЧЕЕК ЗАКЛИНАНИЙ ============
// Определяет количество ячеек заклинаний по классам и уровню персонажа

// Группы классов для определения таблицы ячеек
const SPELLCASTER_GROUPS = {
    FULL_CASTER: {
        classes: ["bard", "cleric", "druid", "sorcerer", "wizard"],
        name: "Магические"
    },
    HALF_CASTER: {
        classes: ["paladin", "ranger", "artificer"], // artificer добавлен
        name: "Полумаги"
    }
};

// Таблица для полных кастеров (уровень персонажа -> ячейки)
// Формат: "уровень/количество" (уровень заклинания / количество ячеек)
const FULL_CASTER_SLOTS = {
    1: "1/2",
    2: "1/3",
    3: "1/4,2/2",
    4: "1/4,2/3",
    5: "1/4,2/3,3/2",
    6: "1/4,2/3,3/3",
    7: "1/4,2/3,3/3,4/1",
    8: "1/4,2/3,3/3,4/2",
    9: "1/4,2/3,3/3,4/3,5/1",
    10: "1/4,2/3,3/3,4/3,5/2",
    11: "1/4,2/3,3/3,4/3,5/2,6/1",
    12: "1/4,2/3,3/3,4/3,5/2,6/1",
    13: "1/4,2/3,3/3,4/3,5/2,6/1,7/1",
    14: "1/4,2/3,3/3,4/3,5/2,6/1,7/1",
    15: "1/4,2/3,3/3,4/3,5/2,6/1,7/1,8/1",
    16: "1/4,2/3,3/3,4/3,5/2,6/1,7/1,8/1",
    17: "1/4,2/3,3/3,4/3,5/2,6/1,7/1,8/1,9/1",
    18: "1/4,2/3,3/3,4/3,5/3,6/1,7/1,8/1,9/1",
    19: "1/4,2/3,3/3,4/3,5/3,6/2,7/1,8/1,9/1",
    20: "1/4,2/3,3/3,4/3,5/3,6/2,7/2,8/1,9/1"
};

// Таблица для полукастеров (уровень персонажа -> ячейки)
const HALF_CASTER_SLOTS = {
    1: "",
    2: "1/2",
    3: "1/3",
    4: "1/3",
    5: "1/4,2/2",
    6: "1/4,2/2",
    7: "1/4,2/3",
    8: "1/4,2/3",
    9: "1/4,2/3,3/2",
    10: "1/4,2/3,3/2",
    11: "1/4,2/3,3/3",
    12: "1/4,2/3,3/3",
    13: "1/4,2/3,3/3,4/1",
    14: "1/4,2/3,3/3,4/1",
    15: "1/4,2/3,3/3,4/2",
    16: "1/4,2/3,3/3,4/2",
    17: "1/4,2/3,3/3,4/3,5/1",
    18: "1/4,2/3,3/3,4/3,5/1",
    19: "1/4,2/3,3/3,4/3,5/2",
    20: "1/4,2/3,3/3,4/3,5/2"
};

// Специальные кастеры (вычисляются по-другому)
const SPECIAL_CASTERS = ["monk", "warlock"];

// Воин-колдун (warlock) использует пакт ячейки
const WARLOCK_SLOTS = {
    1: "1/1",
    2: "1/2",
    3: "1/2",
    4: "1/3",
    5: "1/3",
    6: "1/3",
    7: "1/4",
    8: "1/4",
    9: "1/4",
    10: "1/5",
    11: "1/5",
    12: "1/5",
    13: "1/5",
    14: "1/5",
    15: "1/5",
    16: "1/5",
    17: "1/5",
    18: "1/5",
    19: "1/5",
    20: "1/5"
};

/**
 * Получить таблицу ячеек для класса
 * @param {string} className - название класса
 * @returns {object} - таблица {уровень -> "уровень/кол-во,..."}
 */
function getSpellSlotsTable(className) {
    if (SPELLCASTER_GROUPS.FULL_CASTER.classes.includes(className)) {
        return FULL_CASTER_SLOTS;
    }
    if (SPELLCASTER_GROUPS.HALF_CASTER.classes.includes(className)) {
        return HALF_CASTER_SLOTS;
    }
    if (className === "warlock") {
        return WARLOCK_SLOTS;
    }
    return null; // Не кастер
}

/**
 * Получить группу кастера (для UI)
 * @param {string} className - название класса
 * @returns {string} - "FULL_CASTER", "HALF_CASTER", "SPECIAL", или null
 */
function getSpellcasterGroup(className) {
    if (SPELLCASTER_GROUPS.FULL_CASTER.classes.includes(className)) {
        return "FULL_CASTER";
    }
    if (SPELLCASTER_GROUPS.HALF_CASTER.classes.includes(className)) {
        return "HALF_CASTER";
    }
    if (SPECIAL_CASTERS.includes(className)) {
        return "SPECIAL";
    }
    return null;
}

/**
 * Парсить строку ячеек и вернуть массив объектов
 * @param {string} slotsStr - строка вида "1/4,2/3,3/2"
 * @returns {array} - [{level: 1, max: 4, current: 4}, ...]
 */
function parseSpellSlots(slotsStr) {
    if (!slotsStr || slotsStr.trim() === "") return [];
    
    return slotsStr.split(',').map(slot => {
        const [level, max] = slot.trim().split('/').map(Number);
        return {
            level: level,
            max: max,
            current: max
        };
    });
}

/**
 * Получить ячейки для класса и уровня
 * @param {string} className - название класса
 * @param {number} level - уровень персонажа
 * @returns {array} - массив ячеек
 */
function getSpellSlotsForClass(className, level) {
    const table = getSpellSlotsTable(className);
    if (!table) return [];
    
    const slotsStr = table[level] || table[20] || "";
    return parseSpellSlots(slotsStr);
}

/**
 * Проверить, может ли класс использовать заклинания
 * @param {string} className - название класса
 * @returns {boolean}
 */
function isSpellcaster(className) {
    return getSpellcasterGroup(className) !== null;
}

/**
 * Объединить ячейки от нескольких классов (для мультикласса)
 * @param {array} classes - [{className: "bard", level: 3}, ...]
 * @returns {array} - объединённые ячейки
 */
function mergeMulticlassSlots(classes) {
    const slotsMap = {}; // level -> sum
    
    classes.forEach(mc => {
        const slots = getSpellSlotsForClass(mc.className, mc.level);
        slots.forEach(slot => {
            if (!slotsMap[slot.level]) {
                slotsMap[slot.level] = { level: slot.level, max: 0, current: 0 };
            }
            slotsMap[slot.level].max += slot.max;
            slotsMap[slot.level].current += slot.current;
        });
    });
    
    return Object.values(slotsMap).sort((a, b) => a.level - b.level);
}
