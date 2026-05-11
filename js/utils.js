// Глобальные функции
function getMod(statId) {
    let v = parseInt(document.getElementById(statId).value) || 10;
    return Math.floor((v - 10) / 2);
}

function getProfBonus() {
    return parseInt(document.getElementById('profBonus').value) || 2;
}

function parseDamage(damageStr) {
    if (!damageStr) return null;
    let m = damageStr.toLowerCase().replace(/к/g, 'd').match(/(\d*)d(\d+)([+-]\d+)?/);
    if (!m) return null;
    return {
        count: m[1] === '' ? 1 : parseInt(m[1]),
        sides: parseInt(m[2]),
        mod: m[3] ? parseInt(m[3]) : 0
    };
}

// Показывает модальное окно с результатом
function showRollResultModal(title, total, dieResult, bonus, diceNotation) {
    const modal = document.getElementById('rollResultModal');
    if (!modal) return;

    modal.querySelector('.roll-title').textContent = title.toUpperCase();
    modal.querySelector('.roll-result').textContent = total;
    
    let formulaText = '(' + dieResult + ')';
    if (bonus !== undefined && bonus !== 0) {
        formulaText += ' ' + (bonus > 0 ? '+' : '') + bonus;
    }
    modal.querySelector('.roll-main').textContent = formulaText;

    let subText = '(' + diceNotation + ')';
    if (bonus !== undefined && bonus !== 0) {
        subText += ' ' + (bonus > 0 ? '+' : '') + bonus;
    }
    modal.querySelector('.roll-sub').textContent = subText;

    const badge = modal.querySelector('.roll-badge');
    badge.style.color = "#e6b87e";
    
    if (diceNotation && (diceNotation.includes('20') || diceNotation.includes('d20') || diceNotation.includes('к20'))) {
        if (typeof dieResult === 'number' && dieResult === 20) {
             badge.textContent = "КРИТ!";
             badge.style.color = "#ff4444";
        } else if (typeof dieResult === 'number' && dieResult === 1) {
             badge.textContent = "КРИТ ПРОМАХ";
             badge.style.color = "#ff4444";
        } else {
             badge.textContent = "БРОСОК";
        }
    } else {
        badge.textContent = title.toLowerCase().includes("урон") ? "УРОН" : "РЕЗУЛЬТАТ";
    }

    modal.style.display = 'flex';
}

function closeRollModal() {
    const modal = document.getElementById('rollResultModal');
    if (modal) modal.style.display = 'none';
}

function rollDamage(damageStr, addToLogCallback, title = "Урон") {
    let parsed = parseDamage(damageStr);
    if (!parsed) {
        addToLogCallback('❌ ' + damageStr + ' не распознано');
        return null;
    }
    let totalDice = 0, rolls = [];
    for (let i = 0; i < parsed.count; i++) {
        let r = Math.floor(Math.random() * parsed.sides) + 1;
        rolls.push(r);
        totalDice += r;
    }
    let total = totalDice + parsed.mod;
    
    // Модалка отключена — только лог
    addToLogCallback('🎲 Урон: ' + rolls.join('+') + (parsed.mod >= 0 ? '+' + parsed.mod : parsed.mod) + '=' + total);
    return total;
}

function rollD20(bonus, label, addToLogCallback) {
    let die = Math.floor(Math.random() * 20) + 1;
    
    let roll;
    let isCritSuccess = (die === 20);
    let isCritFail = (die === 1);
    
    if (isCritFail) {
        roll = die + bonus; // Всё равно считаем для отображения
    } else if (isCritSuccess) {
        roll = die + bonus;
    } else {
        roll = die + bonus;
    }
    
    // Для модального окна показываем реальное значение
    let displayRoll = die + bonus;
    showRollResultModal(label, displayRoll, die, bonus, "1к20");
    
    if (isCritSuccess) {
        addToLogCallback('🎲 ' + label + ': ★ КРИТИЧЕСКИЙ УСПЕХ! ★ (' + die + (bonus >= 0 ? '+' + bonus : bonus) + '=' + (die + bonus) + ')', 'color: #4ade80; font-weight: bold;');
    } else if (isCritFail) {
        addToLogCallback('🎲 ' + label + ': 💀 КРИТИЧЕСКИЙ ПРОВАЛ! 💀 (' + die + (bonus >= 0 ? '+' + bonus : bonus) + '=' + (die + bonus) + ')', 'color: #f87171; font-weight: bold;');
    } else {
        addToLogCallback('🎲 ' + label + ': ' + die + (bonus >= 0 ? '+' + bonus : bonus) + '=' + roll);
    }
    
    return roll;
}