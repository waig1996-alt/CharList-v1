// ============ СПАСБРОСКИ ============
// Зависит от: state.js, constants.js, ui-core.js, utils.js

function getCurrentClass() {
    return state.primaryClass || "fighter";
}

function isProficientSave(saveAttr) {
    return classSaves[getCurrentClass()]?.includes(saveAttr) || false;
}

function getSaveBonus(saveAttr) {
    let mod = getMod(saveAttr);
    if (isProficientSave(saveAttr)) mod += getProfBonus();
    let extra = state.extraSaveBonuses?.[saveAttr]?.bonus || 0;
    return mod + extra;
}

function renderSavingThrows() {
    let container = document.getElementById('savingThrowsContainer');
    if (!container) return;
    container.innerHTML = '';
    allStats.forEach(attr => {
        let isProf = isProficientSave(attr);
        let bonus = getSaveBonus(attr);
        let div = document.createElement('div');
        div.className = 'skill-row';
        div.innerHTML = '<span class="skill-name ' + (isProf ? 'proficient' : '') + '">' + (saveNames[attr]) + '</span> <span class="skill-bonus">' + ((bonus >= 0 ? '+' : '') + bonus) + '</span> <button class="save-roll dice" data-bonus="' + (bonus) + '">🎲</button>';
        container.appendChild(div);

        div.querySelector('.save-roll').onclick = () => {
            rollD20(bonus, 'Спасбросок ' + saveNames[attr].trim(), addToLog);
        };
    });
}
