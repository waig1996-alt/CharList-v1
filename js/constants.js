// ============ КОНСТАНТЫ И СПРАВОЧНИКИ ============
// Все константы глобальные — доступны во всех модулях

// Список классов для селектов
const classOptionsList = [
    { value: "barbarian", name: "Варвар" },
    { value: "bard", name: "Бард" },
    { value: "cleric", name: "Жрец" },
    { value: "druid", name: "Друид" },
    { value: "fighter", name: "Воин" },
    { value: "monk", name: "Монах" },
    { value: "paladin", name: "Паладин" },
    { value: "ranger", name: "Следопыт" },
    { value: "rogue", name: "Плут" },
    { value: "sorcerer", name: "Чародей" },
    { value: "warlock", name: "Колдун" },
    { value: "wizard", name: "Волшебник" }
];

// Имена классов на русском
const classNames = {
    barbarian: "Варвар", bard: "Бард", cleric: "Жрец", druid: "Друид",
    fighter: "Воин", monk: "Монах", paladin: "Паладин", ranger: "Следопыт",
    rogue: "Плут", sorcerer: "Чародей", warlock: "Колдун", wizard: "Волшебник"
};

// Кости хитов по классам
const hitDiceMap = {
    barbarian: 12, fighter: 10, paladin: 10, ranger: 10,
    bard: 8, cleric: 8, druid: 8, monk: 8, rogue: 8, warlock: 8,
    sorcerer: 6, wizard: 6
};

function getHitDiceByClass(className) {
    return hitDiceMap[className] || 8;
}

// ============ СПАСБРОСКИ ============
const saveNames = {
    str: "Сила", dex: "Ловкость", con: "Телосложение",
    int: "Интеллект", wis: "Мудрость", cha: "Харизма"
};

// Классовые спасброски
const classSaves = {
    barbarian: ["str", "con"], bard: ["dex", "cha"], cleric: ["wis", "cha"],
    druid: ["int", "wis"], fighter: ["str", "con"], monk: ["str", "dex"],
    paladin: ["wis", "cha"], ranger: ["str", "dex"], rogue: ["dex", "int"],
    sorcerer: ["con", "cha"], warlock: ["wis", "cha"], wizard: ["int", "wis"]
};

// ============ НАВЫКИ ============
const defaultSkills = [
    "Акробатика", "Анализ", "Аркана", "Атлетика", "Выживание",
    "Выступление", "Запугивание", "История", "Ловкость рук", "Магия",
    "Медицина", "Обман", "Природа", "Проницательность", "Религия",
    "Скрытность", "Убеждение", "Восприятие"
];

const attrMap = {
    "Акробатика": "dex", "Анализ": "int", "Аркана": "int", "Атлетика": "str",
    "Выживание": "wis", "Выступление": "cha", "Запугивание": "cha", "История": "int",
    "Ловкость рук": "dex", "Магия": "int", "Медицина": "wis", "Обман": "cha",
    "Природа": "int", "Проницательность": "wis", "Религия": "int", "Скрытность": "dex",
    "Убеждение": "cha", "Восприятие": "wis"
};

// ============ АТРИБУТЫ ============
const attrDisplayNames = {
    str: "Сила", dex: "Ловкость", con: "Телосложение",
    int: "Интеллект", wis: "Мудрость", cha: "Харизма"
};

const allStats = ["str", "dex", "con", "int", "wis", "cha"];

// ============ СТАНДАРТНЫЕ ХАРАКТЕРИСТИКИ ПО КЛАССАМ (Standard Array: 15,14,13,12,10,8) ============
// Распределены по приоритетам D&D 5e для каждого класса.
// После применения расовых бонусов дают стандартные значения для 1 уровня.

const classDefaultStats = {
    barbarian: { str: 15, con: 14, dex: 13, wis: 12, cha: 10, int: 8 },
    bard:      { cha: 15, dex: 14, con: 13, wis: 12, int: 10, str: 8 },
    cleric:    { wis: 15, con: 14, str: 13, cha: 12, dex: 10, int: 8 },
    druid:     { wis: 15, con: 14, dex: 13, int: 12, cha: 10, str: 8 },
    fighter:   { str: 15, con: 14, dex: 13, wis: 12, cha: 10, int: 8 },
    monk:      { dex: 15, wis: 14, con: 13, str: 12, cha: 10, int: 8 },
    paladin:   { str: 15, cha: 14, con: 13, wis: 12, dex: 10, int: 8 },
    ranger:    { dex: 15, wis: 14, con: 13, str: 12, cha: 10, int: 8 },
    rogue:     { dex: 15, con: 14, wis: 13, cha: 12, int: 10, str: 8 },
    sorcerer:  { cha: 15, con: 14, dex: 13, wis: 12, int: 10, str: 8 },
    warlock:   { cha: 15, con: 14, dex: 13, wis: 12, int: 10, str: 8 },
    wizard:    { int: 15, con: 14, dex: 13, wis: 12, cha: 10, str: 8 }
};
