// ============ ГЛОБАЛЬНОЕ СОСТОЯНИЕ ============
// Все переменные глобальные — доступны во всех модулях

const state = {
    spells: [],
    spellSlots: [],
    pinnedSpells: [],
    attacks: [],
    inventoryItems: [],
    features: [],
    customSkills: [],
    notes: [],
    currentHp: 27,
    maxHp: 27,
    baseMaxHp: 27,
    hpHistory: [],
    manualHpEnabled: false,
    deathSuccess: 0,
    deathFail: 0,
    tempHp: 0,
    profBonus: 2,
    multClasses: [{ className: "fighter", level: 1, hitDice: 8 }],
    primaryClass: "fighter",
    skillExtraBonuses: {},
    extraSaveBonuses: {},
    charName: "",
    charRace: "",
    appliedRaceBoosts: null,
    selectedRaceTraits: [],
    serverCharacterId: null,  // ID персонажа на сервере (null = только локально)
    stats: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    money: { pp: 0, gp: 0, sp: 0, cp: 0 },
    rollHistory: [],
    // Классовые ресурсы для 12 классов
    classResources: {
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
    }
};

// ============ ВЕРСИЯ ПРОЕКТА ============
const APP_VERSION = "1.0.8.4";
const STORAGE_VERSION_KEY = "dnd_sheet_version";
const STORAGE_DATA_KEY = "dnd_master_sheet_full";
