// ============ СОХРАНЕНИЕ / ЗАГРУЗКА / ИМПОРТ / ЭКСПОРТ ============
// Зависит от: state.js, constants.js, ui-core.js

function autoSave() {
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
        charName: state.charName,
        charRace: state.charRace,
        stats: state.stats,
        money: state.money,
        hpHistory: state.hpHistory,
        manualHpEnabled: state.manualHpEnabled,
        classResources: state.classResources
    };
    localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(saveData));
}

function checkAndMigrateVersion() {
    const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    const currentVersion = APP_VERSION;

    if (!savedVersion) {
        localStorage.setItem(STORAGE_VERSION_KEY, currentVersion);
        addToLog('📌 Инициализирована версия ' + currentVersion);
        return;
    }

    if (savedVersion !== currentVersion) {
        addToLog('📌 Обновление с версии ' + savedVersion + ' до ' + currentVersion);
        // TODO: миграции для разных версий
        localStorage.setItem(STORAGE_VERSION_KEY, currentVersion);
        addToLog('✅ Обновление завершено');
    } else {
        addToLog('📌 Текущая версия: ' + currentVersion);
    }
}

function loadData() {
    let saved = localStorage.getItem(STORAGE_DATA_KEY);
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
            state.manualHpEnabled = true; // Принудительно включаем ручное редактирование

            if (d.primaryClass) {
                state.primaryClass = d.primaryClass;
            } else if (state.multClasses.length > 0) {
                state.primaryClass = state.multClasses[0].className;
            }

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

            // Принудительно включаем ручное редактирование ХП
            document.getElementById('manualHpCheckbox').checked = true;
            document.getElementById('manualHpCheckbox').disabled = true;
            document.getElementById('maxHpInput').disabled = false;
            document.getElementById('maxHpInput').value = state.maxHp;

            updateExhaustionEffects();
            updateSpeedDisplay();
            updateMaxHp();
            if (typeof renderMulticlass === 'function') renderMulticlass();
            if (typeof renderSavingThrows === 'function') renderSavingThrows();
            if (typeof renderSkills === 'function') renderSkills();
            if (typeof renderInventory === 'function') renderInventory();
            if (typeof renderSpells === 'function') renderSpells();
            if (typeof renderSlots === 'function') renderSlots();
            if (typeof renderAttacks === 'function') renderAttacks();
            if (typeof renderFeatures === 'function') renderFeatures();
            if (typeof renderNotes === 'function') renderNotes();
            if (typeof renderClassResource === 'function') renderClassResource();
            if (typeof updateUI === 'function') updateUI();

            addToLog('📀 Загружено сохранение');
        } catch (e) {
            console.error(e);
        }
    }
}

async function saveToFile() {
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

    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: 'character_' + (state.charName || 'unnamed') + '.json',
                types: [{
                    description: 'JSON файл',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            addToLog('💾 Сохранено в файл');
            return;
        } catch (err) {
            if (err.name !== 'AbortError') console.error(err);
        }
    }

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'character_' + (state.charName || 'unnamed') + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    addToLog('💾 Сохранено в файл');
}

function loadFromFile() {
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
                importCharacterData(data);
                addToLog('📀 Загружено');
                autoSave();
            } catch (err) {
                addToLog('❌ Ошибка загрузки');
            }
        };
        reader.readAsText(file);
    };
    inp.click();
}

function importCharacterData(data) {
    console.log('importCharacterData: начало импорта');
    console.log('importCharacterData: атаки=' + (data.attacks ? data.attacks.length : 0));
    console.log('importCharacterData: заклинания=' + (data.spells ? data.spells.length : 0));
    console.log('importCharacterData: инвентарь=' + (data.inventoryItems ? data.inventoryItems.length : 0));
    console.log('importCharacterData: способности=' + (data.features ? data.features.length : 0));
    console.log('importCharacterData: заметки=' + (data.notes ? data.notes.length : 0));
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
    state.charName = data.charName || "";
    state.charRace = data.charRace || "";
    state.hpHistory = data.hpHistory || [];

    if (data.classResources) state.classResources = data.classResources;

    if (data.stats) {
        state.stats = data.stats;
        document.getElementById('str').value = state.stats.str;
        document.getElementById('dex').value = state.stats.dex;
        document.getElementById('con').value = state.stats.con;
        document.getElementById('int').value = state.stats.int;
        document.getElementById('wis').value = state.stats.wis;
        document.getElementById('cha').value = state.stats.cha;
    }

    if (data.money) {
        state.money = data.money;
        document.getElementById('pp').value = state.money.pp;
        document.getElementById('gp').value = state.money.gp;
        document.getElementById('sp').value = state.money.sp;
        document.getElementById('cp').value = state.money.cp;
    }

    document.getElementById('profBonus').value = state.profBonus;
    document.getElementById('tempHp').value = state.tempHp;
    document.getElementById('charName').value = state.charName;
    document.getElementById('charRace').value = state.charRace;

    console.log('importCharacterData: вызов render-функций...');
    if (typeof updateExhaustionEffects === 'function') updateExhaustionEffects();
    if (typeof updateSpeedDisplay === 'function') updateSpeedDisplay();
    if (typeof updateMaxHp === 'function') updateMaxHp();
    if (typeof renderMulticlass === 'function') renderMulticlass();
    if (typeof renderSavingThrows === 'function') renderSavingThrows();
    if (typeof renderSkills === 'function') renderSkills();
    if (typeof renderInventory === 'function') { console.log('renderInventory...'); renderInventory(); }
    if (typeof renderSpells === 'function') { console.log('renderSpells...'); renderSpells(); }
    if (typeof renderSlots === 'function') renderSlots();
    if (typeof renderAttacks === 'function') { console.log('renderAttacks...'); renderAttacks(); }
    if (typeof renderFeatures === 'function') { console.log('renderFeatures...'); renderFeatures(); }
    if (typeof renderNotes === 'function') { console.log('renderNotes...'); renderNotes(); }
    if (typeof renderClassResource === 'function') renderClassResource();
    if (typeof updateUI === 'function') updateUI();
    console.log('importCharacterData: импорт завершён');
}

function triggerFileImport() {
    const tempBtn = document.createElement('button');
    tempBtn.style.display = 'none';
    document.body.appendChild(tempBtn);

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
                localStorage.removeItem(STORAGE_DATA_KEY);
                localStorage.removeItem('dnd_roll_history');
                importCharacterData(data);
                autoSave();
                addToLog('📀 Импортирован персонаж ' + (state.charName || 'Безымянный'));
                tempBtn.remove();
            } catch (err) {
                addToLog('❌ Ошибка импорта: ' + err.message);
                tempBtn.remove();
            }
        };
        reader.readAsText(file);
    };

    tempBtn.onclick = () => {
        input.click();
        tempBtn.remove();
    };
    tempBtn.click();
}

function resetAll() {
    if (confirm("Сбросить всё? ")) {
        localStorage.clear();
        location.reload();
    }
}
