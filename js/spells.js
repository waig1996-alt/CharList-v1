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

/**
 * Загрузить заклинания из БД
 */
function getLocalizedSpellData(rawSpell, lang = 'ru') {
    let jsonData = {};
    try {
        jsonData = typeof rawSpell.jsonData === 'string' ? JSON.parse(rawSpell.jsonData) : rawSpell.jsonData || {};
    } catch (e) {
        console.warn('Ошибка парсинга jsonData для заклинания:', rawSpell.name, e);
    }

    const localized = (jsonData[lang] && typeof jsonData[lang] === 'object') ? jsonData[lang] : {};
    const fallback = jsonData[lang === 'ru' ? 'en' : 'ru'] || {};

    const name = localized.name || fallback.name || rawSpell.name || '';
    const description = localized.text || localized.description || fallback.text || fallback.description || rawSpell.description || '';
    const level = Number(localized.level ?? rawSpell.level ?? fallback.level) || 0;
    const castTime = localized.castingTime || localized.duration || rawSpell.castTime || '1 действие';
    const action = localized.action || rawSpell.action || 'action';
    const attr = localized.spellAttribute || rawSpell.attr || 'wis';
    const damage = localized.damage || rawSpell.damage || null;

    return {
        name,
        level,
        action,
        castTime,
        attr,
        damage,
        description
    };
}

async function loadSpellsFromDatabase() {
    try {
        const response = await fetch('/api/spells');
        if (!response.ok) throw new Error('Ошибка загрузки');
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки заклинаний:', error);
        addToLog('❌ Ошибка загрузки заклинаний из БД');
        return [];
    }
}

/**
 * Показать модальное окно для выбора заклинания из БД
 */
async function showSpellSelectionModal() {
    const dbSpells = await loadSpellsFromDatabase();
    
    if (dbSpells.length === 0) {
        alert('Нет заклинаний в базе данных');
        return;
    }

    let selectedLanguage = 'ru';

    const overlay = document.createElement('div');
    overlay.className = 'custom-prompt-overlay';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '10000';
    
    const modal = document.createElement('div');
    modal.className = 'custom-prompt';
    modal.style.maxWidth = '700px';
    modal.style.maxHeight = '600px';
    modal.style.display = 'flex';
    modal.style.flexDirection = 'column';

    let html = '<h3 style="margin-top: 0;">📚 Выберите заклинание из БД</h3>';
    html += '<div style="margin: 10px 0; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">';
    html += '<label for="spellLanguageSelect" style="font-weight: 600; white-space: nowrap;">Язык:</label>';
    html += '<select id="spellLanguageSelect" style="padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-width: 140px;">';
    html += '<option value="ru">Русский</option>';
    html += '<option value="en">English</option>';
    html += '</select>';
    html += '<input type="text" id="spellSearchBox" placeholder="🔍 Поиск..." style="flex: 1; min-width: 220px; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">';
    html += '</div>';
    html += '<div id="spellsListContainer" style="flex: 1; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin: 10px 0; background: #fafafa;">';
    html += '</div>';
    html += '<div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px;">';
    html += '<button id="cancelDbSpellBtn" style="padding: 8px 16px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">❌ Отмена</button>';
    html += '</div>';

    modal.innerHTML = html;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    const searchBox = modal.querySelector('#spellSearchBox');
    const langSelect = modal.querySelector('#spellLanguageSelect');
    const listContainer = modal.querySelector('#spellsListContainer');

    function renderSpellList() {
        const query = searchBox.value.toLowerCase();
        let htmlList = '';

        dbSpells.forEach((spell, idx) => {
            const display = getLocalizedSpellData(spell, selectedLanguage);
            const text = `${display.name} ${display.description} ${display.castTime} ${display.level}`.toLowerCase();
            if (query && !text.includes(query)) return;

            const levelName = display.level === 0 ? 'Заговор' : `ЯЗ ${display.level}`;
            const actionIcon = display.action === 'bonus-action' ? '⚡' : 
                               display.action === 'reaction' ? '🔄' : 
                               display.action === 'ritual' ? '🔮' : '⏱️';

            htmlList += `<div class="spell-db-item" data-idx="${idx}" style="padding: 10px; border: 1px solid #e0e0e0; margin: 5px 0; border-radius: 4px; cursor: pointer; background: white; transition: all 0.2s;" onmouseover="this.style.background='#f0f8ff'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)';" onmouseout="this.style.background='white'; this.style.boxShadow='none';">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
                    <strong style="flex: 1; min-width: 0;">${display.name}</strong>
                    <span style="background: #e8d4b8; padding: 3px 8px; border-radius: 12px; font-size: 0.85rem; white-space: nowrap; margin-left: 10px;">${actionIcon} ${levelName}</span>
                </div>
                <div style="font-size: 0.85rem; color: #666; margin-top: 4px; display: flex; flex-wrap: wrap; gap: 6px;">
                    <span>🕐 ${display.castTime}</span>
                    <span>📊 ${display.attr.toUpperCase()}</span>
                    ${display.damage ? `<span>💥 ${display.damage}</span>` : ''}
                    <span style="background: #f0f0f0; padding: 2px 6px; border-radius: 10px; font-size: 0.75rem;">${selectedLanguage.toUpperCase()}</span>
                </div>
                ${display.description ? `<div style="font-size: 0.8rem; color: #999; margin-top: 4px; max-height: 40px; overflow: hidden;">${display.description}</div>` : ''}
            </div>`;
        });

        listContainer.innerHTML = htmlList || '<div style="color:#666; padding:16px; text-align:center;">Нет заклинаний по фильтру</div>';

        listContainer.querySelectorAll('.spell-db-item').forEach(item => {
            item.addEventListener('click', () => {
                const idx = parseInt(item.dataset.idx);
                const spell = dbSpells[idx];
                selectSpellFromDb(spell, selectedLanguage);
                overlay.remove();
            });
        });
    }

    searchBox.addEventListener('input', renderSpellList);
    langSelect.addEventListener('change', (e) => {
        selectedLanguage = e.target.value;
        renderSpellList();
    });

    modal.querySelector('#cancelDbSpellBtn').addEventListener('click', () => {
        overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    });

    renderSpellList();
    searchBox.focus();
}

/**
 * Выбрать заклинание из БД
 */
function selectSpellFromDb(spell, lang = 'ru') {
    const display = getLocalizedSpellData(spell, lang);
    state.spells.push({ ...display, sourceLang: lang });
    renderSpells();
    autoSave();
    addToLog('✨ ' + display.name + ' добавлено из БД!');
}

/**
 * Пересчитать ячейки при изменении класса
 */
document.addEventListener('DOMContentLoaded', () => {
    // Кнопка для добавления заклинания
    document.getElementById('addSpellBtn')?.addEventListener('click', addSpell);
    document.getElementById('addSpellFromDbBtn')?.addEventListener('click', showSpellSelectionModal);
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
