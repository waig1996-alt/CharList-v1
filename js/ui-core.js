// ============ БАЗОВЫЕ UI-ФУНКЦИИ ============
// Зависит от: state.js, constants.js, utils.js

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
    // autoSave вызывается после лога, если доступна
    if (typeof autoSave === 'function') autoSave();
}

function updateUI() {
    let effective = state.currentHp + state.tempHp;
    const currentHpEl = document.getElementById('currentHp');
    if (currentHpEl) currentHpEl.innerHTML = (effective) + '<span style="font-size:0.7rem;">(+' + (state.tempHp) + ' вр.)</span>';

    const maxHpEl = document.getElementById('maxHp');
    if (maxHpEl) maxHpEl.innerText = state.maxHp;

    const deathSuccessEl = document.getElementById('deathSuccess');
    if (deathSuccessEl) deathSuccessEl.innerText = state.deathSuccess;

    const deathFailEl = document.getElementById('deathFail');
    if (deathFailEl) deathFailEl.innerText = state.deathFail;

    const acValueEl = document.getElementById('acValue');
    const acInputEl = document.getElementById('acInput');
    if (acValueEl && acInputEl) acValueEl.innerText = acInputEl.value;

    // Обновление модификаторов характеристик
    allStats.forEach(stat => {
        const inputEl = document.getElementById(stat);
        const spanEl = document.getElementById(stat + 'Mod');
        if (inputEl && spanEl) {
            let val = parseInt(inputEl.value) || 10;
            let mod = Math.floor((val - 10) / 2);
            spanEl.innerText = (mod >= 0 ? '+' : '') + mod;
        }
    });

    // Обновить информацию о расе
    if (typeof updateRaceDisplay === 'function') {
        updateRaceDisplay();
    }
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

    if (state.maxHp !== newMaxHp && !state.manualHpEnabled) {
        let oldMax = state.maxHp;
        state.maxHp = newMaxHp;
        if (state.currentHp > state.maxHp) state.currentHp = state.maxHp;
        const logMsg = '📊 Максимальные хиты изменены (истощение): ' + (oldMax) + ' → ' + (state.maxHp);
        if (typeof addToLog === 'function') addToLog(logMsg);
    }
    updateUI();
}

// ============ МОДАЛЬНОЕ ОКНО ОПИСАНИЯ ЗАКЛИНАНИЯ ============
function showSpellDescriptionModal(spell) {
    let modal = document.getElementById('spellDescModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'spellDescModal';
        modal.className = 'modal-overlay';
        modal.innerHTML =
            '<div class="modal-content" style="max-width: 500px;">' +
            '<h3 id="spellDescTitle">✨ Название</h3>' +
            '<div id="spellDescDetails" style="margin: 10px 0; padding: 8px; background: var(--stat-bg); border-radius: 16px;"></div>' +
            '<p id="spellDescText" style="white-space: pre-wrap; margin: 10px 0;"></p>' +
            '<button id="closeSpellDescBtn" style="margin-top: 10px;">Закрыть</button>' +
            '</div>';

        document.body.appendChild(modal);

        // Используем querySelector внутри modal, а не getElementById
        modal.querySelector('#closeSpellDescBtn').onclick = () => {
            modal.style.display = 'none';
        };

        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }

    // Используем querySelector внутри modal
    modal.querySelector('#spellDescTitle').innerHTML = '✨ ' + spell.name;
    modal.querySelector('#spellDescDetails').innerHTML =
        '<strong>Уровень:</strong> ' + (spell.level === 0 ? 'Заговор' : spell.level) + '<br>' +
        '<strong>Атрибут:</strong> ' + spell.attr.toUpperCase() + '<br>' +
        '<strong>Владение:</strong> ' + (spell.proficient ? 'да' : 'нет') + '<br>' +
        '<strong>Урон:</strong> ' + (spell.damage || '—');
    modal.querySelector('#spellDescText').innerHTML = spell.desc || 'Нет описания';

    modal.style.display = 'flex';
}

// ============ МОДАЛЬНОЕ ОКНО ЗАМЕТКИ ============
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
            if (typeof renderNotes === 'function') renderNotes();
            if (typeof autoSave === 'function') autoSave();
            if (typeof addToLog === 'function') addToLog('✏️ Заметка "' + (newTitle) + '" обновлена.');
            closeModal();
        } else {
            alert('Заголовок не может быть пустым!');
        }
    };
    closeBtn.onclick = closeModal;
    modalOverlay.onclick = (e) => { if (e.target === modalOverlay) closeModal(); };
}

// ============ УСИЛЕНИЕ УРОНА ЗАКЛИНАНИЯ ============
function upgradeDamage(damageStr, extraDice) {
    let parsed = parseDamage(damageStr);
    if (!parsed) return damageStr;
    let newCount = parsed.count + extraDice;
    return (newCount) + 'к' + (parsed.sides) + (parsed.mod >= 0 ? '+' + parsed.mod : parsed.mod);
}
