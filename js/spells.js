// ============ ЗАКЛИНАНИЯ ============
// Зависит от: state.js, constants.js, ui-core.js, utils.js

function renderSlots() {
    let container = document.getElementById('slotsList');
    if (!container) return;
    container.innerHTML = '';
    state.spellSlots.forEach((slot, idx) => {
        let div = document.createElement('div');
        div.className = 'slot-row';
        div.innerHTML = '<strong>ЯЗ ' + (slot.level) + '</strong> <span>' + (slot.current) + '/' + (slot.max) + '</span> <button class="remove-slot remove-btn" data-idx="' + (idx) + '">🗑</button>';
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
    addToLog('🔮 Все ячейки заклинаний восстановлены!');
    autoSave();
}

function renderSpells() {
    let container = document.getElementById('spellsList');
    if (!container) return;
    container.innerHTML = '';
    state.spells.forEach((s, idx) => {
        let levelDisplay = s.level === 0 ? "Заговор" : 'ЯЗ ' + (s.level);
        let li = document.createElement('li');
        li.className = 'spell-item';
        li.innerHTML = '<div><strong>✨ ' + (s.name) + ' (' + (levelDisplay) + ')</strong> <span style="font-size:0.7rem;">' + (s.attr.toUpperCase()) + '</span> <button class="spell-cast-btn dice" data-idx="' + (idx) + '">🎲</button> <button class="spell-desc-btn remove-btn" data-idx="' + (idx) + '" style="background:#3a6b3a;">📖 Описание</button> <button class="remove-spell remove-btn" data-idx="' + (idx) + '">🗑</button></div>';
        container.appendChild(li);
    });

    document.querySelectorAll('.spell-cast-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            let idx = parseInt(btn.dataset.idx);
            if (state.spells[idx]) await castSpell(state.spells[idx]);
        };
    });

    document.querySelectorAll('.spell-desc-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            let idx = parseInt(btn.dataset.idx);
            let s = state.spells[idx];
            if (s) showSpellDescriptionModal(s);
        };
    });

    document.querySelectorAll('.remove-spell').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            state.spells.splice(idx, 1);
            renderSpells();
            autoSave();
            addToLog('🗑 Заклинание удалено');
        };
    });
}

async function castSpell(spell) {
    return new Promise((resolve) => {
        let spellAttr = spell.attr || 'wis';
        let attrMod = getMod(spellAttr);
        let profBonusVal = spell.proficient ? getProfBonus() : 0;
        let attackBonus = attrMod + profBonusVal;

        if (spell.level === 0) {
            rollD20Unified(attackBonus, 'Заговор: ' + spell.name, 'spell');
            if (spell.damage) rollDamage(spell.damage, addToLog, 'Урон: ' + (spell.name));
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
            availableSlotsHtml += '<option value="' + (i) + '" ' + ((i === spell.level ? 'selected' : '')) + '>' + (i) + ' уровень (' + (available) + '/' + (maxSlots) + ' доступно)</option>';
        }
        overlay.innerHTML = '<div class="custom-prompt"><h4>✨ ' + (spell.name) + '</h4><p>Базовый уровень: ' + (spell.level) + '</p><label>Выберите уровень ячейки:</label><select id="slotChoice">' + (availableSlotsHtml) + '</select><div id="extraDiceBlock" style="display:none;"><label>Разница: <span id="levelDiff">0</span></label><label>Доп. кубиков:</label><input type="number" id="extraDice" value="0" min="0" max="20"></div><div><button id="cancelCastBtn">Отмена</button><button id="confirmCastBtn">Применить</button></div></div>';
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
                addToLog('❌ Нет слотов ' + selectedLevel + ' уровня!');
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
                addToLog('🔮 Ячейка ' + selectedLevel + ' (+' + extraDice + ' кубиков)');
            } else if (levelDiff > 0) {
                finalDamage = upgradeDamage(spell.damage, levelDiff);
                addToLog('🔮 Ячейка ' + selectedLevel + ' (+' + levelDiff + ' кубиков)');
            } else {
                addToLog(' Ячейка ' + selectedLevel + ' уровня');
            }

            rollD20Unified(attackBonus, 'Заклинание: ' + spell.name, 'spell');
            if (finalDamage) rollDamage(finalDamage, addToLog, 'Урон: ' + (spell.name));

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
