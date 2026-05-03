// ===== ГЛОБАЛЬНОЕ СОСТОЯНИЕ ДЛЯ БРОСКОВ =====
window.currentDiceSelection = { 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 0, 100: 0 };
window.rollHistory = [];

// ===== УПРАВЛЕНИЕ ПАНЕЛЯМИ =====
function toggleDiceSelector() {
    const selector = document.getElementById('diceSelector');
    if (!selector) return;
    if (selector.style.display === 'flex') {
        closeDiceSelector();
    } else {
        selector.style.display = 'flex';
    }
}

function closeDiceSelector() {
    const selector = document.getElementById('diceSelector');
    if (selector) selector.style.display = 'none';
}

function closeDiceResults() {
    const results = document.getElementById('diceResults');
    if (results) results.style.display = 'none';
}

function closeRollHistory() {
    const history = document.getElementById('rollHistoryPanel');
    if (history) history.style.display = 'none';
}

// ===== ЛОГИКА ВЫБОРА КУБИКОВ =====
function incrementDiceCount(sides) {
    if (!window.currentDiceSelection[sides] && window.currentDiceSelection[sides] !== 0) {
        window.currentDiceSelection[sides] = 0;
    }
    window.currentDiceSelection[sides]++;
    if (window.currentDiceSelection[sides] > 20) {
        window.currentDiceSelection[sides] = 0;
    }
    updateDiceDisplay(sides);
}

function updateDiceDisplay(sides) {
    const badge = document.getElementById(`badgeD${sides}`);
    if (badge) {
        badge.textContent = window.currentDiceSelection[sides];
    }
    const row = document.querySelector(`.dice-option[data-sides="${sides}"]`);
    if (row) {
        if (window.currentDiceSelection[sides] > 0) {
            row.classList.add('active');
        } else {
            row.classList.remove('active');
        }
    }
}

function updateDiceBadges() {
    Object.keys(window.currentDiceSelection).forEach(sides => {
        const badge = document.getElementById(`badgeD${sides}`);
        if (badge) badge.textContent = window.currentDiceSelection[sides];
        
        const row = document.querySelector(`.dice-option[data-sides="${sides}"]`);
        if (row) {
            if (window.currentDiceSelection[sides] > 0) {
                row.classList.add('active');
            } else {
                row.classList.remove('active');
            }
        }
    });
}

// ===== СБРОС (ИСПРАВЛЕНО) =====
function resetDiceSelector() {
    // 1. Обнуляем значения в памяти
    for (let key in window.currentDiceSelection) {
        window.currentDiceSelection[key] = 0;
    }
    // 2. Обновляем UI (цифры и убираем фиолетовую подсветку)
    updateDiceBadges();
    // 3. Скрываем панель
    const selector = document.getElementById('diceSelector');
    if (selector) selector.style.display = 'none';
}

// ===== БРОСОК КУБИКОВ =====
function performDiceRoll() {
    const diceTypes = [
        { sides: 4, count: window.currentDiceSelection[4] || 0 },
        { sides: 6, count: window.currentDiceSelection[6] || 0 },
        { sides: 8, count: window.currentDiceSelection[8] || 0 },
        { sides: 10, count: window.currentDiceSelection[10] || 0 },
        { sides: 12, count: window.currentDiceSelection[12] || 0 },
        { sides: 20, count: window.currentDiceSelection[20] || 0 },
        { sides: 100, count: window.currentDiceSelection[100] || 0 }
    ];

    let html = '';
    let grandTotal = 0;
    let hasDice = false;
    let allRollsSummary = [];
    let detailsForHistory = [];

    diceTypes.forEach(die => {
        if (die.count > 0) {
            hasDice = true;
            let rolls = [];
            let typeTotal = 0;
            
            for (let i = 0; i < die.count; i++) {
                let r = Math.floor(Math.random() * die.sides) + 1;
                rolls.push(r);
                typeTotal += r;
            }
            
            grandTotal += typeTotal;
            
            let isCrit = die.sides === 20 && die.count === 1 && rolls[0] === 20;
            let isFail = die.sides === 20 && die.count === 1 && rolls[0] === 1;
            let status = isCrit ? '<span class="crit-text">⭐ КРИТ!</span>' : (isFail ? '<span class="fail-text"> ПРОВАЛ</span>' : '');
            
            html += `
                <div class="result-item">
                    <div class="result-header">
                        <span>D${die.sides} × ${die.count}</span>
                        <span>${status}</span>
                    </div>
                    <div class="result-values">[${rolls.join(', ')}] = ${typeTotal}</div>
                </div>
            `;
            
            allRollsSummary.push({
                title: `D${die.sides} × ${die.count}`,
                detail: `[${rolls.join(', ')}]`,
                result: typeTotal,
                isCrit, isFail
            });
            
            detailsForHistory.push({ label: `D${die.sides}x${die.count}`, rolls: rolls });
        }
    });

    if (!hasDice) {
        alert("Выберите хотя бы один кубик!");
        return;
    }

    html += `<div class="result-total">ИТОГО: ${grandTotal}</div>`;

    const contentDiv = document.getElementById('diceResultsContent');
    if (contentDiv) contentDiv.innerHTML = html;

    const resultsPanel = document.getElementById('diceResults');
    if (resultsPanel) resultsPanel.style.display = 'flex';

    // Скрываем панель выбора
    closeDiceSelector();

    // Добавляем в историю
    if (allRollsSummary.length === 1) {
        addRollToHistory({
            title: allRollsSummary[0].title,
            total: allRollsSummary[0].result,
            details: detailsForHistory,
            isCrit: allRollsSummary[0].isCrit,
            isFail: allRollsSummary[0].isFail,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    } else { 
        addRollToHistory({
            title: 'Смешанный бросок',
            total: grandTotal,
            details: detailsForHistory,
            isCrit: false,
            isFail: false,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    }

    // === ВАЖНО: Сбрасываем всё после броска ===
    resetDiceSelector();

    // Автозакрытие через 10 секунд
    setTimeout(() => {
        if (resultsPanel) resultsPanel.style.display = 'none';
    }, 10000);
}

// ===== ИСТОРИЯ БРОСКОВ =====
function addRollToHistory(entryData) {
    window.rollHistory.unshift(entryData);
    if (window.rollHistory.length > 50) window.rollHistory.pop();
    renderHistory();
    localStorage.setItem('dnd_roll_history', JSON.stringify(window.rollHistory));
}

function renderHistory() {
    const container = document.getElementById('rollHistoryContent');
    if (!container) return;
    if (!window.rollHistory || window.rollHistory.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">История пуста</div>';
        return;
    }

    container.innerHTML = window.rollHistory.map(item => {
        let detailsHtml = '';
        if (item.details && item.details.length > 0) {
            detailsHtml = `<div class="history-detail-list">
                ${item.details.map(d => `<span class="history-dice-group">${d.label} [${d.rolls.join(', ')}]</span>`).join('; ')}
            </div>`;
        }
        let statusClass = ''; let statusIcon = '';
        if (item.isCrit) { statusClass = 'crit'; statusIcon = ' ⭐'; }
        if (item.isFail) { statusClass = 'fail'; statusIcon = ' 💀'; }

        return `
            <div class="history-item ${statusClass}">
                <div class="history-info">
                    <span class="history-title">${item.title}${statusIcon}</span>
                    ${detailsHtml}
                </div>
                <div class="history-result">${item.total}</div>
            </div>
        `;
    }).join('');
}

function clearHistory() {
    if (confirm('Очистить историю бросков?')) {
        window.rollHistory = [];
        renderHistory();
        localStorage.setItem('dnd_roll_history', JSON.stringify([]));
    }
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    const savedHistory = localStorage.getItem('dnd_roll_history');
    if (savedHistory) {
        try { window.rollHistory = JSON.parse(savedHistory); } catch (e) { window.rollHistory = []; }
    }
    renderHistory();
    
    const openBtn = document.getElementById('openDiceRoller');
    const historyBtn = document.getElementById('openRollHistory');
    const selector = document.getElementById('diceSelector');
    const historyPanel = document.getElementById('rollHistoryPanel');
    const rollBtn = document.getElementById('performRoll');
    const closeSelectorBtn = document.getElementById('closeDiceSelector');
    const closeResultsBtn = document.getElementById('closeDiceResults');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    if (openBtn) openBtn.addEventListener('click', toggleDiceSelector);
    if (historyBtn) historyBtn.addEventListener('click', () => {
        if (historyPanel) {
            historyPanel.style.display = historyPanel.style.display === 'flex' ? 'none' : 'flex';
            renderHistory();
        }
    });

    if (closeSelectorBtn) closeSelectorBtn.addEventListener('click', closeDiceSelector);
    if (closeResultsBtn) closeResultsBtn.addEventListener('click', closeDiceResults);
    if (closeHistoryBtn) closeHistoryBtn.addEventListener('click', closeRollHistory);
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);
    if (rollBtn) rollBtn.addEventListener('click', performDiceRoll);

    document.addEventListener('click', (e) => {
        if (selector && selector.style.display === 'flex' && !selector.contains(e.target) && e.target !== openBtn) {
            selector.style.display = 'none';
        }
        if (historyPanel && historyPanel.style.display === 'flex' && !historyPanel.contains(e.target) && e.target !== historyBtn) {
            historyPanel.style.display = 'none';
        }
    });
});