// ============ СИСТЕМА ХИТОВ, ОТДЫХ, СПАСБРОСКИ СМЕРТИ ============
// Зависит от: state.js, ui-core.js, utils.js

function healHp() {
    let h = parseInt(prompt("Лечение: "));
    if (h > 0) {
        state.currentHp = Math.min(state.maxHp, state.currentHp + h);
        updateUI();
        addToLog('💚 +' + h + ' хп');
        autoSave();
    }
}

function dealDamage() {
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
        addToLog('💔 Получено ' + d + ' урона: ' + tempAbsorbed + ' поглощено временными хитами, ' + realDamage + ' снято с основных. Осталось временных: ' + state.tempHp + ', основных: ' + state.currentHp + '/' + state.maxHp);
        if (state.currentHp <= 0) addToLog('⚠️ Персонаж без сознания! Используйте спасброски от смерти.');
        autoSave();
    }
}

function setTempHp() {
    let newTemp = parseInt(document.getElementById('tempHp').value);
    if (!isNaN(newTemp) && newTemp >= 0) {
        state.tempHp = newTemp;
        document.getElementById('tempHp').value = state.tempHp;
        updateUI();
        addToLog('🛡️ Временные хиты установлены: ' + state.tempHp);
        autoSave();
    } else {
        addToLog('❌ Введите корректное значение');
    }
}

function clearTempHp() {
    state.tempHp = 0;
    document.getElementById('tempHp').value = 0;
    updateUI();
    addToLog('✨ Временные хиты сброшены');
    autoSave();
}

function shortRest() {
    addToLog('🛌 Короткий отдых');
}

function longRest() {
    let exhaustion = parseInt(document.getElementById('exhaustion')?.value) || 0;
    if (exhaustion > 0) {
        exhaustion--;
        document.getElementById('exhaustion').value = exhaustion;
        updateExhaustionEffects();
        addToLog('🌿 Долгий отдых: уровень истощения снижен до ' + exhaustion + '.');
    } else {
        addToLog(' Долгий отдых: здоровье и слоты восстановлены.');
    }
    state.currentHp = state.maxHp;
    state.tempHp = 0;
    state.spellSlots.forEach(s => s.current = s.max);
    state.deathSuccess = 0;
    state.deathFail = 0;
    document.getElementById('tempHp').value = 0;
    renderSlots();
    updateUI();
    autoSave();
}

function rollDeathSave() {
    let r = Math.floor(Math.random() * 20) + 1;
    if (r >= 10) {
        state.deathSuccess = Math.min(3, state.deathSuccess + 1);
        addToLog('✅ Спасбросок смерти: ' + r + ' (' + state.deathSuccess + '/3)');
        if (state.deathSuccess == 3) addToLog('✨ Стабилизирован');
    } else {
        state.deathFail = Math.min(3, state.deathFail + 1);
        addToLog('❌ Спасбросок смерти: ' + r + ' (' + state.deathFail + '/3)');
        if (state.deathFail === 3) addToLog('💀 Гибель');
    }
    updateUI();
    autoSave();
}

function resetDeathSaves() {
    state.deathSuccess = 0;
    state.deathFail = 0;
    updateUI();
    autoSave();
}

function rollInitiative() {
    let dexMod = getMod('dex');
    let bonus = parseInt(document.getElementById('initBonus')?.value) || 0;
    let totalBonus = dexMod + bonus;
    rollD20(totalBonus, "Инициатива", addToLog);
}

function setAc() {
    let v = parseInt(document.getElementById('acInput')?.value);
    if (!isNaN(v)) document.getElementById('acValue').innerText = v;
}
