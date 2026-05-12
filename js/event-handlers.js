// ============ ОБРАБОТЧИКИ СОБЫТИЙ ============
// Зависит от: ВСЕХ предыдущих модулей

function initEventHandlers() {
    // === Повышение уровня ===
    document.getElementById('levelUpMainBtn')?.addEventListener('click', () => {
        if (state.multClasses.length === 1) {
            levelUpClass(0);
        } else {
            let options = state.multClasses.map((cls, idx) => {
                return (idx + 1) + '. ' + classNames[cls.className] + ' (ур. ' + cls.level + ', к' + cls.hitDice + ')';
            }).join('\n');
            let promptText = 'Какой класс повысить?\n' + options + '\n\nВведите номер класса (1-' + state.multClasses.length + '):';
            let choice = prompt(promptText);
            let idx = parseInt(choice) - 1;
            if (!isNaN(idx) && idx >= 0 && idx < state.multClasses.length) {
                levelUpClass(idx);
            } else {
                addToLog('❌ Неверный выбор класса.');
            }
        }
    });

    // === Деньги ===
    document.getElementById('pp')?.addEventListener('input', () => {
        state.money.pp = parseInt(document.getElementById('pp').value) || 0;
        autoSave();
    });
    document.getElementById('gp')?.addEventListener('input', () => {
        state.money.gp = parseInt(document.getElementById('gp').value) || 0;
        autoSave();
    });
    document.getElementById('sp')?.addEventListener('input', () => {
        state.money.sp = parseInt(document.getElementById('sp').value) || 0;
        autoSave();
    });
    document.getElementById('cp')?.addEventListener('input', () => {
        state.money.cp = parseInt(document.getElementById('cp').value) || 0;
        autoSave();
    });

    // === Добавление класса ===
    document.getElementById('addClassBtn')?.addEventListener('click', () => {
        state.multClasses.push({ className: "fighter", level: 1, hitDice: 8 });
        renderMulticlass();
        recalcTotalLevel();
        updateMaxHp();
        renderSavingThrows();
        autoSave();
        addToLog('➕ Добавлен дополнительный класс: Воин');
    });

    // === Атаки ===
    document.getElementById('addAttackBtn')?.addEventListener('click', () => {
        let name = document.getElementById('attackName')?.value.trim();
        let attr = document.getElementById('attackAttr')?.value;
        let proficient = document.getElementById('attackProficient')?.checked;
        let dice = document.getElementById('attackDice')?.value.trim();
        if (name && dice) {
            state.attacks.push({ name: name, attr: attr, proficient: proficient, dice: dice });
            renderAttacks();
            document.getElementById('attackName').value = '';
            document.getElementById('attackDice').value = '1к8+3';
            addToLog('⚔️ Добавлена атака: ' + name);
            autoSave();
        } else {
            addToLog('Укажите название и урон');
        }
    });

    // === Заклинания ===
    document.getElementById('addSpellBtn')?.addEventListener('click', () => {
        let name = document.getElementById('spellName')?.value.trim();
        let levelVal = document.getElementById('spellLevel')?.value || '1';
        let attr = document.getElementById('spellAttr')?.value || 'wis';
        let proficient = document.getElementById('spellProficient')?.checked;
        let damage = document.getElementById('spellDamage')?.value.trim();
        let desc = document.getElementById('spellDesc')?.value.trim();
        if (!name) {
            addToLog('❌ Укажите название заклинания');
            return;
        }
        let level = parseInt(levelVal);
        if (isNaN(level)) level = 0;
        state.spells.push({ name: name, level: level, attr: attr, proficient: proficient, damage: damage, desc: desc });
        renderSpells();
        document.getElementById('spellName').value = '';
        document.getElementById('spellDamage').value = '1к6';
        document.getElementById('spellDesc').value = '';
        addToLog('✨ Добавлено заклинание: ' + name);
        autoSave();
    });

    // === Слоты заклинаний ===
    document.getElementById('addSlotBtn')?.addEventListener('click', () => {
        let level = document.getElementById('slotLevel')?.value.trim();
        let max = parseInt(document.getElementById('slotTotal')?.value);
        let cur = parseInt(document.getElementById('slotCurrent')?.value);
        if (level && !isNaN(max) && max > 0) {
            state.spellSlots.push({ level: level, max: max, current: isNaN(cur) ? max : cur });
            renderSlots();
            document.getElementById('slotLevel').value = '';
            document.getElementById('slotTotal').value = '';
            document.getElementById('slotCurrent').value = '';
            addToLog('🔮 Добавлен слот: ' + level + ' уровень');
            autoSave();
        }
    });

    document.getElementById('restoreSlotsBtn')?.addEventListener('click', restoreAllSlots);

    // === Инвентарь ===
    document.getElementById('addItemBtn')?.addEventListener('click', () => {
        let name = document.getElementById('newItemName')?.value.trim();
        let qty = parseInt(document.getElementById('newItemQty')?.value) || 1;
        let desc = document.getElementById('newItemDesc')?.value.trim();
        let useCounter = document.getElementById('newItemUseCounter')?.checked || false;
        if (name) {
            state.inventoryItems.push({ name: name, qty: useCounter ? qty : 0, desc: desc, useCounter: useCounter });
            renderInventory();
            document.getElementById('newItemName').value = '';
            document.getElementById('newItemQty').value = '';
            document.getElementById('newItemDesc').value = '';
            document.getElementById('newItemUseCounter').checked = false;
            addToLog('➕ Добавлен предмет: ' + name);
            autoSave();
        }
    });

    // === Способности ===
    document.getElementById('addFeatureBtn')?.addEventListener('click', () => {
        let name = document.getElementById('featureName')?.value.trim();
        let desc = document.getElementById('featureDesc')?.value.trim();
        if (name) {
            state.features.push({ name: name, desc: desc });
            renderFeatures();
            document.getElementById('featureName').value = '';
            document.getElementById('featureDesc').value = '';
            addToLog('⭐ Добавлена способность: ' + name);
            autoSave();
        }
    });

    // === Навыки ===
    document.getElementById('addSkillBtn')?.addEventListener('click', () => {
        let name = document.getElementById('newSkillName')?.value.trim();
        if (name && !state.customSkills.find(s => s.name === name)) {
            state.customSkills.push({ name: name, proficient: false });
            renderSkills();
            document.getElementById('newSkillName').value = '';
            autoSave();
        }
    });

    // === Заметки ===
    document.getElementById('addNoteBtn')?.addEventListener('click', () => {
        let title = document.getElementById('newNoteTitle')?.value.trim();
        let desc = document.getElementById('newNoteDesc')?.value.trim();
        if (title) {
            state.notes.push({ title: title, desc: desc });
            renderNotes();
            document.getElementById('newNoteTitle').value = '';
            document.getElementById('newNoteDesc').value = '';
            addToLog('📝 Добавлена заметка: ' + title);
            autoSave();
        } else {
            addToLog('❌ Укажите заголовок заметки.');
        }
    });

    // === Импорт JSON заклинаний ===
    document.getElementById('importJsonBtn')?.addEventListener('click', () => {
        let input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            let file = e.target.files[0];
            if (!file) return;
            let reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    let data = JSON.parse(ev.target.result);
                    let spellsToImport = Array.isArray(data) ? data : [data];
                    let importedCount = 0;
                    for (let spellData of spellsToImport) {
                        if (spellData.name && spellData.level !== undefined) {
                            let level = parseInt(spellData.level) || 0;
                            if (level < 0) level = 0;
                            if (level > 9) level = 9;
                            let descParts = [];
                            if (spellData.text) descParts.push(spellData.text);
                            if (spellData.school) descParts.push('Школа: ' + spellData.school);
                            if (spellData.castingTime) descParts.push('Время: ' + spellData.castingTime);
                            if (spellData.range) descParts.push('Дистанция: ' + spellData.range);
                            if (spellData.components) descParts.push('Компоненты: ' + spellData.components);
                            if (spellData.materials && spellData.materials !== '-') descParts.push('Материалы: ' + spellData.materials);
                            if (spellData.duration) descParts.push('Длительность: ' + spellData.duration);
                            if (spellData.ritual === 'ритуал') descParts.push('Ритуал');
                            if (spellData.source) descParts.push('Источник: ' + spellData.source);
                            let fullDesc = descParts.join('\n');
                            let exists = state.spells.some(s => s.name === spellData.name);
                            if (!exists) {
                                state.spells.push({
                                    name: spellData.name,
                                    level: level,
                                    attr: document.getElementById('spellcastingAttr')?.value || 'wis',
                                    proficient: true,
                                    damage: '',
                                    desc: fullDesc
                                });
                                importedCount++;
                            }
                        }
                    }
                    if (importedCount > 0) {
                        renderSpells();
                        addToLog('📖 Импортировано заклинаний: ' + importedCount);
                    } else {
                        addToLog('⚠️ Новых заклинаний не найдено');
                    }
                    autoSave();
                } catch (err) {
                    addToLog('❌ Ошибка парсинга JSON: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // === Хиты ===
    document.getElementById('hpHeal')?.addEventListener('click', healHp);
    document.getElementById('hpDamage')?.addEventListener('click', dealDamage);
    document.getElementById('tempHpClear')?.addEventListener('click', clearTempHp);
    document.getElementById('tempHpSet')?.addEventListener('click', setTempHp);

    // === Отдых ===
    document.getElementById('shortRestBtn')?.addEventListener('click', shortRest);
    document.getElementById('longRestBtn')?.addEventListener('click', longRest);

    // === Инициатива ===
    document.getElementById('initBtn')?.addEventListener('click', rollInitiative);

    // === КД ===
    document.getElementById('setAcBtn')?.addEventListener('click', setAc);

    // === Спасброски смерти ===
    document.getElementById('deathSaveRollBtn')?.addEventListener('click', rollDeathSave);
    document.getElementById('resetDeath')?.addEventListener('click', resetDeathSaves);

    // === Пользовательский бросок ===
    document.getElementById('rollCustom')?.addEventListener('click', () => {
        let e = document.getElementById('customDice')?.value;
        if (e) rollDamageUnified(e, 'Пользовательский бросок', 'custom');
    });

    document.getElementById('clearLog')?.addEventListener('click', () => {
        let log = document.getElementById('logArea');
        if (log) log.innerHTML = '🧹 Лог очищен. ';
    });

    // === Сохранение / Загрузка ===
    document.getElementById('saveToFileBtn')?.addEventListener('click', saveToFile);
    document.getElementById('loadFromFileBtn')?.addEventListener('click', loadFromFile);
    document.getElementById('resetToDefaultBtn')?.addEventListener('click', resetAll);

    // === Сворачивание секций ===
    document.querySelectorAll('.stat-card .card-header').forEach(header => {
        header.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            header.closest('.stat-card').classList.toggle('collapsed');
        });
    });

    document.getElementById('collapseAllBtn')?.addEventListener('click', () => {
        document.querySelectorAll('.stat-card').forEach(c => c.classList.add('collapsed'));
    });

    document.getElementById('expandAllBtn')?.addEventListener('click', () => {
        document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('collapsed'));
    });

    // === Тема ===
    document.getElementById('themeToggle')?.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('dnd_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
        document.getElementById('themeToggle').innerHTML = document.body.classList.contains('dark') ? '☀️ Светлая тема' : '🌙 Тёмная тема';
    });

    // === Характеристики ===
    allStats.forEach(id => {
        document.getElementById(id)?.addEventListener('input', () => {
            state.stats[id] = parseInt(document.getElementById(id).value) || 0;
            updateUI();
            renderSavingThrows();
            renderSkills();
            renderAttacks();
            autoSave();
        });
    });

    // === Бонус мастерства ===
    document.getElementById('profBonus')?.addEventListener('input', () => {
        state.profBonus = parseInt(document.getElementById('profBonus').value) || 2;
        renderSavingThrows();
        renderSkills();
        renderAttacks();
        autoSave();
    });

    // === Имя и раса ===
    document.getElementById('charName')?.addEventListener('input', () => {
        state.charName = document.getElementById('charName').value;
        autoSave();
    });
    document.getElementById('charRace')?.addEventListener('input', () => {
        state.charRace = document.getElementById('charRace').value;
        autoSave();
    });
    document.getElementById('charRace')?.addEventListener('change', () => {
        state.charRace = document.getElementById('charRace').value;
        state.selectedRaceTraits = [];
        updateRaceDisplay();
        openRaceModal(state.charRace);
        autoSave();
    });

    // === Истощение ===
    document.getElementById('exhaustion')?.addEventListener('input', function () {
        let val = parseInt(this.value) || 0;
        if (val > 6) val = 6;
        if (val < 0) val = 0;
        this.value = val;
        updateExhaustionEffects();
        autoSave();
    });

    // === Скорость ===
    document.getElementById('baseSpeed')?.addEventListener('input', () => {
        updateSpeedDisplay();
        autoSave();
    });

    // === Кнопки расовых способностей ===
    document.getElementById('viewRaceDetailsBtn')?.addEventListener('click', () => {
        openRaceModal(state.charRace);
    });
    document.getElementById('changeRaceBtn')?.addEventListener('click', () => {
        document.getElementById('charRace').value = '';
        state.charRace = '';
        state.selectedRaceTraits = [];
        updateRaceDisplay();
        autoSave();
    });
    document.getElementById('applyRaceBtn')?.addEventListener('click', () => {
        applyAndCloseRaceModal(state.charRace);
        updateRaceDisplay();
    });

    if (typeof initRaceTraitHandlers === 'function') {
        initRaceTraitHandlers();
    }
}

/**
 * Обновить отображение информации о расе в карточке
 */
function updateRaceDisplay() {
    const raceDisplayInfo = document.getElementById('raceDisplayInfo');
    const raceEmptyInfo = document.getElementById('raceEmptyInfo');
    
    if (!state.charRace || state.charRace === '') {
        raceDisplayInfo.style.display = 'none';
        raceEmptyInfo.style.display = 'block';
        return;
    }

    const raceData = getRaceData(state.charRace);
    if (!raceData) {
        raceDisplayInfo.style.display = 'none';
        raceEmptyInfo.style.display = 'block';
        return;
    }

    // Показать информацию о расе
    raceEmptyInfo.style.display = 'none';
    raceDisplayInfo.style.display = 'block';

    // Обновить название расы
    document.getElementById('currentRaceDisplay').textContent = raceData.name;

    // Обновить краткую информацию о бонусах
    const boostsSummary = Object.entries(raceData.abilityBoosts)
        .filter(([, bonus]) => bonus !== 0)
        .map(([ability, bonus]) => {
            const abilityShort = { str: 'СИЛ', dex: 'ЛОВ', con: 'ТЕЛ', 
                                   int: 'ИНТ', wis: 'МУД', cha: 'ХАР' };
            const sign = bonus > 0 ? '+' : '';
            return `${abilityShort[ability]} ${sign}${bonus}`;
        })
        .join(', ');
    document.getElementById('raceBoostsSummary').textContent = boostsSummary || 'Нет';

    // Скорость
    document.getElementById('raceSpeedSummary').textContent = raceData.speed + ' фт';

    // Тёмное зрение
    document.getElementById('raceDarkvisionSummary').textContent = 
        raceData.darkvision ? raceData.darkvision + ' фт' : 'Нет';

    if (typeof updateRaceTraitUI === 'function') {
        updateRaceTraitUI();
    }
}
