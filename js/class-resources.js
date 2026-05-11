// ============ КЛАССОВЫЕ РЕСУРСЫ (12 КЛАССОВ) ============
// Зависит от: state.js, constants.js, ui-core.js, utils.js

function renderClassResource() {
    const container = document.getElementById('classResourceContainer');
    if (!container) return;

    const primaryClass = state.primaryClass;
    const resource = state.classResources[primaryClass];

    if (!resource) {
        container.innerHTML = '';
        return;
    }

    let maxValue = resource.max;
    let currentValue = resource.current;

    // Расчёт максимума для каждого класса
    if (primaryClass === 'monk') {
        const monkLevel = state.multClasses.find(c => c.className === 'monk')?.level || 0;
        maxValue = monkLevel;
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.monk.max = maxValue;
        state.classResources.monk.current = currentValue;
    }
    else if (primaryClass === 'sorcerer') {
        const sorcererLevel = state.multClasses.find(c => c.className === 'sorcerer')?.level || 0;
        maxValue = sorcererLevel;
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.sorcerer.max = maxValue;
        state.classResources.sorcerer.current = currentValue;
    }
    else if (primaryClass === 'barbarian') {
        const barbarianLevel = state.multClasses.find(c => c.className === 'barbarian')?.level || 0;
        if (barbarianLevel >= 20) maxValue = Infinity;
        else if (barbarianLevel >= 17) maxValue = 6;
        else if (barbarianLevel >= 12) maxValue = 5;
        else if (barbarianLevel >= 6) maxValue = 4;
        else if (barbarianLevel >= 3) maxValue = 3;
        else maxValue = 2;
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.barbarian.max = maxValue;
        state.classResources.barbarian.current = currentValue;
    }
    else if (primaryClass === 'cleric') {
        const clericLevel = state.multClasses.find(c => c.className === 'cleric')?.level || 0;
        maxValue = (clericLevel >= 6) ? 2 : 1;
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.cleric.max = maxValue;
        state.classResources.cleric.current = currentValue;
    }
    else if (primaryClass === 'fighter') {
        const fighterLevel = state.multClasses.find(c => c.className === 'fighter')?.level || 0;
        maxValue = (fighterLevel >= 17) ? 2 : 1;
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.fighter.max = maxValue;
        state.classResources.fighter.current = currentValue;
    }
    else if (primaryClass === 'paladin') {
        const paladinLevel = state.multClasses.find(c => c.className === 'paladin')?.level || 0;
        if (paladinLevel >= 18) maxValue = Infinity;
        else if (paladinLevel >= 6) maxValue = 2;
        else if (paladinLevel >= 2) maxValue = 1;
        else maxValue = 0;
        currentValue = maxValue === Infinity ? Infinity : Math.min(resource.current, maxValue);
        state.classResources.paladin.max = maxValue;
        state.classResources.paladin.current = currentValue;
    }
    else if (primaryClass === 'druid') {
        const druidLevel = state.multClasses.find(c => c.className === 'druid')?.level || 0;
        if (druidLevel >= 20) maxValue = Infinity;
        else if (druidLevel >= 18) maxValue = Infinity;
        else if (druidLevel >= 2) maxValue = 2;
        else maxValue = 0;
        currentValue = maxValue === Infinity ? Infinity : Math.min(resource.current, maxValue);
        state.classResources.druid.max = maxValue;
        state.classResources.druid.current = currentValue;
    }
    else if (primaryClass === 'bard') {
        const bardLevel = state.multClasses.find(c => c.className === 'bard')?.level || 0;
        maxValue = (bardLevel >= 5) ? 3 : (bardLevel >= 1 ? 1 : 0);
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.bard.max = maxValue;
        state.classResources.bard.current = currentValue;
    }
    else if (primaryClass === 'ranger') {
        const rangerLevel = state.multClasses.find(c => c.className === 'ranger')?.level || 0;
        maxValue = (rangerLevel >= 1) ? 1 : 0;
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.ranger.max = maxValue;
        state.classResources.ranger.current = currentValue;
    }
    else if (primaryClass === 'rogue') {
        const rogueLevel = state.multClasses.find(c => c.className === 'rogue')?.level || 0;
        maxValue = (rogueLevel >= 1) ? 1 : 0;
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.rogue.max = maxValue;
        state.classResources.rogue.current = currentValue;
    }
    else if (primaryClass === 'warlock') {
        maxValue = 0;
        currentValue = 0;
        container.innerHTML = '';
        return;
    }
    else if (primaryClass === 'wizard') {
        const wizardLevel = state.multClasses.find(c => c.className === 'wizard')?.level || 0;
        maxValue = (wizardLevel >= 1) ? 1 : 0;
        currentValue = Math.min(resource.current, maxValue);
        state.classResources.wizard.max = maxValue;
        state.classResources.wizard.current = currentValue;
    }

    let maxDisplay = maxValue === Infinity ? "∞" : maxValue;
    let currentDisplay = maxValue === Infinity ? "∞" : currentValue;

    if (maxDisplay === 0 && currentDisplay === 0) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0; padding: 8px; background: var(--stat-bg); border-radius: 16px;">' +
        '<strong>⭐ ' + resource.name + ':</strong>' +
        '<span>' + currentDisplay + '/' + maxDisplay + '</span>' +
        '<button id="useResourceBtn" class="dice" style="background: #8b5cf6;">⚡ Использовать</button>' +
        '<button id="restoreResourceBtn" class="dice" style="background: #2c6e2c;">🔄 Восстановить</button>' +
        '</div>';

    document.getElementById('useResourceBtn')?.addEventListener('click', () => {
        if (maxValue === Infinity) {
            addToLog('✨ ' + resource.name + ': бесконечное использование!');
            return;
        }
        if (currentValue > 0) {
            if (primaryClass === 'monk') state.classResources.monk.current--;
            else if (primaryClass === 'sorcerer') state.classResources.sorcerer.current--;
            else if (primaryClass === 'fighter') state.classResources.fighter.current = Math.max(0, state.classResources.fighter.current - 1);
            else if (primaryClass === 'cleric') state.classResources.cleric.current = Math.max(0, state.classResources.cleric.current - 1);
            else if (primaryClass === 'barbarian') {
                if (state.classResources.barbarian.max !== Infinity) state.classResources.barbarian.current = Math.max(0, state.classResources.barbarian.current - 1);
            }
            else if (primaryClass === 'paladin') {
                if (state.classResources.paladin.max !== Infinity) state.classResources.paladin.current = Math.max(0, state.classResources.paladin.current - 1);
            }
            else if (primaryClass === 'druid') {
                if (state.classResources.druid.max !== Infinity) state.classResources.druid.current = Math.max(0, state.classResources.druid.current - 1);
            }
            else if (primaryClass === 'bard') state.classResources.bard.current = Math.max(0, state.classResources.bard.current - 1);
            else if (primaryClass === 'ranger') state.classResources.ranger.current = Math.max(0, state.classResources.ranger.current - 1);
            else if (primaryClass === 'rogue') state.classResources.rogue.current = Math.max(0, state.classResources.rogue.current - 1);
            else if (primaryClass === 'wizard') state.classResources.wizard.current = Math.max(0, state.classResources.wizard.current - 1);
            renderClassResource();
            addToLog('✨ Использован ' + resource.name + ' (' + (currentValue-1) + '/' + maxValue + ')');
            autoSave();
        } else {
            addToLog('❌ Нет доступных ' + resource.name + '!');
        }
    });

    document.getElementById('restoreResourceBtn')?.addEventListener('click', () => {
        if (primaryClass === 'monk') state.classResources.monk.current = state.classResources.monk.max;
        else if (primaryClass === 'sorcerer') state.classResources.sorcerer.current = state.classResources.sorcerer.max;
        else if (primaryClass === 'fighter') state.classResources.fighter.current = state.classResources.fighter.max;
        else if (primaryClass === 'cleric') state.classResources.cleric.current = state.classResources.cleric.max;
        else if (primaryClass === 'barbarian') state.classResources.barbarian.current = state.classResources.barbarian.max === Infinity ? Infinity : state.classResources.barbarian.max;
        else if (primaryClass === 'paladin') state.classResources.paladin.current = state.classResources.paladin.max === Infinity ? Infinity : state.classResources.paladin.max;
        else if (primaryClass === 'druid') state.classResources.druid.current = state.classResources.druid.max === Infinity ? Infinity : state.classResources.druid.max;
        else if (primaryClass === 'bard') state.classResources.bard.current = state.classResources.bard.max;
        else if (primaryClass === 'ranger') state.classResources.ranger.current = state.classResources.ranger.max;
        else if (primaryClass === 'rogue') state.classResources.rogue.current = state.classResources.rogue.max;
        else if (primaryClass === 'wizard') state.classResources.wizard.current = state.classResources.wizard.max;
        renderClassResource();
        addToLog('🔄 Восстановлены ' + resource.name);
        autoSave();
    });
}
