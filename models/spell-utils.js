// ============ УТИЛИТЫ ЗАКЛИНАНИЙ (СЕРВЕР) ============
// Локализация, маппинг «заклинание → классы», фильтрация.
// Убирает eval() с клиента — вся логика теперь на сервере.

const fs = require('fs');
const path = require('path');

// ========== ЛОКАЛИЗАЦИЯ ==========

/**
 * Извлечь локализованные данные из jsonData заклинания.
 * @param {Object} spell — строка БД Spell (с .jsonData, .name, .level, .school)
 * @param {string} lang   — 'ru' или 'en'
 * @returns {Object} — { name, description, level, school, castTime, action, attr, damage, range, components, duration, source, classes }
 */
function localizeSpell(spell, lang) {
    lang = lang || 'ru';

    let jsonData = {};
    try {
        jsonData = typeof spell.jsonData === 'string'
            ? JSON.parse(spell.jsonData)
            : (spell.jsonData || {});
    } catch (e) {
        console.warn('localizeSpell: ошибка парсинга jsonData для', spell.name, e);
    }

    const localized = (jsonData[lang] && typeof jsonData[lang] === 'object') ? jsonData[lang] : {};
    const fallback = jsonData[lang === 'ru' ? 'en' : 'ru'] || {};

    const result = {
        id: spell.id,
        dbName: spell.name,
        name: localized.name || fallback.name || spell.name || '',
        description: localized.text || localized.description ||
                     fallback.text || fallback.description || spell.description || '',
        level: Number(localized.level ?? fallback.level ?? spell.level) || 0,
        school: localized.school || fallback.school || spell.school || '',
        castTime: localized.castingTime || localized.duration || spell.castTime || '1 действие',
        action: localized.action || spell.action || 'action',
        attr: localized.spellAttribute || spell.attr || 'wis',
        damage: localized.damage || spell.damage || null,
        range: localized.range || fallback.range || '',
        components: localized.components || fallback.components || '',
        duration: localized.duration || fallback.duration || '',
        source: localized.source || fallback.source || '',
        classes: getSpellClasses(spell.name, lang)
    };

    return result;
}

/**
 * Локализовать массив заклинаний.
 * @param {Array} spells — строки БД
 * @param {string} lang
 * @returns {Array}
 */
function localizeSpells(spells, lang) {
    return spells.map(function (spell) {
        return localizeSpell(spell, lang);
    });
}

// ========== МАППИНГ «ЗАКЛИНАНИЕ → КЛАССЫ» ==========

/** @type {Object<string, string[]>} — кэш: имя заклинания → [имена классов] */
var _classSpellMap = null;

/**
 * Загрузить ClassSpells.js и построить обратный маппинг.
 * Выполняется ОДИН раз при старте сервера.
 */
function buildClassSpellMap() {
    if (_classSpellMap) return _classSpellMap;

    _classSpellMap = {};

    try {
        var filePath = path.join(__dirname, '..', 'data', 'Spells_data', 'ClassSpells.js');
        var text = fs.readFileSync(filePath, 'utf-8');

        // Извлекаем объект classSpells из export const classSpells = { ... };
        // Простой подход: вырезаем всё между '{' и последней '}' перед ';'
        var startIdx = text.indexOf('{');
        var endIdx = text.lastIndexOf('}');
        if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
            console.warn('buildClassSpellMap: не удалось найти границы объекта в ClassSpells.js');
            return _classSpellMap;
        }

        var objectStr = text.substring(startIdx, endIdx + 1);

        // Парсим объект (серверный eval — контролируемый код, не клиентский ввод)
        var classSpells = eval('(' + objectStr + ')');

        // Строим обратный маппинг: заклинание → [классы]
        Object.keys(classSpells).forEach(function (className) {
            var classData = classSpells[className];
            if (classData.spells && Array.isArray(classData.spells)) {
                classData.spells.forEach(function (spellName) {
                    if (!_classSpellMap[spellName]) {
                        _classSpellMap[spellName] = [];
                    }
                    if (_classSpellMap[spellName].indexOf(className) === -1) {
                        _classSpellMap[spellName].push(className);
                    }
                });
            }
        });

        console.log('buildClassSpellMap: построен маппинг для ' +
            Object.keys(_classSpellMap).length + ' заклинаний, ' +
            Object.keys(classSpells).length + ' классов');
    } catch (e) {
        console.error('buildClassSpellMap: ошибка', e);
    }

    return _classSpellMap;
}

/**
 * Получить список классов для заклинания.
 * @param {string} spellName — английское имя заклинания
 * @param {string} [lang] — если 'ru', локализуем названия классов
 * @returns {string[]}
 */
function getSpellClasses(spellName, lang) {
    var map = buildClassSpellMap();
    var classes = map[spellName] || [];

    if (lang === 'ru') {
        var ruNames = {
            Bard: 'Бард', Cleric: 'Жрец', Druid: 'Друид',
            Paladin: 'Паладин', Ranger: 'Следопыт', Sorcerer: 'Чародей',
            Warlock: 'Колдун', Wizard: 'Волшебник',
            Artificer: 'Изобретатель', Barbarian: 'Варвар',
            Fighter: 'Воин', Monk: 'Монах', Rogue: 'Плут'
        };
        return classes.map(function (c) { return ruNames[c] || c; });
    }

    return classes;
}

/**
 * Получить английские имена классов для заклинания (для фильтрации).
 * @param {string} spellName
 * @returns {string[]}
 */
function getSpellClassesEn(spellName) {
    var map = buildClassSpellMap();
    return map[spellName] || [];
}

/**
 * Получить полный маппинг «заклинание → классы» для API.
 * @returns {Object<string, string[]>}
 */
function getFullClassMap() {
    return buildClassSpellMap();
}

/**
 * Получить список всех классов из маппинга.
 * @returns {string[]}
 */
function getAllClasses() {
    var map = buildClassSpellMap();
    var classSet = {};
    Object.keys(map).forEach(function (spell) {
        map[spell].forEach(function (cls) {
            classSet[cls] = true;
        });
    });
    return Object.keys(classSet).sort();
}

module.exports = {
    localizeSpell,
    localizeSpells,
    buildClassSpellMap,
    getSpellClasses,
    getSpellClassesEn,
    getFullClassMap,
    getAllClasses
};
