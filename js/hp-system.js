// ============ СИСТЕМА ХИТОВ, ОТДЫХ, СПАСБРОСКИ СМЕРТИ ============
// Зависит от: state.js, ui-core.js, ability-scores.js, hit-points.js
//
// ПОСЛЕ РЕФАКТОРИНГА: бизнес-логика в HitPoints модели.
// Здесь — только UI-обвязка: prompt(), addToLog(), autoSave(), updateUI().

function healHp() {
    var h = parseInt(prompt("Лечение: "));
    if (h > 0) {
        var result = HitPoints.heal(h);
        HitPoints.syncDOM();
        updateUI();
        addToLog('💚 +' + result.healed + ' хп');
        autoSave();
    }
}

function dealDamage() {
    var d = parseInt(prompt("Урон:"));
    if (d > 0) {
        var result = HitPoints.damage(d);
        HitPoints.syncDOM();
        updateUI();

        addToLog(
            '💔 Получено ' + result.total + ' урона: ' +
            result.tempAbsorbed + ' поглощено временными хитами, ' +
            result.realDamage + ' снято с основных. ' +
            'Осталось временных: ' + state.tempHp +
            ', основных: ' + state.currentHp + '/' + state.maxHp
        );

        if (result.isUnconscious) {
            addToLog('⚠️ Персонаж без сознания! Используйте спасброски от смерти.');
        }
        autoSave();
    }
}

function setTempHp() {
    var newTemp = parseInt(document.getElementById('tempHp').value);
    if (!isNaN(newTemp) && newTemp >= 0) {
        HitPoints.setTemp(newTemp);
        updateUI();
        addToLog('🛡️ Временные хиты установлены: ' + state.tempHp);
        autoSave();
    } else {
        addToLog('❌ Введите корректное значение');
    }
}

function clearTempHp() {
    HitPoints.clearTemp();
    updateUI();
    addToLog('✨ Временные хиты сброшены');
    autoSave();
}

function shortRest() {
    HitPoints.shortRest();
    addToLog('🛌 Короткий отдых');
}

function longRest() {
    var result = HitPoints.longRest();
    updateExhaustionEffects();

    if (result.exhaustionReduced) {
        addToLog('🌿 Долгий отдых: уровень истощения снижен.');
    }
    addToLog('🏠 Долгий отдых: здоровье и слоты восстановлены.');

    // Восстановление ячеек заклинаний
    state.spellSlots.forEach(function (s) { s.current = s.max; });
    if (typeof renderSlots === 'function') renderSlots();

    HitPoints.syncDOM();
    updateUI();
    autoSave();
}

function rollDeathSave() {
    var result = HitPoints.rollDeathSave();

    if (result.isSuccess) {
        addToLog('✅ Спасбросок смерти: ' + result.roll + ' (' + result.successCount + '/3)');
        if (result.isStabilized) addToLog('✨ Стабилизирован');
    } else {
        addToLog('❌ Спасбросок смерти: ' + result.roll + ' (' + result.failCount + '/3)');
        if (result.isDead) addToLog('💀 Гибель');
    }

    HitPoints.syncDOM();
    updateUI();
    autoSave();
}

function resetDeathSaves() {
    HitPoints.resetDeathSaves();
    HitPoints.syncDOM();
    updateUI();
    autoSave();
}

function rollInitiative() {
    var dexMod = AbilityScores.modifier('dex');
    var bonus = parseInt(document.getElementById('initBonus')?.value) || 0;
    var totalBonus = dexMod + bonus;
    rollD20(totalBonus, "Инициатива", addToLog);
}

function setAc() {
    var v = parseInt(document.getElementById('acInput')?.value);
    if (!isNaN(v)) document.getElementById('acValue').innerText = v;
}
