// ============ ЕДИНЫЙ ДВИЖОК БРОСКОВ ============
// Использует dice-roller.js для отображения результатов
// Принимает бонусы из характеристик, навыков, атак, заклинаний

// ============ БРОСОК D20 (атака, спасбросок, навык) ============
function rollD20Unified(bonus, label, source) {
    // source: 'attack', 'save', 'skill', 'spell', 'initiative', 'death', 'custom'

    let die = Math.floor(Math.random() * 20) + 1;
    let roll = die + bonus;
    let isCrit = (die === 20);
    let isFail = (die === 1);

    let formulaText = '(' + die + ')';
    if (bonus !== 0) {
        formulaText += ' ' + (bonus > 0 ? '+' : '') + bonus;
    }

    let subText = '(1d20)';
    if (bonus !== 0) {
        subText += ' ' + (bonus > 0 ? '+' : '') + bonus;
    }

    // Формируем данные для dice-roller.js
    let title = label || 'Бросок d20';
    let resultText = roll;
    let critText = isCrit ? 'КРИТИЧЕСКИЙ УСПЕХ!' : (isFail ? 'КРИТИЧЕСКИЙ ПРОВАЛ!' : '');

    // Показываем в модальном окне dice-roller
    console.log('rollD20Unified: die=' + die + ' bonus=' + bonus + ' formulaText=' + formulaText + ' subText=' + subText + ' result=' + resultText);
    showRollModal(title, formulaText, subText, resultText, isCrit, isFail);

    // Логируем в журнал действий
    let logStyle = isCrit ? 'color: #4ade80; font-weight: bold;' : 
                   (isFail ? 'color: #f87171; font-weight: bold;' : '');

    if (isCrit) {
        addToLog('🎲 ' + label + ': ★ КРИТИЧЕСКИЙ УСПЕХ! ★ (' + die + (bonus >= 0 ? '+' + bonus : bonus) + '=' + roll + ')', logStyle);
    } else if (isFail) {
        addToLog('🎲 ' + label + ': 💀 КРИТИЧЕСКИЙ ПРОВАЛ! 💀 (' + die + (bonus >= 0 ? '+' + bonus : bonus) + '=' + roll + ')', logStyle);
    } else {
        addToLog('🎲 ' + label + ': ' + die + (bonus >= 0 ? '+' + bonus : bonus) + '=' + roll, logStyle);
    }

    // Добавляем в историю dice-roller
    if (typeof addRollToHistory === 'function') {
        addRollToHistory({
            title: title,
            total: roll,
            details: [{ label: 'd20', rolls: [die] }],
            isCrit: isCrit,
            isFail: isFail,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    }

    return { die: die, roll: roll, isCrit: isCrit, isFail: isFail };
}

// ============ БРОСОК УРОНА ============
function rollDamageUnified(damageStr, label, source) {
    // source: 'attack', 'spell', 'custom'

    let parsed = parseDamage(damageStr);
    if (!parsed) {
        addToLog('❌ ' + damageStr + ' не распознано');
        return null;
    }

    let rolls = [];
    let total = 0;
    let detailsForHistory = [];
    let html = '';

    for (let i = 0; i < parsed.count; i++) {
        let r = Math.floor(Math.random() * parsed.sides) + 1;
        rolls.push(r);
        total += r;
    }
    total += parsed.mod;

    let formulaText = '[' + rolls.join(', ') + ']' + (parsed.mod >= 0 ? '+' + parsed.mod : parsed.mod);
    let subText = parsed.count + 'd' + parsed.sides + (parsed.mod >= 0 ? '+' + parsed.mod : parsed.mod);

    // Добавляем в историю dice-roller
    if (typeof addRollToHistory === 'function') {
        addRollToHistory({
            title: label || 'Урон',
            total: total,
            details: [{ label: 'd' + parsed.sides + 'x' + parsed.count, rolls: rolls }],
            isCrit: false,
            isFail: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    }

    // Логируем
    addToLog('🎲 Урон: ' + rolls.join('+') + (parsed.mod >= 0 ? '+' + parsed.mod : parsed.mod) + '=' + total);

    // Показываем в модальном окне
    showRollModal(label || 'Урон', formulaText, subText, total, false, false);

    return { rolls: rolls, total: total };
}

// ============ МОДАЛЬНОЕ ОКНО РЕЗУЛЬТАТА (совместимое с dice-roller.css) ============
function showRollModal(title, formulaMain, formulaSub, result, isCrit, isFail) {
    let modal = document.getElementById('rollResultModal');

    // Если модалка существует, но без нужных id — удаляем и создаём заново
    if (modal) {
        let testEl = document.getElementById('rollModalResult');
        if (!testEl) {
            console.log('showRollModal: modal exists but NO id elements found, removing...');
            modal.remove();
            modal = null;
        }
    }

    if (!modal) {
        // Создаём модалку через DOM-методы (не innerHTML)
        modal = document.createElement('div');
        modal.id = 'rollResultModal';
        modal.className = 'roll-modal-overlay';

        let content = document.createElement('div');
        content.className = 'roll-modal-content';

        let badge = document.createElement('div');
        badge.className = 'roll-badge';
        badge.textContent = 'БРОСОК';

        let titleEl = document.createElement('div');
        titleEl.className = 'roll-title';
        titleEl.id = 'rollModalTitle';
        titleEl.textContent = 'СПАСБРОСОК';

        let details = document.createElement('div');
        details.className = 'roll-details';

        let formula = document.createElement('div');
        formula.className = 'roll-formula';

        let mainEl = document.createElement('span');
        mainEl.className = 'roll-main';
        mainEl.id = 'rollModalMain';
        mainEl.textContent = '(13) + 2';

        let subEl = document.createElement('span');
        subEl.className = 'roll-sub';
        subEl.id = 'rollModalSub';
        subEl.textContent = '(1d20) + 2';

        formula.appendChild(mainEl);
        formula.appendChild(subEl);
        details.appendChild(formula);

        let resultEl = document.createElement('div');
        resultEl.className = 'roll-result';
        resultEl.id = 'rollModalResult';
        resultEl.textContent = '15';
        details.appendChild(resultEl);

        let closeBtn = document.createElement('button');
        closeBtn.className = 'roll-close-btn';
        closeBtn.textContent = '×';
        closeBtn.onclick = closeRollModal;

        content.appendChild(badge);
        content.appendChild(titleEl);
        content.appendChild(details);
        content.appendChild(closeBtn);
        modal.appendChild(content);

        document.body.appendChild(modal);
    }

    // Используем document.getElementById
    let titleEl = document.getElementById('rollModalTitle');
    let mainEl = document.getElementById('rollModalMain');
    let subEl = document.getElementById('rollModalSub');
    let resultEl = document.getElementById('rollModalResult');


    console.log('showRollModal: setting title=' + title + ' main=' + formulaMain + ' sub=' + formulaSub + ' result=' + result);
    if (titleEl) titleEl.textContent = String(title);
    if (mainEl) mainEl.textContent = String(formulaMain);
    if (subEl) subEl.textContent = String(formulaSub);
    if (resultEl) resultEl.textContent = String(result);
    console.log('showRollModal: after set, resultEl.textContent=' + (resultEl ? resultEl.textContent : 'null'));

    if (resultEl) {
        if (isCrit) {
            resultEl.style.color = '#4ade80';
            resultEl.style.textShadow = '0 0 20px #4ade80';
        } else if (isFail) {
            resultEl.style.color = '#f87171';
            resultEl.style.textShadow = '0 0 20px #f87171';
        } else {
            resultEl.style.color = '';
            resultEl.style.textShadow = '';
        }
    }

    modal.style.display = 'flex';
}

function closeRollModal() {
    let modal = document.getElementById('rollResultModal');
    if (modal) modal.style.display = 'none';
}

// ============ УТИЛИТЫ ============
function getProfBonus() {
    return state.profBonus || 2;
}

function getMod(attr) {
    let el = document.getElementById(attr);
    if (!el) return 0;
    let val = parseInt(el.value) || 10;
    return Math.floor((val - 10) / 2);
}

function parseDamage(damageStr) {
    if (!damageStr) return null;
    let match = damageStr.match(/(\d+)к(\d+)([+-]\d+)?/i);
    if (!match) match = damageStr.match(/(\d+)d(\d+)([+-]\d+)?/i);
    if (!match) return null;
    return {
        count: parseInt(match[1]),
        sides: parseInt(match[2]),
        mod: match[3] ? parseInt(match[3]) : 0
    };
}
