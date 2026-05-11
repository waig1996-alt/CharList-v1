// ============ МУЛЬТИКЛАССЫ ============
// Зависит от: state.js, constants.js, ui-core.js, utils.js

function recalcTotalLevel() {
    let total = state.multClasses.reduce((sum, cls) => sum + cls.level, 0);
    document.getElementById('totalLevel').innerText = total;
    return total;
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
    addToLog('🎉 Уровень ' + classNames[cls.className] + ' повышен до ' + cls.level + '. Бросок к' + diceVal + '=' + roll + ', +' + conMod + ' CON = +' + gainedTotal + ' хп. Теперь ' + state.currentHp + '/' + state.maxHp + ' хп.');
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
        let selectHtml = '<select class="class-select" data-idx="' + (idx) + '">';
        for (let opt of classOptionsList) {
            let selected = (cls.className === opt.value) ? 'selected' : '';
            selectHtml += '<option value="' + (opt.value) + '" ' + (selected) + '>' + (opt.name) + '</option>';
        }
        selectHtml += '</select>';
        div.innerHTML = (selectHtml) + ' <span>Уровень: <input type="number" class="class-level" data-idx="' + (idx) + '" value="' + (cls.level) + '" min="1" style="width:60px;"></span> <span>Кость хитов: <select class="class-hd" data-idx="' + (idx) + '" style="width:70px;"> <option value="6" ' + (cls.hitDice === 6 ? 'selected' : '') + '>к6</option> <option value="8" ' + (cls.hitDice === 8 ? 'selected' : '') + '>к8</option> <option value="10" ' + (cls.hitDice === 10 ? 'selected' : '') + '>к10</option> <option value="12" ' + (cls.hitDice === 12 ? 'selected' : '') + '>к12</option> </select></span> <button class="remove-class-btn" data-idx="' + (idx) + '">🗑</button>';
        container.appendChild(div);
    });

    document.querySelectorAll('.class-select').forEach(sel => {
        sel.onchange = () => {
            let idx = parseInt(sel.dataset.idx);
            state.multClasses[idx].className = sel.value;
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
                renderMulticlass();
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
