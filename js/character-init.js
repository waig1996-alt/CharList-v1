// ============ ИНИЦИАЛИЗАЦИЯ ПЕРСОНАЖА ============
// Зависит от: state.js, constants.js, ui-core.js, utils.js

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

async function initNewCharacter() {
    const selectedClass = await showClassSelectionModal();
    state.primaryClass = selectedClass;

    let hitDice = getHitDiceByClass(selectedClass);
    state.multClasses = [{ className: selectedClass, level: 1, hitDice: hitDice }];

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

    if (defaultResources[selectedClass]) {
        state.classResources[selectedClass].current = defaultResources[selectedClass].current;
        state.classResources[selectedClass].max = defaultResources[selectedClass].max;
    }

    state.manualHpEnabled = true;
    document.getElementById('manualHpCheckbox').checked = true;
    document.getElementById('maxHpInput').disabled = false;

    let conMod = getMod('con');
    state.maxHp = hitDice + (conMod > 0 ? conMod : 0);
    state.currentHp = state.maxHp;
    state.hpHistory = [];

    if (typeof renderMulticlass === 'function') renderMulticlass();
    if (typeof renderSavingThrows === 'function') renderSavingThrows();
    if (typeof renderClassResource === 'function') renderClassResource();
    if (typeof updateUI === 'function') updateUI();
    if (typeof addToLog === 'function') addToLog('🎉 Создан персонаж класса ' + classNames[selectedClass]);
    if (typeof autoSave === 'function') autoSave();

    const maxHpInput = document.getElementById('maxHpInput');
    if (maxHpInput) maxHpInput.value = state.maxHp;
}
