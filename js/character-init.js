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

    // Сброс всех классовых ресурсов к начальным значениям
    // (значения берутся из ClassResourceRegistry — единственный источник истины)
    resetAllClassResources();

    state.manualHpEnabled = true;
    document.getElementById('manualHpCheckbox').checked = true;
    document.getElementById('maxHpInput').disabled = false;

    let conMod = getMod('con');
    state.maxHp = hitDice + (conMod > 0 ? conMod : 0);
    state.currentHp = state.maxHp;
    state.hpHistory = [];

    if (typeof addToLog === 'function') addToLog('🎉 Создан персонаж класса ' + classNames[selectedClass]);
    if (typeof autoSave === 'function') autoSave();

    // Рендер после инициализации (через координатор View)
    CharacterSheetView.renderAfterInit();

    const maxHpInput = document.getElementById('maxHpInput');
    if (maxHpInput) maxHpInput.value = state.maxHp;
}
