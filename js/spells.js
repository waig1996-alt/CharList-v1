// ============ ЗАКЛИНАНИЯ ============
// Зависит от: state.js, constants.js, ui-core.js, utils.js, spell-slots-tables.js

/**
 * Инициализировать ячейки заклинаний для класса при его добавлении
 * @param {string} className - название класса
 * @param {number} classLevel - уровень класса
 */
function initializeSpellSlots(className, classLevel) {
    if (!isSpellcaster(className)) return;
    
    const slots = getSpellSlotsForClass(className, classLevel);
    
    // Добавить только новые уровни ячеек
    slots.forEach(newSlot => {
        const existing = state.spellSlots.find(s => s.level === newSlot.level);
        if (!existing) {
            state.spellSlots.push({ ...newSlot });
        }
    });
}

/**
 * Пересчитать ячейки после изменения класса или уровня
 */
function recalculateSpellSlots() {
    const casterClasses = state.multClasses.filter(mc => isSpellcaster(mc.className));
    
    if (casterClasses.length === 0) {
        state.spellSlots = [];
        return;
    }
    
    // Проверить группу кастера
    const group = getSpellcasterGroup(casterClasses[0].className);
    
    if (group === "SPECIAL") {
        // Колдун или монах - особая логика
        handleSpecialCasters(casterClasses);
    } else if (casterClasses.length === 1) {
        // Один класс
        const slots = getSpellSlotsForClass(casterClasses[0].className, casterClasses[0].level);
        state.spellSlots = slots.map(s => ({ ...s }));
    } else {
        // Мультикласс
        state.spellSlots = mergeMulticlassSlots(casterClasses);
    }
}

/**
 * Обработать специальных кастеров (колдун, монах)
 * @param {array} casterClasses - классы кастеров
 */
function handleSpecialCasters(casterClasses) {
    casterClasses.forEach(mc => {
        if (mc.className === "warlock") {
            // Колдун - свои ячейки заклинаний
            const slots = getSpellSlotsForClass("warlock", mc.level);
            state.spellSlots = slots.map(s => ({ ...s, isWarlock: true }));
        } else if (mc.className === "monk") {
            // Монах - вообще не кастер, но может быть особая логика
            // Оставляем пустым
            state.spellSlots = [];
        }
    });
}

/**
 * Отобразить ячейки заклинаний
 */
function renderSlots() {
    let container = document.getElementById('slotsList');
    if (!container) return;
    container.innerHTML = '';
    
    if (state.spellSlots.length === 0) {
        container.innerHTML = '<div style="opacity: 0.6; font-size: 0.9rem;">Ваш класс не использует ячейки заклинаний</div>';
        return;
    }
    
    state.spellSlots.forEach((slot, idx) => {
        let div = document.createElement('div');
        div.className = 'slot-row';
        let levelName = slot.level === 0 ? 'Заговоры' : 'ЯЗ ' + slot.level;
        let isWarlock = slot.isWarlock ? ' (Колдун)' : '';
        
        div.innerHTML = 
            '<div style="display: flex; align-items: center; gap: 10px; justify-content: space-between;">' +
            '<div><strong>' + levelName + isWarlock + '</strong></div>' +
            '<div style="display: flex; align-items: center; gap: 5px;">' +
            '<input type="number" class="slot-current" data-idx="' + idx + '" min="0" max="' + slot.max + '" value="' + slot.current + '" style="width: 40px;"> / ' +
            '<strong>' + slot.max + '</strong>' +
            '</div>' +
            '<button class="remove-slot remove-btn" data-idx="' + idx + '">🗑</button>' +
            '</div>';
        container.appendChild(div);
    });

    // Обновление ячеек
    document.querySelectorAll('.slot-current').forEach(input => {
        input.addEventListener('change', (e) => {
            let idx = parseInt(e.target.dataset.idx);
            state.spellSlots[idx].current = Math.max(0, Math.min(state.spellSlots[idx].max, parseInt(e.target.value) || 0));
            renderSlots();
            autoSave();
        });
    });

    // Удаление ячейки
    document.querySelectorAll('.remove-slot').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            state.spellSlots.splice(idx, 1);
            renderSlots();
            autoSave();
        };
    });
}

/**
 * Восстановить все ячейки заклинаний (долгий отдых)
 */
function restoreAllSlots() {
    state.spellSlots.forEach(slot => {
        slot.current = slot.max;
    });
    renderSlots();
    addToLog('🔮 Все ячейки заклинаний восстановлены!');
    autoSave();
}

/**
 * Структура заклинания: {name, level, action, castTime, attr, damage, description, prepared}
 * action: "action" | "bonus-action" | "reaction" | "ritual"
 * castTime: "1 действие" | "1 бонусное действие" | "1 реакция" | "1 минута" и т.д.
 */

/**
 * Отобразить заклинания сгруппированные по уровню
 */
function renderSpells() {
    let container = document.getElementById('spellsList');
    if (!container) return;
    container.innerHTML = '';
    
    // Группировать по уровню
    const spellsByLevel = {};
    state.spells.forEach(spell => {
        if (!spellsByLevel[spell.level]) {
            spellsByLevel[spell.level] = [];
        }
        spellsByLevel[spell.level].push(spell);
    });
    
    // Отобразить по порядку
    for (let level = 0; level <= 9; level++) {
        const spells = spellsByLevel[level];
        if (!spells) continue;
        
        let levelName = level === 0 ? '📖 Заговоры (Cantrips)' : '✨ Ячейка ' + level + ' уровня';
        let section = document.createElement('div');
        section.className = 'spell-level-section';
        section.innerHTML = '<div class="spell-level-header">' + levelName + '</div>';
        
        spells.forEach((spell, idx) => {
            let li = document.createElement('div');
            li.className = 'spell-card';
            
            let actionIcon = '⏱️';
            if (spell.action === 'bonus-action') actionIcon = '⚡';
            if (spell.action === 'reaction') actionIcon = '🔄';
            if (spell.action === 'ritual') actionIcon = '🔮';
            
            let langBadge = spell.sourceLang ? '<span class="spell-lang-badge">' + spell.sourceLang.toUpperCase() + '</span>' : '';
            let spellIdx = state.spells.indexOf(spell);
            li.innerHTML = 
                '<div class="spell-card-header">' +
                '<strong>' + spell.name + '</strong>' + langBadge +
                '<span class="spell-action">' + actionIcon + ' ' + spell.action + '</span>' +
                '</div>' +
                '<div class="spell-card-meta">' +
                '<span>🕐 ' + spell.castTime + '</span>' +
                '<span>📊 ' + spell.attr.toUpperCase() + '</span>' +
                (spell.damage ? '<span>💥 ' + spell.damage + '</span>' : '') +
                '</div>' +
                (spell.description ? '<div class="spell-card-desc">' + spell.description + '</div>' : '') +
                '<div class="spell-card-actions">' +
                '<button class="spell-attack-btn dice" data-idx="' + spellIdx + '">🎲 Бросок</button>' +
                (spell.damage ? '<button class="spell-damage-btn dice" data-idx="' + spellIdx + '" style="background: #8b3c2a;">💥 Урон</button>' : '') +
                '<button class="remove-spell remove-btn" data-idx="' + spellIdx + '">🗑</button>' +
                '</div>';
            
            section.appendChild(li);
        });
        
        container.appendChild(section);
    }
    
    // Закреплённые заклинания
    if (state.pinnedSpells && state.pinnedSpells.length > 0) {
        let pinnedSection = document.createElement('div');
        pinnedSection.className = 'pinned-spells-section';
        pinnedSection.innerHTML = '<div class="spell-level-header">📌 Закреплённые заклинания</div>';
        
        state.pinnedSpells.forEach((spell, idx) => {
            let div = document.createElement('div');
            div.className = 'spell-card pinned-spell-card';
            div.innerHTML = 
                '<div class="spell-card-header">' +
                '<strong>📌 ' + spell.name + '</strong>' +
                '</div>' +
                (spell.notes ? '<div class="spell-card-desc"><strong>Заметки:</strong> ' + spell.notes + '</div>' : '') +
                '<div class="spell-card-actions">' +
                '<button class="remove-pinned remove-btn" data-idx="' + idx + '">🗑</button>' +
                '</div>';
            pinnedSection.appendChild(div);
        });
        
        container.appendChild(pinnedSection);
    }
    
    attachSpellEventHandlers();

    document.querySelectorAll('.spell-attack-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            let idx = parseInt(btn.dataset.idx);
            let spell = state.spells[idx];
            if (!spell) return;
            let spellAttr = spell.attr || 'wis';
            let attrMod = getMod(spellAttr);
            let profBonusVal = spell.proficient ? getProfBonus() : 0;
            let attackBonus = attrMod + profBonusVal;

            if (spell.level === 0) {
                rollD20Unified(attackBonus, 'Заговор: ' + spell.name, 'spell');
            } else {
                // Для уровневых заклинаний — выбор ячейки и бросок
                await castSpell(spell);
            }
        };
    });

    document.querySelectorAll('.spell-damage-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            let idx = parseInt(btn.dataset.idx);
            let spell = state.spells[idx];
            if (spell && spell.damage) {
                rollDamageUnified(spell.damage, 'Урон: ' + spell.name, 'spell');
            }
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
            // Для заговоров: бросок атаки d20
            let rollResult = rollD20Unified(attackBonus, 'Заговор: ' + spell.name, 'spell');
            // Урон бросается отдельно кнопкой "Урон" в списке заклинаний
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

            // Бросок атаки d20
            let rollResult = rollD20Unified(attackBonus, 'Заклинание: ' + spell.name, 'spell');
            // Урон бросается отдельно кнопкой "Урон" или через dice-roller

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

/**
 * Обработчик событий для кнопок заклинаний
 */
function attachSpellEventHandlers() {
    document.querySelectorAll('.spell-attack-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.stopPropagation();
            let idx = parseInt(btn.dataset.idx);
            let spell = state.spells[idx];
            if (!spell) return;
            let spellAttr = spell.attr || 'wis';
            let attrMod = getMod(spellAttr);
            let profBonusVal = spell.proficient ? getProfBonus() : 0;
            let attackBonus = attrMod + profBonusVal;

            if (spell.level === 0) {
                rollD20Unified(attackBonus, 'Заговор: ' + spell.name, 'spell');
            } else {
                await castSpell(spell);
            }
        };
    });

    document.querySelectorAll('.spell-damage-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            let idx = parseInt(btn.dataset.idx);
            let spell = state.spells[idx];
            if (spell && spell.damage) {
                rollDamageUnified(spell.damage, 'Урон: ' + spell.name, 'spell');
            }
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

    document.querySelectorAll('.remove-pinned').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            state.pinnedSpells.splice(idx, 1);
            renderSpells();
            autoSave();
            addToLog('📌 Закреплённое заклинание удалено');
        };
    });
}

/**
 * Добавить заклинание из UI
 */
function addSpell() {
    let name = document.getElementById('spellName')?.value?.trim();
    let level = parseInt(document.getElementById('spellLevel')?.value) || 0;
    let attr = document.getElementById('spellAttr')?.value || 'wis';
    let proficient = document.getElementById('spellProficient')?.checked || false;
    let damage = document.getElementById('spellDamage')?.value?.trim() || '';
    let desc = document.getElementById('spellDesc')?.value?.trim() || '';
    
    if (!name) {
        alert('Введите название заклинания');
        return;
    }

    let spell = {
        name: name,
        level: level,
        action: 'action', // По умолчанию
        castTime: '1 действие', // По умолчанию
        attr: attr,
        proficient: proficient,
        damage: damage || null,
        description: desc
    };

    state.spells.push(spell);
    renderSpells();
    autoSave();
    
    // Очистить форму
    document.getElementById('spellName').value = '';
    document.getElementById('spellLevel').value = '0';
    document.getElementById('spellDamage').value = '1к6';
    document.getElementById('spellDesc').value = '';
    
    addToLog('✨ ' + name + ' добавлено!');
}

/**
 * Добавить закреплённое заклинание
 */
function addPinnedSpell() {
    let name = prompt('Название закреплённого заклинания:');
    if (!name) return;

    let notes = prompt('Добавить заметки/описание:');
    
    let pinnedSpell = {
        name: name,
        notes: notes || ''
    };

    if (!state.pinnedSpells) state.pinnedSpells = [];
    state.pinnedSpells.push(pinnedSpell);
    renderSpells();
    autoSave();
    addToLog('📌 Закреплённое заклинание добавлено!');
}

// ========== ЗАГРУЗКА ЗАКЛИНАНИЙ ИЗ БД (РЕФАКТОРИНГ: серверная фильтрация + локализация) ==========
// getLocalizedSpellData() и getSpellClasses() УДАЛЕНЫ — логика на сервере.
// eval() больше не используется — маппинг через GET /api/spells/class-map.

/**
 * Показать модальное окно для выбора заклинания из БД.
 * РЕФАКТОРИНГ: фильтрация и локализация — на сервере (/api/spells?lang=&class=&name=&level=&school=).
 * Клиент только рендерит результаты и фильтрует по action (одно поле, быстро).
 */
async function showSpellSelectionModal() {
    var selectedLanguage = 'ru';
    var filters = { class: '', level: '', school: '', action: '' };
    var currentResults = []; // кэш результатов с сервера

    // Строим UI модального окна
    var overlay = document.createElement('div');
    overlay.className = 'custom-prompt-overlay';
    overlay.style.cssText = 'display:flex; align-items:center; justify-content:center; z-index:10000;';

    var modal = document.createElement('div');
    modal.className = 'custom-prompt';
    modal.style.cssText = 'width:900px; max-width:calc(100vw - 40px); height:900px; display:flex; flex-direction:column; overflow:hidden;';

    // Загружаем список классов с сервера
    var classList = [];
    try {
        var resp = await fetch('/api/spells/classes');
        if (resp.ok) classList = await resp.json();
    } catch (e) { console.warn('Ошибка загрузки классов:', e); }

    var html = '';
    html += '<div style="margin:10px 0; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">';
    html += '<label style="font-weight:600; white-space:nowrap;">Язык:</label>';
    html += '<select id="spellLanguageSelect" style="padding:8px; border:1px solid #ccc; border-radius:4px; min-width:140px;">';
    html += '<option value="ru">Русский</option><option value="en">English</option>';
    html += '</select>';
    html += '<input type="text" id="spellSearchBox" placeholder="🔍 Поиск..." style="flex:1 1 260px; min-width:220px; padding:8px; border:1px solid #ccc; border-radius:4px;">';
    html += '</div>';

    html += '<div style="margin:10px 0; display:flex; gap:8px; align-items:center; flex-wrap:nowrap; overflow-x:auto;">';
    html += '<label style="font-weight:600; white-space:nowrap;">Фильтры:</label>';
    html += '<select id="classFilter" style="padding:6px; border:1px solid #ccc; border-radius:4px; min-width:150px;">';
    html += '<option value="">Все классы</option>';
    classList.forEach(function (cls) { html += '<option value="' + cls + '">' + cls + '</option>'; });
    html += '</select>';
    html += '<select id="levelFilter" style="padding:6px; border:1px solid #ccc; border-radius:4px; min-width:150px;">';
    html += '<option value="">Все уровни</option>';
    for (var i = 0; i <= 9; i++) {
        html += '<option value="' + i + '">' + (i === 0 ? 'Заговоры' : 'Уровень ' + i) + '</option>';
    }
    html += '</select>';
    html += '<select id="schoolFilter" style="padding:6px; border:1px solid #ccc; border-radius:4px; min-width:150px;">';
    html += '<option value="">Все школы</option>';
    html += '</select>';
    html += '<select id="actionFilter" style="padding:6px; border:1px solid #ccc; border-radius:4px; min-width:150px;">';
    html += '<option value="">Все типы</option>';
    html += '<option value="action">Действие</option>';
    html += '<option value="bonus-action">Бонусное действие</option>';
    html += '<option value="reaction">Реакция</option>';
    html += '<option value="ritual">Ритуал</option>';
    html += '</select>';
    html += '</div>';

    html += '<div id="spellsListContainer" style="flex:1; overflow-y:auto; border:1px solid #ddd; border-radius:4px; padding:10px; margin:10px 0; background:#fafafa;"></div>';
    html += '<div style="display:flex; gap:8px; justify-content:flex-end; margin-top:10px;">';
    html += '<button id="cancelDbSpellBtn" style="padding:8px 16px; background:#ccc; border:none; border-radius:4px; cursor:pointer;">❌ Отмена</button>';
    html += '</div>';

    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var searchBox = modal.querySelector('#spellSearchBox');
    var langSelect = modal.querySelector('#spellLanguageSelect');
    var classFilterEl = modal.querySelector('#classFilter');
    var levelFilterEl = modal.querySelector('#levelFilter');
    var schoolFilterEl = modal.querySelector('#schoolFilter');
    var actionFilterEl = modal.querySelector('#actionFilter');
    var listContainer = modal.querySelector('#spellsListContainer');

    // === ПОИСК ЗАКЛИНАНИЙ (запрос к серверу) ===
    async function searchSpells() {
        var params = new URLSearchParams();
        params.set('lang', selectedLanguage);

        var nameQuery = searchBox.value.trim();
        if (nameQuery) params.set('name', nameQuery);
        if (filters.class) params.set('class', filters.class);
        if (filters.level !== '') params.set('level', filters.level);
        if (filters.school) params.set('school', filters.school);

        try {
            var response = await fetch('/api/spells?' + params.toString());
            if (!response.ok) throw new Error('HTTP ' + response.status);
            currentResults = await response.json();

            // Обновить выпадающий список школ на основе результатов
            var schools = [];
            currentResults.forEach(function (s) {
                if (s.school && schools.indexOf(s.school) === -1) {
                    schools.push(s.school);
                }
            });
            schools.sort();
            schoolFilterEl.innerHTML = '<option value="">Все школы</option>' +
                schools.map(function (s) { return '<option value="' + s + '">' + s + '</option>'; }).join('');
        } catch (e) {
            console.error('Ошибка поиска заклинаний:', e);
            currentResults = [];
        }

        renderResults(currentResults);
    }

    // === РЕНДЕР РЕЗУЛЬТАТОВ (action-фильтр — локально) ===
    function renderResults(spells) {
        var filtered = spells;
        if (filters.action) {
            filtered = spells.filter(function (s) { return s.action === filters.action; });
        }

        if (filtered.length === 0) {
            listContainer.innerHTML = '<div style="color:#666; padding:16px; text-align:center;">Нет заклинаний по фильтру</div>';
            return;
        }

        var htmlList = filtered.map(function (spell, idx) {
            var levelName = spell.level === 0 ? 'Заговор' : 'ЯЗ ' + spell.level;
            var actionIcon = spell.action === 'bonus-action' ? '⚡' :
                             spell.action === 'reaction' ? '🔄' :
                             spell.action === 'ritual' ? '🔮' : '⏱️';
            var shortDesc = (spell.description && spell.description.length > 100)
                ? spell.description.substring(0, 100) + '...'
                : (spell.description || '');

            return '<div class="spell-db-item" data-spell-id="' + spell.id + '" style="padding:12px; border:1px solid #e0e0e0; margin:5px 0; border-radius:6px; cursor:pointer; background:white; transition:all 0.2s;" onmouseover="this.style.background=\'#f0f8ff\'; this.style.boxShadow=\'0 2px 8px rgba(0,0,0,0.1)\';" onmouseout="this.style.background=\'white\'; this.style.boxShadow=\'none\';">' +
                '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">' +
                '<strong style="flex:1; min-width:0;">' + spell.name + '</strong>' +
                '<span style="background:#e8d4b8; padding:3px 8px; border-radius:12px; font-size:0.85rem; white-space:nowrap;">' + actionIcon + ' ' + levelName + '</span>' +
                '</div>' +
                '<div style="font-size:0.85rem; color:#666; margin-top:6px; display:flex; flex-wrap:wrap; gap:6px;">' +
                '<span>🕐 ' + spell.castTime + '</span>' +
                '<span>📊 ' + spell.attr.toUpperCase() + '</span>' +
                (spell.damage ? '<span>💥 ' + spell.damage + '</span>' : '') +
                (spell.school ? '<span>🏫 ' + spell.school + '</span>' : '') +
                '<span style="background:#f0f0f0; padding:2px 6px; border-radius:10px; font-size:0.75rem;">' + selectedLanguage.toUpperCase() + '</span>' +
                '</div>' +
                (spell.classes && spell.classes.length > 0 ? '<div style="font-size:0.8rem; color:#888; margin-top:4px;">👥 ' + spell.classes.join(', ') + '</div>' : '') +
                '<div style="font-size:0.8rem; color:#999; margin-top:6px; max-height:40px; overflow:hidden;">' + shortDesc + '</div>' +
                '<div style="margin-top:8px; text-align:right;">' +
                '<button class="spell-details-btn" data-spell-id="' + spell.id + '" style="padding:4px 8px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">Подробнее</button>' +
                '</div>' +
                '</div>';
        }).join('');

        listContainer.innerHTML = htmlList;

        // Кнопки «Подробнее»
        listContainer.querySelectorAll('.spell-details-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var spellId = parseInt(btn.dataset.spellId);
                var spell = currentResults.find(function (s) { return s.id === spellId; });
                if (spell) showSpellDetailsModalLocalized(spell);
            });
        });

        // Клик по карточке заклинания = выбрать
        listContainer.querySelectorAll('.spell-db-item').forEach(function (item) {
            item.addEventListener('click', function (e) {
                if (e.target.classList.contains('spell-details-btn')) return;
                var spellId = parseInt(item.dataset.spellId);
                var spell = currentResults.find(function (s) { return s.id === spellId; });
                if (spell) selectSpellFromDb(spell);
                overlay.remove();
            });
        });
    }

    // === СОБЫТИЯ ===
    searchBox.addEventListener('input', searchSpells);

    langSelect.addEventListener('change', function (e) {
        selectedLanguage = e.target.value;
        searchSpells();
    });

    classFilterEl.addEventListener('change', function (e) {
        filters.class = e.target.value;
        searchSpells();
    });

    levelFilterEl.addEventListener('change', function (e) {
        filters.level = e.target.value;
        searchSpells();
    });

    schoolFilterEl.addEventListener('change', function (e) {
        filters.school = e.target.value;
        searchSpells();
    });

    actionFilterEl.addEventListener('change', function (e) {
        filters.action = e.target.value;
        renderResults(currentResults); // action фильтр — локально
    });

    modal.querySelector('#cancelDbSpellBtn').addEventListener('click', function () {
        overlay.remove();
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.remove();
    });

    // Первичная загрузка
    await searchSpells();
    searchBox.focus();
}
/**
 * Показать модальное окно с подробной информацией о заклинании.
 * РЕФАКТОРИНГ: spell уже локализован сервером (не нужен getLocalizedSpellData).
 * @param {Object} spell — локализованный объект заклинания из API
 */
function showSpellDetailsModalLocalized(spell) {
    var overlay = document.createElement('div');
    overlay.className = 'custom-prompt-overlay';
    overlay.style.cssText = 'display:flex; align-items:center; justify-content:center; z-index:10001;';

    var modal = document.createElement('div');
    modal.className = 'custom-prompt';
    modal.style.cssText = 'max-width:600px; max-height:80vh; overflow:auto;';

    var html = '<h3 style="margin-top:0;">' + spell.name + '</h3>';
    html += '<div style="margin:15px 0;">';
    html += '<div style="background:#f8f9fa; padding:12px; border-radius:6px; margin-bottom:12px;">';
    html += '<div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:8px;">';
    html += '<span><strong>Уровень:</strong> ' + (spell.level === 0 ? 'Заговор' : spell.level) + '</span>';
    html += '<span><strong>Школа:</strong> ' + (spell.school || 'Не указана') + '</span>';
    html += '<span><strong>Время накладывания:</strong> ' + spell.castTime + '</span>';
    html += '<span><strong>Дальность:</strong> ' + (spell.range || 'Не указана') + '</span>';
    html += '</div>';
    html += '<div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:8px;">';
    html += '<span><strong>Компоненты:</strong> ' + (spell.components || 'Не указаны') + '</span>';
    html += '<span><strong>Длительность:</strong> ' + (spell.duration || 'Не указана') + '</span>';
    html += '<span><strong>Источник:</strong> ' + (spell.source || 'Не указан') + '</span>';
    html += '</div>';
    html += '<div><strong>Классы:</strong> ' + (spell.classes && spell.classes.length > 0 ? spell.classes.join(', ') : 'Не указаны') + '</div>';
    html += '</div>';
    html += '<div style="margin-bottom:12px;">';
    html += '<strong>Описание:</strong>';
    html += '<div style="margin-top:8px; padding:12px; background:#fff; border:1px solid #e0e0e0; border-radius:4px; white-space:pre-wrap;">' + (spell.description || '') + '</div>';
    html += '</div>';

    if (spell.damage) {
        html += '<div style="margin-bottom:12px;">';
        html += '<strong>Урон:</strong>';
        html += '<div style="margin-top:8px; padding:8px; background:#ffe6e6; border:1px solid #ffcccc; border-radius:4px;">' + spell.damage + '</div>';
        html += '</div>';
    }

    html += '<div style="display:flex; gap:8px; justify-content:flex-end; margin-top:20px;">';
    html += '<button id="closeDetailsBtn" style="padding:8px 16px; background:#6c757d; color:white; border:none; border-radius:4px; cursor:pointer;">Закрыть</button>';
    html += '</div>';

    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    modal.querySelector('#closeDetailsBtn').addEventListener('click', function () {
        overlay.remove();
    });

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) overlay.remove();
    });
}

/**
 * Выбрать заклинание из БД и добавить в книгу персонажа.
 * РЕФАКТОРИНГ: spell уже локализован сервером.
 * @param {Object} spell — локализованный объект заклинания из API
 */
function selectSpellFromDb(spell) {
    state.spells.push({
        name: spell.name,
        level: spell.level,
        action: spell.action,
        castTime: spell.castTime,
        attr: spell.attr,
        proficient: true,
        damage: spell.damage || null,
        description: spell.description || '',
        sourceLang: 'ru',  // язык, на котором выбрано заклинание
        classes: spell.classes || []
    });

    renderSpells();
    autoSave();
    addToLog('✨ ' + spell.name + ' добавлено из БД!');
}
document.addEventListener('DOMContentLoaded', () => {
    // Кнопка для добавления заклинания
    document.getElementById('addSpellBtn')?.addEventListener('click', addSpell);
    document.getElementById('addSpellFromDbBtn')?.addEventListener('click', () => {
        showSpellSelectionModal().catch(error => {
            console.error('Ошибка открытия модального окна:', error);
            alert('Ошибка загрузки заклинаний');
        });
    });
    document.getElementById('restoreSlotsBtn')?.addEventListener('click', restoreAllSlots);
    document.getElementById('addSlotBtn')?.addEventListener('click', () => {
        let level = parseInt(document.getElementById('slotLevel')?.value) || 1;
        let max = parseInt(document.getElementById('slotTotal')?.value) || 1;
        let current = parseInt(document.getElementById('slotCurrent')?.value) || max;
        
        if (level < 0 || level > 9) {
            alert('Уровень должен быть от 0 до 9');
            return;
        }
        
        // Проверить, нет ли уже такого уровня
        if (state.spellSlots.some(s => s.level === level)) {
            alert('Ячейка ' + level + ' уровня уже добавлена');
            return;
        }
        
        state.spellSlots.push({ level, max, current });
        state.spellSlots.sort((a, b) => a.level - b.level);
        renderSlots();
        autoSave();
        
        document.getElementById('slotLevel').value = '';
        document.getElementById('slotTotal').value = '';
        document.getElementById('slotCurrent').value = '';
        addToLog('📊 Ячейка ' + level + ' уровня добавлена');
    });
});
