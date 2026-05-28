// ============ РЕЕСТР КЛАССОВЫХ РЕСУРСОВ (12 КЛАССОВ) ============
// Зависит от: ничего (чистые данные)
//
// ЕДИНСТВЕННОЕ место, где описана логика расчёта максимума
// ресурса для каждого класса. class-resources.js больше
// не содержит ни одного if/else по имени класса.
//
// Каждая запись:
//   name        — отображаемое название
//   calcMax(lvl)— функция: уровень класса → максимальное значение (может быть Infinity)
//   initValue   — начальный current/max для нового персонажа

const ClassResourceRegistry = {
    barbarian: {
        name: "Ярость",
        calcMax: function (level) {
            if (level >= 20) return Infinity;
            if (level >= 17) return 6;
            if (level >= 12) return 5;
            if (level >= 6)  return 4;
            if (level >= 3)  return 3;
            return 2;
        },
        initValue: 2
    },

    bard: {
        name: "Вдохновение барда",
        calcMax: function (level) {
            if (level >= 5) return 3;
            if (level >= 1) return 1;
            return 0;
        },
        initValue: 0
    },

    cleric: {
        name: "Божественный канал",
        calcMax: function (level) {
            return (level >= 6) ? 2 : 1;
        },
        initValue: 1
    },

    druid: {
        name: "Дикая форма",
        calcMax: function (level) {
            if (level >= 18) return Infinity;  // L18 и L20 = ∞
            if (level >= 2)  return 2;
            return 0;
        },
        initValue: 0
    },

    fighter: {
        name: "Всплеск действий",
        calcMax: function (level) {
            return (level >= 17) ? 2 : 1;
        },
        initValue: 1
    },

    monk: {
        name: "Очки Ци",
        calcMax: function (level) {
            return level;  // очки ци = уровень монаха
        },
        initValue: 0
    },

    paladin: {
        name: "Божественная кара",
        calcMax: function (level) {
            if (level >= 18) return Infinity;
            if (level >= 6)  return 2;
            if (level >= 2)  return 1;
            return 0;
        },
        initValue: 0
    },

    ranger: {
        name: "Метка охотника",
        calcMax: function (level) {
            return (level >= 1) ? 1 : 0;
        },
        initValue: 0
    },

    rogue: {
        name: "Скрытая атака",
        calcMax: function (level) {
            return (level >= 1) ? 1 : 0;
        },
        initValue: 0
    },

    sorcerer: {
        name: "Очки чародейства",
        calcMax: function (level) {
            return level;
        },
        initValue: 0
    },

    warlock: {
        name: "Ячейки заклинаний",
        calcMax: function (level) {
            return 0;  // Колдун использует отдельную систему слотов
        },
        initValue: 0
    },

    wizard: {
        name: "Восстановление заклинаний",
        calcMax: function (level) {
            return (level >= 1) ? 1 : 0;
        },
        initValue: 0
    }
};

// ========== ХЕЛПЕРЫ ==========

/**
 * Получить данные ресурса для класса.
 * @param {string} className — ключ класса (barbarian, wizard, ...)
 * @returns {Object|null}
 */
function getClassResourceConfig(className) {
    return ClassResourceRegistry[className] || null;
}

/**
 * Получить уровень класса из state.multClasses.
 * @param {string} className
 * @returns {number}
 */
function getClassLevel(className) {
    var cls = state.multClasses.find(function (c) { return c.className === className; });
    return cls ? cls.level : 0;
}

/**
 * Рассчитать максимальное значение ресурса для класса.
 * @param {string} className
 * @returns {{ max: number, config: Object }}
 */
function calcClassResourceMax(className) {
    var config = getClassResourceConfig(className);
    if (!config) return { max: 0, config: null };

    var level = getClassLevel(className);
    return {
        max: config.calcMax(level),
        config: config
    };
}

/**
 * Сбросить все классовые ресурсы к начальным значениям.
 * Используется при создании нового персонажа.
 */
function resetAllClassResources() {
    Object.keys(ClassResourceRegistry).forEach(function (key) {
        var config = ClassResourceRegistry[key];
        state.classResources[key] = {
            name: config.name,
            current: config.initValue,
            max: config.initValue
        };
    });
}
