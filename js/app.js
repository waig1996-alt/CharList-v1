// ============ ГЛОБАЛЬНОЕ СОСТОЯНИЕ ============
const state = {
    spells: [],
    spellSlots: [],
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
    stats: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
    money: { pp: 0, gp: 0, sp: 0, cp: 0 },
    rollHistory: [],
    // Классовые ресурсы
    // Классовые ресурсы
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
},
};
// ============ ВЕРСИЯ ПРОЕКТА ============
const APP_VERSION = "1.0.3"; // МАЖОР.МИНОР.ПАТЧ
const STORAGE_VERSION_KEY = "dnd_sheet_version";
const STORAGE_DATA_KEY = "dnd_master_sheet_full";
// ============ УПРАВЛЕНИЕ ВЕРСИЯМИ ============
function checkAndMigrateVersion() {
    const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    const currentVersion = APP_VERSION;
    
    if (!savedVersion) {
        // Первый запуск — сохраняем текущую версию
        localStorage.setItem(STORAGE_VERSION_KEY, currentVersion);
        addToLog(`📌 Инициализирована версия ${currentVersion}`);
        return;
    }
    
    if (savedVersion !== currentVersion) {
        addToLog(`📌 Обновление с версии ${savedVersion} до ${currentVersion}`);
        
        // TODO: Здесь будут миграции для разных версий
        
        localStorage.setItem(STORAGE_VERSION_KEY, currentVersion);
        addToLog(`✅ Обновление завершено`);
    } else {
        addToLog(`📌 Текущая версия: ${currentVersion}`);
    }
}

// Функция показа модального окна выбора класса
function showClassSelectionModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('classSelectModal');
        const select = document.getElementById('initialClassSelect');
        const confirmBtn = document.getElementById('confirmClassBtn');
        
        modal.style.display = 'flex';
        
        const onConfirm = () => {
            const selectedClass = select.value;
            modal.style.display = 'none';
            confirmBtn.removeEventListener('click', onConfirm);
            resolve(selectedClass);
        };
        
        confirmBtn.addEventListener('click', onConfirm);
    });
}

// Функция инициализации нового персонажа
async function initNewCharacter() {
    const selectedClass = await showClassSelectionModal();
    state.primaryClass = selectedClass;

    let hitDice = getHitDiceByClass(selectedClass);
    state.multClasses = [{ className: selectedClass, level: 1, hitDice: hitDice }];

    // ============ ИНИЦИАЛИЗАЦИЯ КЛАССОВОГО РЕСУРСА ДЛЯ ВСЕХ КЛАССОВ ============
    // Сброс всех ресурсов
    const defaultResources = {
        barbarian: { current: 2, max: 2 },
        bard: { current: 0, max: 0 },
        cleric: { current: 1, max: 1 },
        druid: { current: 0, max: 0 },
        fighter: { current: 1, max: 1 },
        monk: { current: 0, max: 0 },
        paladin: { current: 0, max: 0 },
        ranger: { current: 0, max: 0 },
        rogue: { current: 0, max: 0 },
        sorcerer: { current: 0, max: 0 },
        warlock: { current: 0, max: 0 },
        wizard: { current: 0, max: 0 }
    };
    
    // Устанавливаем начальные значения для выбранного класса
    if (defaultResources[selectedClass]) {
        state.classResources[selectedClass].current = defaultResources[selectedClass].current;
        state.classResources[selectedClass].max = defaultResources[selectedClass].max;
    }
    // ============ КОНЕЦ ИНИЦИАЛИЗАЦИИ ============

    state.manualHpEnabled = true;
    document.getElementById('manualHpCheckbox').checked = true;
    document.getElementById('maxHpInput').disabled = false;

    function getHitDiceByClass(className) {
        const hitDiceMap = {
            barbarian: 12, fighter: 10, paladin: 10, ranger: 10,
            bard: 8, cleric: 8, druid: 8, monk: 8, rogue: 8, warlock: 8,
            sorcerer: 6, wizard: 6
        };
        return hitDiceMap[className] || 8;
    }

    let conMod = getMod('con');
    state.maxHp = hitDice + (conMod > 0 ? conMod : 0);
    state.currentHp = state.maxHp;
    state.hpHistory = [];

    renderMulticlass();
    renderSavingThrows();
    renderClassResource();
    updateUI();
    addToLog(`🎉 Создан персонаж класса ${classNames[selectedClass]}`);
    autoSave();
    const maxHpInput = document.getElementById('maxHpInput');
    if (maxHpInput) maxHpInput.value = state.maxHp;
} // <-- ЗАКРЫВАЮЩАЯ СКОБКА В КОНЦЕ!

function autoSave() {
    const saveData = {
        version: APP_VERSION,  // <-- ДОБАВИТЬ ЭТУ СТРОКУ
        primaryClass: state.primaryClass,
        spells: state.spells,
        spellSlots: state.spellSlots,
        attacks: state.attacks,
        inventoryItems: state.inventoryItems,
        features: state.features,
        customSkills: state.customSkills,
        notes: state.notes,
        multClasses: state.multClasses,
        skillExtraBonuses: state.skillExtraBonuses,
        extraSaveBonuses: state.extraSaveBonuses,
        currentHp: state.currentHp,
        maxHp: state.maxHp,
        deathSuccess: state.deathSuccess,
        deathFail: state.deathFail,
        tempHp: state.tempHp,
        profBonus: state.profBonus,
        charName: state.charName,
        charRace: state.charRace,
        stats: state.stats,
        money: state.money,
        classResources: state.classResources
    };
    localStorage.setItem('dnd_master_sheet_full', JSON.stringify(saveData));
}

function loadData() {
    let saved = localStorage.getItem('dnd_master_sheet_full');
    if (saved) {
        try {
            let d = JSON.parse(saved);
            state.spells = d.spells || [];
            state.spellSlots = d.spellSlots || [];
            state.attacks = d.attacks || [];
            state.inventoryItems = d.inventoryItems || [];
            state.features = d.features || [];
            state.customSkills = d.customSkills || [];
            state.notes = d.notes || [];
            state.multClasses = d.multClasses || [{ className: "fighter", level: 1, hitDice: 8 }];
            state.skillExtraBonuses = d.skillExtraBonuses || {};
            state.extraSaveBonuses = d.extraSaveBonuses || {};
            state.currentHp = d.currentHp || 27;
            state.maxHp = d.maxHp || 27;
            state.deathSuccess = d.deathSuccess || 0;
            state.deathFail = d.deathFail || 0;
            state.tempHp = d.tempHp || 0;
            state.profBonus = d.profBonus || 2;
            state.charName = d.charName || "";
            state.charRace = d.charRace || "";
            state.hpHistory = d.hpHistory || [];
            state.manualHpEnabled = d.manualHpEnabled || false;
            
            // ============ ПРАВИЛЬНАЯ ЗАГРУЗКА PRIMARY CLASS ============
            // Загружаем primaryClass из сохранения, без подстановки "fighter" по умолчанию
            if (d.primaryClass) {
                state.primaryClass = d.primaryClass;
            } else if (state.multClasses.length > 0) {
                state.primaryClass = state.multClasses[0].className;
            }
            // ============================================================
            
            // Загрузка классовых ресурсов
            if (d.classResources) {
                state.classResources = d.classResources;
            }
            
            if (d.stats) {
                state.stats = d.stats;
                document.getElementById('str').value = state.stats.str;
                document.getElementById('dex').value = state.stats.dex;
                document.getElementById('con').value = state.stats.con;
                document.getElementById('int').value = state.stats.int;
                document.getElementById('wis').value = state.stats.wis;
                document.getElementById('cha').value = state.stats.cha;
            }
            
            if (d.money) {
                state.money = d.money;
                document.getElementById('pp').value = state.money.pp;
                document.getElementById('gp').value = state.money.gp;
                document.getElementById('sp').value = state.money.sp;
                document.getElementById('cp').value = state.money.cp;
            } else {
                document.getElementById('pp').value = state.money.pp;
                document.getElementById('gp').value = state.money.gp;
                document.getElementById('sp').value = state.money.sp;
                document.getElementById('cp').value = state.money.cp;
            }
            
            document.getElementById('profBonus').value = state.profBonus;
            document.getElementById('tempHp').value = state.tempHp;
            document.getElementById('charName').value = state.charName;
            document.getElementById('charRace').value = state.charRace;
            
            // ============ ВРЕМЕННОЕ РЕШЕНИЕ: принудительно включаем ручное редактирование ХП ============
            state.manualHpEnabled = true;
            document.getElementById('manualHpCheckbox').checked = true;
            document.getElementById('manualHpCheckbox').disabled = true;
            document.getElementById('maxHpInput').disabled = false;
            document.getElementById('maxHpInput').value = state.maxHp;
            // =======================================================================================
            
            updateExhaustionEffects();
            updateSpeedDisplay();
            updateMaxHp();
            renderMulticlass();
            renderSavingThrows();
            renderSkills();
            renderInventory();
            renderSpells();
            renderSlots();
            renderAttacks();
            renderFeatures();
            renderNotes();
            renderClassResource();
            updateUI();
            
            renderSavingThrows();
            addToLog(`📀 Загружено сохранение`);
        } catch (e) { console.error(e); }
    }
}
function addToLog(msg, style) {
    const log = document.getElementById('logArea');
    if (log) {
        const p = document.createElement('div');
        if (style) {
            p.style.cssText = style;
        }
        p.textContent = msg;
        log.appendChild(p);
        log.scrollTop = log.scrollHeight;
        while (log.children.length > 80) log.removeChild(log.firstChild);
    }
    autoSave();
}

function updateUI() {
    let effective = state.currentHp + state.tempHp;
    const currentHpEl = document.getElementById('currentHp');
    if (currentHpEl) currentHpEl.innerHTML = `${effective}<span style="font-size:0.7rem;">(+${state.tempHp} вр.)</span>`;
    const maxHpEl = document.getElementById('maxHp');
    if (maxHpEl) maxHpEl.innerText = state.maxHp;

    const deathSuccessEl = document.getElementById('deathSuccess');
    if (deathSuccessEl) deathSuccessEl.innerText = state.deathSuccess;

    const deathFailEl = document.getElementById('deathFail');
    if (deathFailEl) deathFailEl.innerText = state.deathFail;

    const acValueEl = document.getElementById('acValue');
    const acInputEl = document.getElementById('acInput');
    if (acValueEl && acInputEl) acValueEl.innerText = acInputEl.value;

    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(stat => {
        const inputEl = document.getElementById(stat);
        const spanEl = document.getElementById(stat + 'Mod');
        if (inputEl && spanEl) {
            let val = parseInt(inputEl.value) || 10;
            let mod = Math.floor((val - 10) / 2);
            spanEl.innerText = (mod >= 0 ? '+' : '') + mod;
        }
    });
}


// ============ МУЛЬТИКЛАССЫ ============
const classOptionsList = [
    { value: "barbarian", name: "Варвар" }, { value: "bard", name: "Бард" },
    { value: "cleric", name: "Жрец" }, { value: "druid", name: "Друид" },
    { value: "fighter", name: "Воин" }, { value: "monk", name: "Монах" },
    { value: "paladin", name: "Паладин" }, { value: "ranger", name: "Следопыт" },
    { value: "rogue", name: "Плут" }, { value: "sorcerer", name: "Чародей" },
    { value: "warlock", name: "Колдун" }, { value: "wizard", name: "Волшебник" }
];
const classNames = {
    barbarian: "Варвар", bard: "Бард", cleric: "Жрец", druid: "Друид",
    fighter: "Воин", monk: "Монах", paladin: "Паладин", ranger: "Следопыт",
    rogue: "Плут", sorcerer: "Чародей", warlock: "Колдун", wizard: "Волшебник"
};

function recalcTotalLevel() {
    let total = state.multClasses.reduce((sum, cls) => sum + cls.level, 0);
    document.getElementById('totalLevel').innerText = total;
    return total;
}

function calculateRawMaxHp() {
    let conMod = getMod('con');
    let total = 0;
    let levelCount = 0;
    for (let cls of state.multClasses) {
        levelCount += cls.level;
    }
    if (state.multClasses.length > 0 && state.multClasses[0].level > 0) {
        total = state.multClasses[0].hitDice + conMod;
    }
    for (let gain of state.hpHistory) {
        total += gain.gained;
    }
    if (levelCount > 1) {
        total += conMod * (levelCount - 1);
    }
    return Math.max(1, total);
}

function updateMaxHp() {
    let exhaustionVal = parseInt(document.getElementById('exhaustion')?.value) || 0;
    let raw = calculateRawMaxHp();
    let newMaxHp;
    if (exhaustionVal >= 4) {
        newMaxHp = Math.max(1, Math.floor(raw / 2));
    } else {
        newMaxHp = raw;
    }

    // Временное решение: не меняем maxHp автоматически если ручной режим включён
    if (state.maxHp !== newMaxHp && !state.manualHpEnabled) {
        let oldMax = state.maxHp;
        state.maxHp = newMaxHp;
        if (state.currentHp > state.maxHp) state.currentHp = state.maxHp;
        const logMsg = `📊 Максимальные хиты изменены (истощение): ${oldMax} → ${state.maxHp}`;
        if (typeof addToLog === 'function') addToLog(logMsg);
    }
    updateUI();
}

function updateSpeedDisplay() {
    let exhaustion = parseInt(document.getElementById('exhaustion')?.value) || 0;
    let base = parseInt(document.getElementById('baseSpeed')?.value) || 30;
    let finalSpeed = base;
    if (exhaustion >= 2) finalSpeed = finalSpeed / 2;
    if (exhaustion >= 5) finalSpeed = 0;
    const speedDisplayEl = document.getElementById('speedDisplay');
    if (speedDisplayEl) speedDisplayEl.innerText = Math.floor(finalSpeed);
}

function updateExhaustionEffects() {
    let exhaustion = parseInt(document.getElementById('exhaustion')?.value) || 0;
    let effectsText = " ";
    if (exhaustion >= 1) effectsText += "Помеха при проверках характеристик; ";
    if (exhaustion >= 2) effectsText += "Скорость ÷2; ";
    if (exhaustion >= 3) effectsText += "Помеха при атаке и спасбросках; ";
    if (exhaustion >= 4) effectsText += "Макс. хиты ÷2; ";
    if (exhaustion >= 5) effectsText += "Скорость = 0; ";
    if (exhaustion >= 6) effectsText = "⚰️ СМЕРТЬ! ⚰️ ";
    if (exhaustion === 0) effectsText = "Нет эффектов ";
    const exhaustionEffectsEl = document.getElementById('exhaustionEffects');
    if (exhaustionEffectsEl) exhaustionEffectsEl.innerText = effectsText;

    updateSpeedDisplay();
    updateMaxHp();
}

function levelUpClass(targetClassIdx) {
    if (targetClassIdx < 0 || targetClassIdx >= state.multClasses.length) return;
    let cls = state.multClasses[targetClassIdx];
    let diceVal = cls.hitDice;
    let roll = Math.floor(Math.random() * diceVal) + 1;
    let currentTotalLevel = recalcTotalLevel() + 1;
    state.hpHistory.push({
        gained: roll,
        level: currentTotalLevel
    });

    cls.level++;
    let raw = calculateRawMaxHp();
    let exhaustionVal = parseInt(document.getElementById('exhaustion')?.value) || 0;
    if (exhaustionVal >= 4) {
        state.maxHp = Math.max(1, Math.floor(raw / 2));
    } else {
        state.maxHp = raw;
    }

    let conMod = getMod('con');
    let gainedTotal = roll + conMod;
    if (gainedTotal < 1) gainedTotal = 1;
    state.currentHp += gainedTotal;
    if (state.currentHp > state.maxHp) state.currentHp = state.maxHp;

    updateUI();
    addToLog(`🎉 Уровень ${classNames[cls.className]} повышен до ${cls.level}. Бросок к${diceVal}=${roll}, +${conMod} CON = +${gainedTotal} хп. Теперь ${state.currentHp}/${state.maxHp} хп.`);
    recalcTotalLevel();
    renderMulticlass();
    autoSave();
}

function renderMulticlass() {
    let container = document.getElementById('classesContainer');
    if (!container) return;
    container.innerHTML = '';
    state.multClasses.forEach((cls, idx) => {
        const div = document.createElement('div');
        div.className = 'class-row';
        let selectHtml = `<select class="class-select" data-idx="${idx}">`;
        for (let opt of classOptionsList) {
            let selected = (cls.className === opt.value) ? 'selected' : '';
            selectHtml += `<option value="${opt.value}" ${selected}>${opt.name}</option>`;
        }
        selectHtml += `</select>`;
        div.innerHTML = `${selectHtml} <span>Уровень: <input type="number" class="class-level" data-idx="${idx}" value="${cls.level}" min="1" style="width:60px;"></span> <span>Кость хитов: <select class="class-hd" data-idx="${idx}" style="width:70px;"> <option value="6" ${cls.hitDice === 6 ? 'selected' : ''}>к6</option> <option value="8" ${cls.hitDice === 8 ? 'selected' : ''}>к8</option> <option value="10" ${cls.hitDice === 10 ? 'selected' : ''}>к10</option> <option value="12" ${cls.hitDice === 12 ? 'selected' : ''}>к12</option> </select></span> <button class="remove-class-btn" data-idx="${idx}">🗑</button>`;
        container.appendChild(div);
    });
    
    document.querySelectorAll('.class-select').forEach(sel => {
        sel.onchange = () => {
            let idx = parseInt(sel.dataset.idx);
            state.multClasses[idx].className = sel.value;
            
            // Если меняем первый класс (основной) — обновляем primaryClass
            if (idx === 0) {
                state.primaryClass = sel.value;
            }
            
            renderMulticlass();
            recalcTotalLevel();
            updateMaxHp();
            renderSavingThrows();
            renderClassResource();
            autoSave();
        };
    });
    document.querySelectorAll('.class-level').forEach(inp => {
    inp.onchange = () => {
        let idx = parseInt(inp.dataset.idx);
        let newLevel = Math.max(1, parseInt(inp.value) || 1);
        if (newLevel !== state.multClasses[idx].level) {
            state.multClasses[idx].level = newLevel;
            recalcTotalLevel();
            renderMulticlass();  // <-- ВАЖНО: перерендер для обновления
            renderSavingThrows();
            autoSave();
        }
    };
});
    document.querySelectorAll('.class-hd').forEach(sel => {
        sel.onchange = () => {
            let idx = parseInt(sel.dataset.idx);
            state.multClasses[idx].hitDice = parseInt(sel.value);
            updateMaxHp();
            autoSave();
            renderMulticlass();
        };
    });
    document.querySelectorAll('.remove-class-btn').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            if (idx > 0 && state.multClasses.length > 1) {
                state.multClasses.splice(idx, 1);
                renderMulticlass();
                recalcTotalLevel();
                updateMaxHp();
                renderSavingThrows();
                autoSave();
            }
        };
    });
    recalcTotalLevel();
}

// ============ СПАСБРОСКИ ============
const saveNames = { str: "Сила", dex: "Ловкость", con: "Телосложение", int: "Интеллект", wis: "Мудрость", cha: "Харизма" };
const classSaves = {
    barbarian: ["str", "con"], bard: ["dex", "cha"], cleric: ["wis", "cha"],
    druid: ["int", "wis"], fighter: ["str", "con"], monk: ["str", "dex"],
    paladin: ["wis", "cha"], ranger: ["str", "dex"], rogue: ["dex", "int"],
    sorcerer: ["con", "cha"], warlock: ["wis", "cha"], wizard: ["int", "wis"]
};

function getCurrentClass() {
    return state.primaryClass || "fighter";
}

function isProficientSave(saveAttr) { return classSaves[getCurrentClass()]?.includes(saveAttr) || false; }

function getSaveBonus(saveAttr) {
    let mod = getMod(saveAttr);
    if (isProficientSave(saveAttr)) mod += getProfBonus();
    let extra = state.extraSaveBonuses?.[saveAttr]?.bonus || 0;
    return mod + extra;
}

function renderSavingThrows() {
    let container = document.getElementById('savingThrowsContainer');
    if (!container) return;
    const attrs = ["str", "dex", "con", "int", "wis", "cha"];
    container.innerHTML = '';
    attrs.forEach(attr => {
        let isProf = isProficientSave(attr);
        let bonus = getSaveBonus(attr);
        let div = document.createElement('div');
        div.className = 'skill-row';
        div.innerHTML = `<span class="skill-name ${isProf ? 'proficient' : ''}">${saveNames[attr]}</span> <span class="skill-bonus">${(bonus >= 0 ? '+' : '') + bonus}</span> <button class="save-roll dice" data-bonus="${bonus}">🎲</button>`;
        container.appendChild(div);
        
        div.querySelector('.save-roll').onclick = () => {
    rollD20(bonus, `Спасбросок ${saveNames[attr].trim()}`, addToLog);
};
    });
}

// ============ НАВЫКИ ============
const defaultSkills = ["Акробатика", "Анализ", "Аркана", "Атлетика", "Выживание", "Выступление", "Запугивание", "История", "Ловкость рук", "Магия", "Медицина", "Обман", "Природа", "Проницательность", "Религия", "Скрытность", "Убеждение", "Восприятие"];
const attrMap = {
    "Акробатика": "dex", "Анализ": "int", "Аркана": "int", "Атлетика": "str",
    "Выживание": "wis", "Выступление": "cha", "Запугивание": "cha", "История": "int",
    "Ловкость рук": "dex", "Магия": "int", "Медицина": "wis", "Обман": "cha",
    "Природа": "int", "Проницательность": "wis", "Религия": "int", "Скрытность": "dex",
    "Убеждение": "cha", "Восприятие": "wis"
};

function getSkillBonus(skillName) {
    let attr = attrMap[skillName] || "wis";
    let mod = getMod(attr);
    let isProf = state.customSkills.find(s => s.name === skillName)?.proficient || false;
    if (isProf) mod += getProfBonus();
    let extra = state.skillExtraBonuses[skillName]?.bonus || 0;
    return mod + extra;
}

function renderSkills() {
    let container = document.getElementById('skillsContainer');
    if (!container) return;
    let allSkills = [...defaultSkills];
    state.customSkills.forEach(s => { if (!allSkills.includes(s.name)) allSkills.push(s.name); });
    allSkills.sort();
    container.innerHTML = '';
    allSkills.forEach(skill => {
        let isProficient = state.customSkills.find(s => s.name === skill)?.proficient || false;
        let bonus = getSkillBonus(skill);
        let extra = state.skillExtraBonuses[skill] || { bonus: 0, desc: "" };
        let div = document.createElement('div');
        div.className = 'skill-row';
        div.innerHTML = `<span class="skill-name">${skill}</span> <span class="skill-bonus">${(bonus >= 0 ? '+' : '') + bonus}</span> <input type="number" class="extra-bonus-input" data-skill="${skill}" value="${extra.bonus}" placeholder="бонус" style="width:50px;"> <input type="text" class="extra-desc-input" data-skill="${skill}" value="${extra.desc}" placeholder="описание" style="width:80px;"> <label><input type="checkbox" class="skill-profic" data-skill="${skill}" ${isProficient ? 'checked' : ''}> мастерство</label> <button class="skill-roll dice" data-bonus="${bonus}"></button>`;
        container.appendChild(div);
    });
    
    document.querySelectorAll('.extra-bonus-input').forEach(inp => {
        inp.onchange = () => {
            let skill = inp.dataset.skill;
            let val = parseInt(inp.value) || 0;
            if (!state.skillExtraBonuses[skill]) state.skillExtraBonuses[skill] = { bonus: 0, desc: "" };
            state.skillExtraBonuses[skill].bonus = val;
            renderSkills();
            autoSave();
        };
    });
    document.querySelectorAll('.extra-desc-input').forEach(inp => {
        inp.onchange = () => {
            let skill = inp.dataset.skill;
            let val = inp.value;
            if (!state.skillExtraBonuses[skill]) state.skillExtraBonuses[skill] = { bonus: 0, desc: "" };
            state.skillExtraBonuses[skill].desc = val;
            autoSave();
        };
    });
    document.querySelectorAll('.skill-profic').forEach(cb => {
        cb.onchange = () => {
            let skill = cb.dataset.skill;
            let existing = state.customSkills.find(s => s.name === skill);
            if (existing) existing.proficient = cb.checked;
            else state.customSkills.push({ name: skill, proficient: cb.checked });
            renderSkills();
            autoSave();
        };
    });
    
document.querySelectorAll('.skill-roll').forEach(btn => {
    btn.onclick = () => {
        let bonus = parseInt(btn.dataset.bonus);
        let skillName = btn.parentElement.querySelector('.skill-name').innerText.trim();
        rollD20(bonus, skillName, addToLog);
    };
});
}

// ============ АТАКИ ============
function renderAttacks() {
    let container = document.getElementById('attacksList');
    if (!container) return;
    container.innerHTML = '';
    state.attacks.forEach((a, idx) => {
        let attrName = { str: "Сила", dex: "Ловкость", con: "Телосложение", int: "Интеллект", wis: "Мудрость", cha: "Харизма" }[a.attr] || a.attr;
        let li = document.createElement('li');
        li.className = 'attack-item';
        li.dataset.idx = idx;
        li.innerHTML = `<div><strong>${a.name}</strong> <span style="font-size:0.7rem;">(${attrName})</span> (${a.dice})</div> <div> <button class="attack-roll dice" data-idx="${idx}">🎲 атака</button> <button class="attack-damage dice" data-idx="${idx}" data-dice="${a.dice}">💥 урон</button> <button class="remove-attack remove-btn" data-idx="${idx}">🗑</button> </div>`;
        container.appendChild(li);
    });
    
document.querySelectorAll('.attack-roll').forEach(btn => {
    btn.onclick = () => {
        let idx = parseInt(btn.dataset.idx);
        let a = state.attacks[idx];
        if (!a) return;
        let attrMod = getMod(a.attr);
        let prof = a.proficient ? getProfBonus() : 0;
        let attackBonus = attrMod + prof;
        rollD20(attackBonus, `Атака: ${a.name}`, addToLog);
    };
});
    
    // === ИСПРАВЛЕННАЯ КНОПКА УРОНА (только урон, без проверки попадания) ===
    document.querySelectorAll('.attack-damage').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            let a = state.attacks[idx];
            if (!a) return;
            rollDamage(a.dice, addToLog, `Урон: ${a.name}`);
        };
    });
    // === КОНЕЦ ИСПРАВЛЕНИЯ ===
    
    document.querySelectorAll('.remove-attack').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            state.attacks.splice(idx, 1);
            renderAttacks();
            autoSave();
        };
    });
}
// ============ ЗАКЛИНАНИЯ ============
function renderSlots() {
    let container = document.getElementById('slotsList');
    if (!container) return;
    container.innerHTML = '';
    state.spellSlots.forEach((slot, idx) => {
        let div = document.createElement('div');
        div.className = 'slot-row';
        div.innerHTML = `<strong>ЯЗ ${slot.level}</strong> <span>${slot.current}/${slot.max}</span> <button class="remove-slot remove-btn" data-idx="${idx}">🗑</button>`;
        container.appendChild(div);
    });
    
    document.querySelectorAll('.remove-slot').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            state.spellSlots.splice(idx, 1);
            renderSlots();
            autoSave();
        };
    });
}
function restoreAllSlots() {
    state.spellSlots.forEach(slot => {
        slot.current = slot.max;
    });
    renderSlots();
    addToLog(`🔮 Все ячейки заклинаний восстановлены!`);
    autoSave();
}

function renderClassResource() {
    const container = document.getElementById('classResourceContainer');
    if (!container) return;
    
    // Определяем основной класс персонажа
    const primaryClass = state.primaryClass;
    const resource = state.classResources[primaryClass];
    
    if (!resource) {
        container.innerHTML = '';
        return;
    }
    
    // Для каждого класса свой расчёт максимума
    let maxValue = resource.max;
    let currentValue = resource.current;
    
    if (primaryClass === 'monk') {
        const monkLevel = state.multClasses.find(c => c.className === 'monk')?.level || 0;
        maxValue = monkLevel;
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.monk.max = maxValue;
        state.classResources.monk.current = currentValue;
    } 
    else if (primaryClass === 'sorcerer') {
        const sorcererLevel = state.multClasses.find(c => c.className === 'sorcerer')?.level || 0;
        maxValue = sorcererLevel;
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.sorcerer.max = maxValue;
        state.classResources.sorcerer.current = currentValue;
    } 
    else if (primaryClass === 'barbarian') {
        const barbarianLevel = state.multClasses.find(c => c.className === 'barbarian')?.level || 0;
        if (barbarianLevel >= 20) {
            maxValue = Infinity;
        } else if (barbarianLevel >= 17) {
            maxValue = 6;
        } else if (barbarianLevel >= 12) {
            maxValue = 5;
        } else if (barbarianLevel >= 6) {
            maxValue = 4;
        } else if (barbarianLevel >= 3) {
            maxValue = 3;
        } else {
            maxValue = 2;
        }
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.barbarian.max = maxValue;
        state.classResources.barbarian.current = currentValue;
    }
    else if (primaryClass === 'cleric') {
        const clericLevel = state.multClasses.find(c => c.className === 'cleric')?.level || 0;
        if (clericLevel >= 6) {
            maxValue = 2;
        } else {
            maxValue = 1;
        }
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.cleric.max = maxValue;
        state.classResources.cleric.current = currentValue;
    }
    else if (primaryClass === 'fighter') {
        const fighterLevel = state.multClasses.find(c => c.className === 'fighter')?.level || 0;
        if (fighterLevel >= 17) {
            maxValue = 2;
        } else {
            maxValue = 1;
        }
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.fighter.max = maxValue;
        state.classResources.fighter.current = currentValue;
    }
    else if (primaryClass === 'paladin') {
        const paladinLevel = state.multClasses.find(c => c.className === 'paladin')?.level || 0;
        if (paladinLevel >= 18) {
            maxValue = Infinity;
        } else if (paladinLevel >= 6) {
            maxValue = 2;
        } else if (paladinLevel >= 2) {
            maxValue = 1;
        } else {
            maxValue = 0;
        }
        currentValue = maxValue === Infinity ? Infinity : Math.min(resource.current, maxValue);
        state.classResources.paladin.max = maxValue;
        state.classResources.paladin.current = currentValue;
    }
    else if (primaryClass === 'druid') {
        const druidLevel = state.multClasses.find(c => c.className === 'druid')?.level || 0;
        if (druidLevel >= 20) {
            maxValue = Infinity;
        } else if (druidLevel >= 18) {
            maxValue = Infinity;
        } else if (druidLevel >= 2) {
            maxValue = 2;
        } else {
            maxValue = 0;
        }
        currentValue = maxValue === Infinity ? Infinity : Math.min(resource.current, maxValue);
        state.classResources.druid.max = maxValue;
        state.classResources.druid.current = currentValue;
    }
    else if (primaryClass === 'bard') {
        const bardLevel = state.multClasses.find(c => c.className === 'bard')?.level || 0;
        if (bardLevel >= 5) {
            maxValue = 3;
        } else if (bardLevel >= 1) {
            maxValue = 1;
        } else {
            maxValue = 0;
        }
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.bard.max = maxValue;
        state.classResources.bard.current = currentValue;
    }
    else if (primaryClass === 'ranger') {
        const rangerLevel = state.multClasses.find(c => c.className === 'ranger')?.level || 0;
        if (rangerLevel >= 1) {
            maxValue = 1;
        } else {
            maxValue = 0;
        }
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.ranger.max = maxValue;
        state.classResources.ranger.current = currentValue;
    }
    else if (primaryClass === 'rogue') {
        const rogueLevel = state.multClasses.find(c => c.className === 'rogue')?.level || 0;
        if (rogueLevel >= 1) {
            maxValue = 1;
        } else {
            maxValue = 0;
        }
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.rogue.max = maxValue;
        state.classResources.rogue.current = currentValue;
    }
    else if (primaryClass === 'warlock') {
        // Для варлока ресурс не используется (отдельные ячейки заклинаний)
        maxValue = 0;
        currentValue = 0;
        container.innerHTML = '';
        return;
    }
    else if (primaryClass === 'wizard') {
        const wizardLevel = state.multClasses.find(c => c.className === 'wizard')?.level || 0;
        if (wizardLevel >= 1) {
            maxValue = 1;
        } else {
            maxValue = 0;
        }
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.wizard.max = maxValue;
        state.classResources.wizard.current = currentValue;
    }
    
    // Отображение бесконечности
    let maxDisplay = maxValue === Infinity ? "∞" : maxValue;
    let currentDisplay = maxValue === Infinity ? "∞" : currentValue;
    
    // Если ресурс недоступен (0/0) — не показываем
    if (maxDisplay === 0 && currentDisplay === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0; padding: 8px; background: var(--stat-bg); border-radius: 16px;">
            <strong>⭐ ${resource.name}:</strong>
            <span>${currentDisplay}/${maxDisplay}</span>
            <button id="useResourceBtn" class="dice" style="background: #8b5cf6;">⚡ Использовать</button>
            <button id="restoreResourceBtn" class="dice" style="background: #2c6e2c;">🔄 Восстановить</button>
        </div>
    `;
    
    // Обработчик использования ресурса
    document.getElementById('useResourceBtn')?.addEventListener('click', () => {
        if (maxValue === Infinity) {
            addToLog(`✨ ${resource.name}: бесконечное использование!`);
            return;
        }
        if (currentValue > 0) {
            if (primaryClass === 'monk') {
                state.classResources.monk.current--;
            } else if (primaryClass === 'sorcerer') {
                state.classResources.sorcerer.current--;
            } else if (primaryClass === 'fighter') {
                state.classResources.fighter.current = Math.max(0, state.classResources.fighter.current - 1);
            } else if (primaryClass === 'cleric') {
                state.classResources.cleric.current = Math.max(0, state.classResources.cleric.current - 1);
            } else if (primaryClass === 'barbarian') {
                if (state.classResources.barbarian.max !== Infinity) {
                    state.classResources.barbarian.current = Math.max(0, state.classResources.barbarian.current - 1);
                }
            } else if (primaryClass === 'paladin') {
                if (state.classResources.paladin.max !== Infinity) {
                    state.classResources.paladin.current = Math.max(0, state.classResources.paladin.current - 1);
                }
            } else if (primaryClass === 'druid') {
                if (state.classResources.druid.max !== Infinity) {
                    state.classResources.druid.current = Math.max(0, state.classResources.druid.current - 1);
                }
            } else if (primaryClass === 'bard') {
                state.classResources.bard.current = Math.max(0, state.classResources.bard.current - 1);
            } else if (primaryClass === 'ranger') {
                state.classResources.ranger.current = Math.max(0, state.classResources.ranger.current - 1);
            } else if (primaryClass === 'rogue') {
                state.classResources.rogue.current = Math.max(0, state.classResources.rogue.current - 1);
            } else if (primaryClass === 'wizard') {
                state.classResources.wizard.current = Math.max(0, state.classResources.wizard.current - 1);
            }
            renderClassResource();
            addToLog(`✨ Использован ${resource.name} (${currentValue-1}/${maxValue})`);
            autoSave();
        } else {
            addToLog(`❌ Нет доступных ${resource.name}!`);
        }
    });
    
    // Обработчик восстановления ресурса
    document.getElementById('restoreResourceBtn')?.addEventListener('click', () => {
        if (primaryClass === 'monk') {
            state.classResources.monk.current = state.classResources.monk.max;
        } else if (primaryClass === 'sorcerer') {
            state.classResources.sorcerer.current = state.classResources.sorcerer.max;
        } else if (primaryClass === 'fighter') {
            state.classResources.fighter.current = state.classResources.fighter.max;
        } else if (primaryClass === 'cleric') {
            state.classResources.cleric.current = state.classResources.cleric.max;
        } else if (primaryClass === 'barbarian') {
            if (state.classResources.barbarian.max === Infinity) {
                state.classResources.barbarian.current = Infinity;
            } else {
                state.classResources.barbarian.current = state.classResources.barbarian.max;
            }
        } else if (primaryClass === 'paladin') {
            if (state.classResources.paladin.max === Infinity) {
                state.classResources.paladin.current = Infinity;
            } else {
                state.classResources.paladin.current = state.classResources.paladin.max;
            }
        } else if (primaryClass === 'druid') {
            if (state.classResources.druid.max === Infinity) {
                state.classResources.druid.current = Infinity;
            } else {
                state.classResources.druid.current = state.classResources.druid.max;
            }
        } else if (primaryClass === 'bard') {
            state.classResources.bard.current = state.classResources.bard.max;
        } else if (primaryClass === 'ranger') {
            state.classResources.ranger.current = state.classResources.ranger.max;
        } else if (primaryClass === 'rogue') {
            state.classResources.rogue.current = state.classResources.rogue.max;
        } else if (primaryClass === 'wizard') {
            state.classResources.wizard.current = state.classResources.wizard.max;
        }
        renderClassResource();
        addToLog(`🔄 Восстановлены ${resource.name}`);
        autoSave();
    });
}
async function castSpell(spell) {
    return new Promise((resolve) => {
        let spellAttr = spell.attr || 'wis';
        let attrMod = getMod(spellAttr);
        let profBonusVal = spell.proficient ? getProfBonus() : 0;
        let attackBonus = attrMod + profBonusVal;
        
        if (spell.level === 0) {
            // Заговор — используем rollD20
            rollD20(attackBonus, `Заговор: ${spell.name}`, addToLog);
            
            if (spell.damage) rollDamage(spell.damage, addToLog, `Урон: ${spell.name}`);
            resolve(true);
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'custom-prompt-overlay';
        let availableSlotsHtml = '';
        for (let i = 1; i <= 9; i++) {
            let slot = state.spellSlots.find(s => parseInt(s.level) === i);
            let available = slot ? slot.current : 0;
            let maxSlots = slot ? slot.max : 0;
            availableSlotsHtml += `<option value="${i}" ${(i === spell.level ? 'selected' : '')}>${i} уровень (${available}/${maxSlots} доступно)</option>`;
        }
        overlay.innerHTML = `<div class="custom-prompt"><h4>✨ ${spell.name}</h4><p>Базовый уровень: ${spell.level}</p><label>Выберите уровень ячейки:</label><select id="slotChoice">${availableSlotsHtml}</select><div id="extraDiceBlock" style="display:none;"><label>Разница: <span id="levelDiff">0</span></label><label>Доп. кубиков:</label><input type="number" id="extraDice" value="0" min="0" max="20"></div><div><button id="cancelCastBtn">Отмена</button><button id="confirmCastBtn">Применить</button></div></div>`;
        document.body.appendChild(overlay);
        
        const slotSelect = overlay.querySelector('#slotChoice');
        const extraBlock = overlay.querySelector('#extraDiceBlock');
        const levelDiffSpan = overlay.querySelector('#levelDiff');
        const extraDiceInput = overlay.querySelector('#extraDice');
        
        const updateBlock = () => {
            let selectedLevel = parseInt(slotSelect.value);
            let diff = selectedLevel - spell.level;
            if (diff > 0) {
                extraBlock.style.display = 'block';
                levelDiffSpan.textContent = diff;
                extraDiceInput.value = diff;
            } else {
                extraBlock.style.display = 'none';
            }
        };
        slotSelect.addEventListener('change', updateBlock);
        updateBlock();
        
        const confirmBtn = overlay.querySelector('#confirmCastBtn');
        const cancelBtn = overlay.querySelector('#cancelCastBtn');
        
        confirmBtn.onclick = () => {
            let selectedLevel = parseInt(slotSelect.value);
            let targetSlot = state.spellSlots.find(s => parseInt(s.level) === selectedLevel);
            if (!targetSlot || targetSlot.current <= 0) {
                addToLog(`❌ Нет слотов ${selectedLevel} уровня!`);
                overlay.remove();
                resolve(false);
                return;
            }
            targetSlot.current--;
            renderSlots();
            
            let levelDiff = selectedLevel - spell.level;
            let extraDice = parseInt(extraDiceInput.value) || 0;
            let finalDamage = spell.damage;
            if (levelDiff > 0 && extraDice > 0) {
                finalDamage = upgradeDamage(spell.damage, extraDice);
                addToLog(`🔮 Ячейка ${selectedLevel} (+${extraDice} кубиков)`);
            } else if (levelDiff > 0) {
                finalDamage = upgradeDamage(spell.damage, levelDiff);
                addToLog(`🔮 Ячейка ${selectedLevel} (+${levelDiff} кубиков)`);
            } else {
                addToLog(` Ячейка ${selectedLevel} уровня`);
            }
            
            // Бросок атаки заклинанием через rollD20
            rollD20(attackBonus, `Заклинание: ${spell.name}`, addToLog);
            
            if (finalDamage) rollDamage(finalDamage, addToLog, `Урон: ${spell.name}`);
            
            overlay.remove();
            autoSave();
            resolve(true);
        };
        
        cancelBtn.onclick = () => {
            overlay.remove();
            resolve(false);
        };
    });
}


function renderSpells() {
    let container = document.getElementById('spellsList');
    if (!container) return;
    container.innerHTML = '';
    state.spells.forEach((s, idx) => {
        let levelDisplay = s.level === 0 ? "Заговор" : `ЯЗ ${s.level}`;
        let li = document.createElement('li');
        li.className = 'spell-item';
        li.innerHTML = `<div><strong>✨ ${s.name} (${levelDisplay})</strong> <span style="font-size:0.7rem;">${s.attr.toUpperCase()}</span> <button class="spell-cast-btn dice" data-idx="${idx}">🎲</button> <button class="spell-desc-btn remove-btn" data-idx="${idx}" style="background:#3a6b3a;">📖 Описание</button> <button class="remove-spell remove-btn" data-idx="${idx}">🗑</button></div>`;
        container.appendChild(li);
    });
    
    document.querySelectorAll('.spell-cast-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            let idx = parseInt(btn.dataset.idx);
            if (state.spells[idx]) await castSpell(state.spells[idx]);
        };
    });
    
    // === ИСПРАВЛЕННЫЙ БЛОК ===
    document.querySelectorAll('.spell-desc-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            let idx = parseInt(btn.dataset.idx);
            let s = state.spells[idx];
            if (s) {
                showSpellDescriptionModal(s);
            }
        };
    });
    // === КОНЕЦ ИСПРАВЛЕННОГО БЛОКА ===
    
    document.querySelectorAll('.remove-spell').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            state.spells.splice(idx, 1);
            renderSpells();
            autoSave();
            addToLog(`🗑 Заклинание удалено`);
        };
    });
}


// ============ ОПИСАНИЕ ЗАКЛИНАНИЙ ============
function showSpellDescriptionModal(spell) {
    let modal = document.getElementById('spellDescModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'spellDescModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h3 id="spellDescTitle">✨ Название</h3>
                <div id="spellDescDetails" style="margin: 10px 0; padding: 8px; background: var(--stat-bg); border-radius: 16px;"></div>
                <p id="spellDescText" style="white-space: pre-wrap; margin: 10px 0;"></p>
                <button id="closeSpellDescBtn" style="margin-top: 10px;">Закрыть</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        document.getElementById('closeSpellDescBtn').onclick = () => {
            modal.style.display = 'none';
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }
    
    document.getElementById('spellDescTitle').innerHTML = `✨ ${spell.name}`;
    document.getElementById('spellDescDetails').innerHTML = `
        <strong>Уровень:</strong> ${spell.level === 0 ? 'Заговор' : spell.level}<br>
        <strong>Атрибут:</strong> ${spell.attr.toUpperCase()}<br>
        <strong>Владение:</strong> ${spell.proficient ? 'да' : 'нет'}<br>
        <strong>Урон:</strong> ${spell.damage || '—'}
    `;
    document.getElementById('spellDescText').innerHTML = spell.desc || 'Нет описания';
    
    modal.style.display = 'flex';
}



// ============ ИНВЕНТАРЬ ============
function renderInventory() {
    let ul = document.getElementById('inventoryList');
    if (!ul) return;
    ul.innerHTML = state.inventoryItems.map((it, i) => {
        let hasCounter = it.useCounter === true;
        let qty = it.qty || 0;
        let counterHtml = '';
        if (hasCounter) {
            counterHtml = `<div style="margin-top:4px;"> <button class="qty-dec qty-btn" data-idx="${i}">-</button> <span class="item-quantity">${qty}</span> <button class="qty-inc qty-btn" data-idx="${i}">+</button> </div>`;
        }
        return `<li class="inventory-item"> <div> <strong> ${it.name}</strong>${it.desc ? ` — ${it.desc}` : ''} ${hasCounter ? ` (×${qty})` : ''} ${counterHtml} </div> <button class="del-item remove-btn" data-idx="${i}">🗑</button> </li>`;
    }).join('');
    
    document.querySelectorAll('.qty-inc').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            if (state.inventoryItems[idx] && state.inventoryItems[idx].useCounter) {
                state.inventoryItems[idx].qty = (state.inventoryItems[idx].qty || 0) + 1;
                renderInventory();
                autoSave();
            }
        };
    });
    document.querySelectorAll('.qty-dec').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            if (state.inventoryItems[idx] && state.inventoryItems[idx].useCounter && state.inventoryItems[idx].qty > 0) {
                state.inventoryItems[idx].qty--;
                renderInventory();
                autoSave();
            }
        };
    });
    document.querySelectorAll('.del-item').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            state.inventoryItems.splice(idx, 1);
            renderInventory();
            autoSave();
        };
    });
}

function renderFeatures() {
    let container = document.getElementById('featuresList');
    if (!container) return;
    container.innerHTML = state.features.map((f, i) => `<li class="feature-item"> <strong>⭐ ${f.name}</strong>${f.desc ? ` — ${f.desc}` : ''} <button class="remove-feature remove-btn" data-idx="${i}">🗑</button> </li>`).join('');
    document.querySelectorAll('.remove-feature').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            state.features.splice(idx, 1);
            renderFeatures();
            autoSave();
            addToLog(`🗑 Способность удалена`);
        };
    });
}

// ============ ЗАМЕТКИ ============
function renderNotes() {
    let container = document.getElementById('notesList');
    if (!container) return;
    container.innerHTML = '';
    state.notes.forEach((note, idx) => {
        let li = document.createElement('li');
        li.className = 'note-item';
        li.innerHTML = `<div><strong>📌 ${note.title}</strong></div> <div> <button class="open-note-btn dice" data-idx="${idx}">📖 Открыть</button> <button class="delete-note-btn remove-btn" data-idx="${idx}">🗑 Удалить</button> </div>`;
        container.appendChild(li);
    });
    document.querySelectorAll('.open-note-btn').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            let note = state.notes[idx];
            if (note) openNoteModal(idx, note.title, note.desc);
        };
    });
    document.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            if (confirm(`Удалить заметку "${state.notes[idx].title}"?`)) {
                state.notes.splice(idx, 1);
                renderNotes();
                autoSave();
                addToLog(`🗑 Заметка удалена.`);
            }
        };
    });
}

function openNoteModal(idx, title, desc) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = title;
    titleInput.placeholder = 'Заголовок';
    const descTextarea = document.createElement('textarea');
    descTextarea.value = desc;
    descTextarea.placeholder = 'Текст заметки...';
    descTextarea.rows = 10;
    descTextarea.style.width = '100%';
    const buttonGroup = document.createElement('div');
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '✏️ Сохранить изменения';
    saveBtn.style.background = '#2c6e2c';
    saveBtn.style.color = 'white';
    saveBtn.style.borderRadius = '30px';
    saveBtn.style.padding = '6px 12px';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Закрыть';
    closeBtn.style.background = 'var(--button-bg)';
    closeBtn.style.color = 'var(--button-text)';
    closeBtn.style.borderRadius = '30px';
    closeBtn.style.padding = '6px 12px';
    buttonGroup.appendChild(saveBtn);
    buttonGroup.appendChild(closeBtn);
    modalContent.appendChild(titleInput);
    modalContent.appendChild(descTextarea);
    modalContent.appendChild(buttonGroup);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    const closeModal = () => modalOverlay.remove();
    saveBtn.onclick = () => {
        const newTitle = titleInput.value.trim();
        const newDesc = descTextarea.value;
        if (newTitle) {
            state.notes[idx].title = newTitle;
            state.notes[idx].desc = newDesc;
            renderNotes(); 
            autoSave();
            addToLog(`✏️ Заметка "${newTitle}" обновлена.`);
            closeModal();
        } else {
            alert('Заголовок не может быть пустым!');
        }
    };
    closeBtn.onclick = closeModal;
    modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeModal(); };
}

// ============ ИНИЦИАЛИЗАЦИЯ ОБРАБОТЧИКОВ ============
function initEventHandlers() {
    document.getElementById('levelUpMainBtn')?.addEventListener('click', () => {
        if (state.multClasses.length === 1) {
            levelUpClass(0);
        } else {
            let options = state.multClasses.map((cls, idx) => `${idx + 1}. ${classNames[cls.className]} (ур. ${cls.level}, к${cls.hitDice})`).join('\n');
            let choice = prompt(`Какой класс повысить?\n${options}\n\nВведите номер класса (1-${state.multClasses.length}):`);
            let idx = parseInt(choice) - 1;
            if (!isNaN(idx) && idx >= 0 && idx < state.multClasses.length) levelUpClass(idx);
            else addToLog(`❌ Неверный выбор класса.`);
        }
    });
    
    document.getElementById('pp')?.addEventListener('input', () => { state.money.pp = parseInt(document.getElementById('pp').value) || 0; autoSave(); });
    document.getElementById('gp')?.addEventListener('input', () => { state.money.gp = parseInt(document.getElementById('gp').value) || 0; autoSave(); });
    document.getElementById('sp')?.addEventListener('input', () => { state.money.sp = parseInt(document.getElementById('sp').value) || 0; autoSave(); });
    document.getElementById('cp')?.addEventListener('input', () => { state.money.cp = parseInt(document.getElementById('cp').value) || 0; autoSave(); });

    // const maxHpInput = document.getElementById('maxHpInput');
    // const manualHpCheckbox = document.getElementById('manualHpCheckbox');
    // manualHpCheckbox?.addEventListener('change', () => {
    //     state.manualHpEnabled = manualHpCheckbox.checked;
    //     if (state.manualHpEnabled) {
    //         maxHpInput.disabled = false;
    //         maxHpInput.value = state.maxHp;
    //         addToLog(`✏️ Ручное редактирование MaxHP включено.`);
    //     } else {
    //         maxHpInput.disabled = true;
    //         addToLog(`🔄 Ручное редактирование хитов отключено.`);
    //     }
    //     autoSave();
    // });
    // maxHpInput?.addEventListener('change', () => {
    //     if (state.manualHpEnabled) {
    //         let newMax = parseInt(maxHpInput.value);
    //         if (!isNaN(newMax) && newMax > 0) {
    //             state.maxHp = newMax;
    //             if (state.currentHp > state.maxHp) state.currentHp = state.maxHp;
    //             updateUI();
    //             addToLog(`✏️ MaxHP изменён вручную: ${state.maxHp}`);
    //             autoSave();
    //         }
    //     }
    // });

    document.getElementById('addClassBtn')?.addEventListener('click', () => {
        state.multClasses.push({ className: "fighter", level: 1, hitDice: 8 });
        renderMulticlass();
        recalcTotalLevel();
        updateMaxHp();
        renderSavingThrows();
        autoSave();
        addToLog(`➕ Добавлен дополнительный класс: Воин`);
    });

    document.getElementById('addAttackBtn')?.addEventListener('click', () => {
        let name = document.getElementById('attackName')?.value.trim();
        let attr = document.getElementById('attackAttr')?.value;
        let proficient = document.getElementById('attackProficient')?.checked;
        let dice = document.getElementById('attackDice')?.value.trim();
        if (name && dice) {
            state.attacks.push({ name, attr, proficient, dice });
            renderAttacks();
            document.getElementById('attackName').value = '';
            document.getElementById('attackDice').value = '1к8+3';
            addToLog(`⚔️ Добавлена атака: ${name}`);
            autoSave();
        } else {
            addToLog(` Укажите название и урон`);
        }
    });

    document.getElementById('addSpellBtn')?.addEventListener('click', () => {
        let name = document.getElementById('spellName')?.value.trim();
        let levelVal = document.getElementById('spellLevel')?.value || '1';
        let attr = document.getElementById('spellAttr')?.value || 'wis';
        let proficient = document.getElementById('spellProficient')?.checked;
        let damage = document.getElementById('spellDamage')?.value.trim();
        let desc = document.getElementById('spellDesc')?.value.trim();
        if (!name) { addToLog(`❌ Укажите название заклинания`); return; }
        let level = parseInt(levelVal);
        if (isNaN(level)) level = 0;
        state.spells.push({ name, level, attr, proficient, damage, desc });
        renderSpells();
        document.getElementById('spellName').value = '';
        document.getElementById('spellDamage').value = '1к6';
        document.getElementById('spellDesc').value = '';
        addToLog(`✨ Добавлено заклинание: ${name}`);
        autoSave();
    });

    document.getElementById('addSlotBtn')?.addEventListener('click', () => {
        let level = document.getElementById('slotLevel')?.value.trim();
        let max = parseInt(document.getElementById('slotTotal')?.value);
        let cur = parseInt(document.getElementById('slotCurrent')?.value);
        if (level && !isNaN(max) && max > 0) {
            state.spellSlots.push({ level, max, current: isNaN(cur) ? max : cur });
            renderSlots();
            document.getElementById('slotLevel').value = '';
            document.getElementById('slotTotal').value = '';
            document.getElementById('slotCurrent').value = '';
            addToLog(`🔮 Добавлен слот: ${level} уровень`);
            autoSave();
        }
    });

    document.getElementById('addItemBtn')?.addEventListener('click', () => {
        let name = document.getElementById('newItemName')?.value.trim();
        let qty = parseInt(document.getElementById('newItemQty')?.value) || 1;
        let desc = document.getElementById('newItemDesc')?.value.trim();
        let useCounter = document.getElementById('newItemUseCounter')?.checked || false;
        if (name) {
            state.inventoryItems.push({ name, qty: useCounter ? qty : 0, desc, useCounter });
            renderInventory();
            document.getElementById('newItemName').value = '';
            document.getElementById('newItemQty').value = '';
            document.getElementById('newItemDesc').value = '';
            document.getElementById('newItemUseCounter').checked = false;
            addToLog(`➕ Добавлен предмет: ${name}`);
            autoSave();
        }
    });

    document.getElementById('addFeatureBtn')?.addEventListener('click', () => {
        let name = document.getElementById('featureName')?.value.trim();
        let desc = document.getElementById('featureDesc')?.value.trim();
        if (name) {
            state.features.push({ name, desc });
            renderFeatures();
            document.getElementById('featureName').value = '';
            document.getElementById('featureDesc').value = '';
            addToLog(`⭐ Добавлена способность: ${name}`);
            autoSave();
        }
    });

    document.getElementById('addSkillBtn')?.addEventListener('click', () => {
        let name = document.getElementById('newSkillName')?.value.trim();
        if (name && !state.customSkills.find(s => s.name === name)) {
            state.customSkills.push({ name, proficient: false });
            renderSkills();
            document.getElementById('newSkillName').value = '';
            autoSave();
        }
    });

    document.getElementById('addNoteBtn')?.addEventListener('click', () => {
        let title = document.getElementById('newNoteTitle')?.value.trim();
        let desc = document.getElementById('newNoteDesc')?.value.trim();
        if (title) {
            state.notes.push({ title, desc });
            renderNotes();
            document.getElementById('newNoteTitle').value = '';
            document.getElementById('newNoteDesc').value = '';
            addToLog(`📝 Добавлена заметка: ${title}`);
            autoSave();
        } else { addToLog(`❌ Укажите заголовок заметки.`); }
    });

    document.getElementById('importJsonBtn')?.addEventListener('click', () => {
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            let file = e.target.files[0];
            if (!file) return;
            let reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    let data = JSON.parse(ev.target.result);
                    let spellsToImport = Array.isArray(data) ? data : [data];
                    let importedCount = 0;
                    for (let spellData of spellsToImport) {
                        if (spellData.name && spellData.level !== undefined) {
                            let level = parseInt(spellData.level) || 0;
                            if (level < 0) level = 0;
                            if (level > 9) level = 9;
                            let descParts = [];
                            if (spellData.text) descParts.push(spellData.text);
                            if (spellData.school) descParts.push(`Школа: ${spellData.school}`);
                            if (spellData.castingTime) descParts.push(`Время: ${spellData.castingTime}`);
                            if (spellData.range) descParts.push(`Дистанция: ${spellData.range}`);
                            if (spellData.components) descParts.push(`Компоненты: ${spellData.components}`);
                            if (spellData.materials && spellData.materials !== '-') descParts.push(`Материалы: ${spellData.materials}`);
                            if (spellData.duration) descParts.push(`Длительность: ${spellData.duration}`);
                            if (spellData.ritual === 'ритуал') descParts.push(`Ритуал`);
                            if (spellData.source) descParts.push(`Источник: ${spellData.source}`);
                            let fullDesc = descParts.join('\n');
                            let exists = state.spells.some(s => s.name === spellData.name);
                            if (!exists) {
                                state.spells.push({
                                    name: spellData.name,
                                    level: level,
                                    attr: document.getElementById('spellcastingAttr')?.value || 'wis',
                                    proficient: true,
                                    damage: '',
                                    desc: fullDesc
                                });
                                importedCount++;
                            }
                        }
                    }
                    if (importedCount > 0) {
                        renderSpells();
                        addToLog(`📖 Импортировано заклинаний: ${importedCount}`);
                    } else { addToLog(`⚠️ Новых заклинаний не найдено`); }
                    autoSave();
                } catch (err) { addToLog(`❌ Ошибка парсинга JSON: ${err.message}`); }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    document.getElementById('hpHeal')?.addEventListener('click', () => {
        let h = parseInt(prompt("Лечение: "));
        if (h > 0) {
            state.currentHp = Math.min(state.maxHp, state.currentHp + h);
            updateUI();
            addToLog(`💚 +${h} хп`);
            autoSave();
        }
    });
    
    document.getElementById('hpDamage')?.addEventListener('click', () => {
        let d = parseInt(prompt("Урон:"));
        if (d > 0) {
            let remainingDamage = d;
            let tempAbsorbed = Math.min(state.tempHp, remainingDamage);
            state.tempHp -= tempAbsorbed;
            remainingDamage -= tempAbsorbed;
            let realDamage = Math.min(state.currentHp, remainingDamage);
            state.currentHp -= realDamage;
            remainingDamage -= realDamage;
            document.getElementById('tempHp').value = state.tempHp;
            updateUI();
            addToLog(`💔 Получено ${d} урона: ${tempAbsorbed} поглощено временными хитами, ${realDamage} снято с основных. Осталось временных: ${state.tempHp}, основных: ${state.currentHp}/${state.maxHp}`);
            if (state.currentHp <= 0) addToLog(`⚠️ Персонаж без сознания! Используйте спасброски от смерти.`);
            autoSave();
        }
    });

    document.getElementById('tempHpClear')?.addEventListener('click', () => {
        state.tempHp = 0;
        document.getElementById('tempHp').value = 0;
        updateUI();
        addToLog(`✨ Временные хиты сброшены`);
        autoSave();
    });
    document.getElementById('tempHpSet')?.addEventListener('click', () => {
        let newTemp = parseInt(document.getElementById('tempHp').value);
        if (!isNaN(newTemp) && newTemp >= 0) {
            state.tempHp = newTemp;
            document.getElementById('tempHp').value = state.tempHp;
            updateUI();
            addToLog(`🛡️ Временные хиты установлены: ${state.tempHp}`);
            autoSave();
        } else { addToLog(`❌ Введите корректное значение`); }
    });

    document.getElementById('shortRestBtn')?.addEventListener('click', () => addToLog(`🛌 Короткий отдых`));

    document.getElementById('longRestBtn')?.addEventListener('click', () => {
        let exhaustion = parseInt(document.getElementById('exhaustion')?.value) || 0;
        if (exhaustion > 0) {
            exhaustion--;
            document.getElementById('exhaustion').value = exhaustion;
            updateExhaustionEffects();
            addToLog(`🌿 Долгий отдых: уровень истощения снижен до ${exhaustion}.`);
        } else { addToLog(` Долгий отдых: здоровье и слоты восстановлены.`); }
        state.currentHp = state.maxHp;
        state.tempHp = 0;
        state.spellSlots.forEach(s => s.current = s.max);
        state.deathSuccess = 0;
        state.deathFail = 0;
        document.getElementById('tempHp').value = 0;
        renderSlots();
        updateUI();
        autoSave();
    });

    document.getElementById('initBtn')?.addEventListener('click', () => {
        let dexMod = getMod('dex');
        let bonus = parseInt(document.getElementById('initBonus')?.value) || 0;
        let totalBonus = dexMod + bonus;
        rollD20(totalBonus, "Инициатива", addToLog);
    });

    document.getElementById('setAcBtn')?.addEventListener('click', () => {
        let v = parseInt(document.getElementById('acInput')?.value);
        if (!isNaN(v)) document.getElementById('acValue').innerText = v;
    });

    document.getElementById('deathSaveRollBtn')?.addEventListener('click', () => {
        let r = Math.floor(Math.random() * 20) + 1;
        if (r >= 10) {
            state.deathSuccess = Math.min(3, state.deathSuccess + 1);
            addToLog(`✅ Спасбросок смерти: ${r} (${state.deathSuccess}/3)`);
            if (state.deathSuccess == 3) addToLog(`✨ Стабилизирован`);
        } else {
            state.deathFail = Math.min(3, state.deathFail + 1);
            addToLog(`❌ Спасбросок смерти: ${r} (${state.deathFail}/3)`);
            if (state.deathFail === 3) addToLog(`💀 Гибель`);
        }
        updateUI();
        autoSave();
    });

    document.getElementById('resetDeath')?.addEventListener('click', () => {
        state.deathSuccess = 0;
        state.deathFail = 0;
        updateUI();
        autoSave();
    });

    document.getElementById('rollCustom')?.addEventListener('click', () => {
        let e = document.getElementById('customDice')?.value;
        if (e) rollDamage(e, addToLog, "Пользовательский бросок");
    });

    document.getElementById('clearLog')?.addEventListener('click', () => {
        let log = document.getElementById('logArea');
        if (log) log.innerHTML = "🧹 Лог очищен. ";
    });

document.getElementById('saveToFileBtn')?.addEventListener('click', async () => {
    const saveData = {
        version: APP_VERSION,
        primaryClass: state.primaryClass,
        spells: state.spells,
        spellSlots: state.spellSlots,
        attacks: state.attacks,
        inventoryItems: state.inventoryItems,
        features: state.features,
        customSkills: state.customSkills,
        notes: state.notes,
        multClasses: state.multClasses,
        skillExtraBonuses: state.skillExtraBonuses,
        extraSaveBonuses: state.extraSaveBonuses,
        currentHp: state.currentHp,
        maxHp: state.maxHp,
        deathSuccess: state.deathSuccess,
        deathFail: state.deathFail,
        tempHp: state.tempHp,
        profBonus: state.profBonus,
        stats: state.stats,
        charName: state.charName,
        charRace: state.charRace,
        hpHistory: state.hpHistory,
        manualHpEnabled: state.manualHpEnabled,
        classResources: state.classResources
    };
    
    const jsonStr = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    
    // Современный способ (работает без сервера)
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: `character_${state.charName || 'unnamed'}.json`,
                types: [{
                    description: 'JSON файл',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            addToLog(`💾 Сохранено в файл`);
            return;
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error(err);
            }
        }
    }
    
    // Fallback для старых браузеров
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `character_${state.charName || 'unnamed'}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    addToLog(`💾 Сохранено в файл`);
});

    document.getElementById('loadFromFileBtn')?.addEventListener('click', () => {
        let inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = 'application/json';
        inp.onchange = (e) => {
            let file = e.target.files[0];
            if (!file) return;
            let reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    let data = JSON.parse(ev.target.result);
                    state.spells = data.spells || [];
                    state.spellSlots = data.spellSlots || [];
                    state.attacks = data.attacks || [];
                    state.inventoryItems = data.inventoryItems || [];
                    state.features = data.features || [];
                    state.customSkills = data.customSkills || [];
                    state.notes = data.notes || [];
                    state.multClasses = data.multClasses || [{ className: "fighter", level: 1, hitDice: 8 }];
                    state.skillExtraBonuses = data.skillExtraBonuses || {};
                    state.extraSaveBonuses = data.extraSaveBonuses || {};
                    state.currentHp = data.currentHp || 27;
                    state.maxHp = data.maxHp || 27;
                    state.deathSuccess = data.deathSuccess || 0;
                    state.deathFail = data.deathFail || 0;
                    state.tempHp = data.tempHp || 0;
                    state.profBonus = data.profBonus || 2;
                    state.primaryClass = data.primaryClass || (state.multClasses[0]?.className || "fighter");
                    state.manualHpEnabled = data.manualHpEnabled || false;
                    document.getElementById('profBonus').value = state.profBonus;
                    document.getElementById('tempHp').value = state.tempHp;
                    state.charName = data.charName || "";
                    state.charRace = data.charRace || "";
// Добавить синхронизацию с полями ввода
                    const charNameInput = document.getElementById('charName');
                    const charRaceInput = document.getElementById('charRace');
                    if (charNameInput) charNameInput.value = state.charName;
                    if (charRaceInput) charRaceInput.value = state.charRace;
                    updateExhaustionEffects();
                    updateSpeedDisplay();
                    updateMaxHp();
                    renderMulticlass();
                    renderSavingThrows();
                    renderSkills();
                    renderInventory();
                    renderSpells();
                    renderSlots(); 
                    renderAttacks();
                    renderFeatures();
                    renderNotes();
                    updateUI();
                    addToLog(`📀 Загружено`);
                    autoSave();
                } catch (err) { addToLog(`❌ Ошибка загрузки`); }
            };
            reader.readAsText(file);
        };
        inp.click();
    });

    document.getElementById('resetToDefaultBtn')?.addEventListener('click', () => {
        if (confirm("Сбросить всё? ")) {
            localStorage.clear();
            location.reload();
        }
    });
    // Восстановление всех ячеек заклинаний
    document.getElementById('restoreSlotsBtn')?.addEventListener('click', () => {
    restoreAllSlots();
});    

    document.querySelectorAll('.stat-card .card-header').forEach(header => {
        header.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            header.closest('.stat-card').classList.toggle('collapsed');
        });
    });

    document.getElementById('collapseAllBtn')?.addEventListener('click', () => {
        document.querySelectorAll('.stat-card').forEach(c => c.classList.add('collapsed'));
    });

    document.getElementById('expandAllBtn')?.addEventListener('click', () => {
        document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('collapsed'));
    });

    document.getElementById('themeToggle')?.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('dnd_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        document.getElementById('themeToggle').innerHTML = document.body.classList.contains('dark') ? '☀️ Светлая тема' : '🌙 Тёмная тема';
    });

    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => {
            state.stats[id] = parseInt(document.getElementById(id).value) || 0;
            updateUI();
            renderSavingThrows();
            renderSkills();
            renderAttacks();
            autoSave();
        });
    });
    
    document.getElementById('profBonus')?.addEventListener('input', () => {
        state.profBonus = parseInt(document.getElementById('profBonus').value) || 2;
        renderSavingThrows();
        renderSkills();
        renderAttacks();
        autoSave();
    });
    document.getElementById('charName')?.addEventListener('input', () => { state.charName = document.getElementById('charName').value; autoSave(); });
    document.getElementById('charRace')?.addEventListener('input', () => { state.charRace = document.getElementById('charRace').value; autoSave(); });
    document.getElementById('exhaustion')?.addEventListener('input', function () {
        let val = parseInt(this.value) || 0;
        if (val > 6) val = 6;
        if (val < 0) val = 0;
        this.value = val;
        updateExhaustionEffects();
        autoSave();
    });
    document.getElementById('baseSpeed')?.addEventListener('input', () => { updateSpeedDisplay(); autoSave(); });
    document.getElementById('charClass')?.addEventListener('change', () => { renderSavingThrows(); autoSave(); });
}


// Вызов импорта из файла (переиспользуем существующую логику)
// Вызов импорта из файла (полная версия)
// Вызов импорта из файла (полная версия с обходом блокировки)
function triggerFileImport() {
    // Создаём временную кнопку
    const tempBtn = document.createElement('button');
    tempBtn.style.display = 'none';
    document.body.appendChild(tempBtn);
    
    // Создаём input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                
                // Очищаем текущее состояние
                localStorage.removeItem('dnd_master_sheet_full');
                localStorage.removeItem('dnd_roll_history');
                
                // Загружаем импортированные данные
                state.spells = data.spells || [];
                state.spellSlots = data.spellSlots || [];
                state.attacks = data.attacks || [];
                state.inventoryItems = data.inventoryItems || [];
                state.features = data.features || [];
                state.customSkills = data.customSkills || [];
                state.notes = data.notes || [];
                state.multClasses = data.multClasses || [{ className: "fighter", level: 1, hitDice: 8 }];
                state.skillExtraBonuses = data.skillExtraBonuses || {};
                state.extraSaveBonuses = data.extraSaveBonuses || {};
                state.currentHp = data.currentHp || 27;
                state.maxHp = data.maxHp || 27;
                state.deathSuccess = data.deathSuccess || 0;
                state.deathFail = data.deathFail || 0;
                state.tempHp = data.tempHp || 0;
                state.profBonus = data.profBonus || 2;
                state.charName = data.charName || "";
                state.charRace = data.charRace || "";
                state.hpHistory = data.hpHistory || [];
                state.manualHpEnabled = data.manualHpEnabled || false;
                state.primaryClass = data.primaryClass || (state.multClasses[0]?.className || "fighter");
                
                // Классовые ресурсы
                if (data.classResources) {
                    state.classResources = data.classResources;
                }
                
                // Статы
                if (data.stats) {
                    state.stats = data.stats;
                    document.getElementById('str').value = state.stats.str;
                    document.getElementById('dex').value = state.stats.dex;
                    document.getElementById('con').value = state.stats.con;
                    document.getElementById('int').value = state.stats.int;
                    document.getElementById('wis').value = state.stats.wis;
                    document.getElementById('cha').value = state.stats.cha;
                }
                
                // Деньги
                if (data.money) {
                    state.money = data.money;
                    document.getElementById('pp').value = state.money.pp;
                    document.getElementById('gp').value = state.money.gp;
                    document.getElementById('sp').value = state.money.sp;
                    document.getElementById('cp').value = state.money.cp;
                }
                
                // Обновляем интерфейс
                renderMulticlass();
                renderSavingThrows();
                renderSkills();
                renderInventory();
                renderSpells();
                renderSlots();
                renderAttacks();
                renderFeatures();
                renderNotes();
                renderClassResource();
                updateUI();
                
                // Сохраняем в localStorage
                autoSave();
                
                addToLog(`📀 Импортирован персонаж ${state.charName || 'Безымянный'}`);
                
                // Удаляем временную кнопку
                tempBtn.remove();
            } catch (err) {
                addToLog(`❌ Ошибка импорта: ${err.message}`);
                tempBtn.remove();
            }
        };
        reader.readAsText(file);
    };
    
    // Добавляем input на кнопку и эмулируем клик
    tempBtn.onclick = () => {
        input.click();
        tempBtn.remove();
    };
    tempBtn.click();
}

// ============ ЗАПУСК ============
document.addEventListener('DOMContentLoaded', async () => {
    const versionSpan = document.getElementById('appVersion');
    if (versionSpan) versionSpan.textContent = APP_VERSION;
    
    checkAndMigrateVersion();
    
    const saved = localStorage.getItem('dnd_master_sheet_full');
    let savedData = null;
    let hasSavedData = false;
    
    if (saved) {
        try {
            savedData = JSON.parse(saved);
            hasSavedData = savedData.charName || 
                           (savedData.primaryClass !== 'fighter') || 
                           (savedData.multClasses[0]?.level > 1);
        } catch(e) {}
    }
    
    let action = '1';
    let needImport = false;
    
    if (hasSavedData) {
        action = prompt(
            `🔄 Найдено сохранение персонажа "${savedData.charName || 'Безымянный'}" (${classNames[savedData.primaryClass] || savedData.primaryClass}, уровень ${savedData.multClasses[0]?.level || 1}).\n\n` +
            `Введите номер действия:\n` +
            `1 - Загрузить сохранение\n` +
            `2 - Создать нового персонажа\n` +
            `3 - Импортировать персонажа из JSON файла`
        );
        needImport = (action === '3');
    } else {
        action = prompt(
            `🎭 Добро пожаловать в D&D 5e Character Sheet!\n\n` +
            `Введите номер действия:\n` +
            `1 - Создать нового персонажа\n` +
            `2 - Импортировать персонажа из JSON файла`
        );
        needImport = (action === '2');
    }
    
    // Сначала рендерим базовый интерфейс
    updateSpeedDisplay();
    updateExhaustionEffects();
    updateMaxHp();
    renderSkills();
    renderInventory();
    renderSpells();
    renderSlots();
    renderAttacks();
    renderFeatures();
    renderNotes();
    initEventHandlers();

    const savedTheme = localStorage.getItem('dnd_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) themeToggle.innerHTML = '☀️ Светлая тема';
    }

    // Если выбран импорт
    if (needImport) {
        addToLog(`📀 Нажмите кнопку "📂 Загрузить" в блоке Журнал для импорта персонажа из JSON файла`);
        alert('Для импорта персонажа нажмите кнопку "📂 Загрузить" в блоке "Журнал"');
        // Не загружаем и не создаём персонажа
        return;
    }
    
    // Обработка остальных вариантов
    if (hasSavedData && action === '1') {
        loadData();
    } 
    else if ((hasSavedData && action === '2') || (!hasSavedData && action === '1')) {
        if (hasSavedData) {
            localStorage.removeItem('dnd_master_sheet_full');
            localStorage.removeItem('dnd_roll_history');
        }
        await initNewCharacter();
    }
    else {
        if (!hasSavedData) {
            await initNewCharacter();
        } else {
            loadData();
        }
    }

    addToLog("🌸 Лист персонажа загружен.");
});