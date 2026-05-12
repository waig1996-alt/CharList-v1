// ===== Расовые черты и интерфейс выбора =====

function parseRaceTrait(traitString) {
    const [, description] = traitString.split(/:\s*(.+)/);
    const name = traitString.split(':')[0].trim();
    const desc = description ? description.trim() : '';
    const id = name.toLowerCase().replace(/[^a-zа-я0-9]+/gi, '-').replace(/^-+|-+$/g, '');
    const summary = desc.length > 60 ? desc.slice(0, 60).replace(/\s+\S*$/, '') + '...' : desc;
    return { id, name, description: desc, summary };
}

function getRaceTraitOptions() {
    const raceData = getRaceData(state.charRace);
    if (!raceData || !Array.isArray(raceData.traits)) {
        return [];
    }

    const selected = new Set(state.selectedRaceTraits || []);
    return raceData.traits
        .map(parseRaceTrait)
        .filter(trait => !selected.has(trait.id));
}

function getRaceTraitById(traitId) {
    const raceData = getRaceData(state.charRace);
    if (!raceData || !Array.isArray(raceData.traits)) {
        return null;
    }
    return raceData.traits
        .map(parseRaceTrait)
        .find(trait => trait.id === traitId) || null;
}

function renderRaceTraitSelect() {
    const select = document.getElementById('raceTraitSelect');
    if (!select) return;

    const options = getRaceTraitOptions();
    select.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = options.length ? 'Выберите черту' : 'Все черты выбраны';
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    options.forEach(trait => {
        const option = document.createElement('option');
        option.value = trait.id;
        option.textContent = trait.name;
        select.appendChild(option);
    });

    const addButton = document.getElementById('addRaceTraitBtn');
    if (addButton) {
        addButton.disabled = options.length === 0;
    }
}

function renderRaceTraitsTable() {
    const tbody = document.querySelector('#raceTraitsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const traitIds = state.selectedRaceTraits || [];
    if (!traitIds.length) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align:center; opacity:0.7;">Нет выбранных черт</td>';
        tbody.appendChild(row);
        return;
    }

    traitIds.forEach(traitId => {
        const trait = getRaceTraitById(traitId);
        if (!trait) return;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <button class="race-trait-btn" type="button" data-trait-id="${trait.id}">
                    ${trait.name} — ${trait.summary}
                </button>
            </td>
            <td class="race-trait-desc">${trait.description}</td>
            <td class="race-trait-remove-cell">
                <button class="race-trait-remove-btn" type="button" data-trait-id="${trait.id}">✕</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addRaceTrait() {
    const select = document.getElementById('raceTraitSelect');
    if (!select) return;

    const traitId = select.value;
    if (!traitId) return;

    if (!Array.isArray(state.selectedRaceTraits)) {
        state.selectedRaceTraits = [];
    }
    if (!state.selectedRaceTraits.includes(traitId)) {
        state.selectedRaceTraits.push(traitId);
    }

    renderRaceTraitSelect();
    renderRaceTraitsTable();
    autoSave();
}

function removeRaceTrait(traitId) {
    state.selectedRaceTraits = (state.selectedRaceTraits || []).filter(id => id !== traitId);
    renderRaceTraitSelect();
    renderRaceTraitsTable();
    autoSave();
}

function updateRaceTraitUI() {
    const raceDisplayInfo = document.getElementById('raceDisplayInfo');
    const raceEmptyInfo = document.getElementById('raceEmptyInfo');
    if (!state.charRace || state.charRace === '' || !raceDisplayInfo || raceDisplayInfo.style.display === 'none') {
        return;
    }
    renderRaceTraitSelect();
    renderRaceTraitsTable();
}

function initRaceTraitHandlers() {
    const addButton = document.getElementById('addRaceTraitBtn');
    const select = document.getElementById('raceTraitSelect');
    const table = document.getElementById('raceTraitsTable');

    if (addButton) {
        addButton.addEventListener('click', addRaceTrait);
    }

    if (select) {
        select.addEventListener('change', () => {
            if (addButton) {
                addButton.disabled = !select.value;
            }
        });
    }

    if (table) {
        table.addEventListener('click', event => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) return;

            if (target.classList.contains('race-trait-remove-btn')) {
                const traitId = target.dataset.traitId;
                if (traitId) {
                    removeRaceTrait(traitId);
                }
            }
        });
    }

    updateRaceTraitUI();
}
