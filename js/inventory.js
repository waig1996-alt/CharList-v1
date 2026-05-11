// ============ ИНВЕНТАРЬ, СПОСОБНОСТИ, ЗАМЕТКИ ============
// Зависит от: state.js, ui-core.js, utils.js

function renderInventory() {
    let ul = document.getElementById('inventoryList');
    if (!ul) return;
    ul.innerHTML = '';
    state.inventoryItems.forEach((it, i) => {
        let hasCounter = it.useCounter === true;
        let qty = it.qty || 0;
        let counterHtml = '';
        if (hasCounter) {
            counterHtml = '<div style="margin-top:4px;">' +
                '<button class="qty-dec qty-btn" data-idx="' + i + '">-</button>' +
                '<span class="item-quantity">' + qty + '</span>' +
                '<button class="qty-inc qty-btn" data-idx="' + i + '">+</button>' +
                '</div>';
        }
        let li = document.createElement('li');
        li.className = 'inventory-item';
        li.innerHTML = '<div><strong>' + it.name + '</strong>' +
            (it.desc ? ' — ' + it.desc : '') +
            (hasCounter ? ' (×' + qty + ')' : '') +
            counterHtml +
            '</div><button class="del-item remove-btn" data-idx="' + i + '">🗑</button>';
        ul.appendChild(li);
    });

    document.querySelectorAll('.qty-inc').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            if (state.inventoryItems[idx] && state.inventoryItems[idx].useCounter) {
                state.inventoryItems[idx].qty = (state.inventoryItems[idx].qty || 0) + 1;
                renderInventory();
                autoSave();
            }
        };
    });

    document.querySelectorAll('.qty-dec').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            if (state.inventoryItems[idx] && state.inventoryItems[idx].useCounter && state.inventoryItems[idx].qty > 0) {
                state.inventoryItems[idx].qty--;
                renderInventory();
                autoSave();
            }
        };
    });

    document.querySelectorAll('.del-item').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            state.inventoryItems.splice(idx, 1);
            renderInventory();
            autoSave();
        };
    });
}

function renderFeatures() {
    let container = document.getElementById('featuresList');
    if (!container) return;
    container.innerHTML = '';
    state.features.forEach((f, i) => {
        let li = document.createElement('li');
        li.className = 'feature-item';
        li.innerHTML = '<strong>⭐ ' + f.name + '</strong>' +
            (f.desc ? ' — ' + f.desc : '') +
            '<button class="remove-feature remove-btn" data-idx="' + i + '">🗑</button>';
        container.appendChild(li);
    });

    document.querySelectorAll('.remove-feature').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            state.features.splice(idx, 1);
            renderFeatures();
            autoSave();
            addToLog('🗑 Способность удалена');
        };
    });
}

function renderNotes() {
    let container = document.getElementById('notesList');
    if (!container) return;
    container.innerHTML = '';
    state.notes.forEach((note, idx) => {
        let li = document.createElement('li');
        li.className = 'note-item';
        li.innerHTML = '<div><strong>📌 ' + (note.title) + '</strong></div> <div> <button class="open-note-btn dice" data-idx="' + (idx) + '">📖 Открыть</button> <button class="delete-note-btn remove-btn" data-idx="' + (idx) + '">🗑 Удалить</button> </div>';
        container.appendChild(li);
    });

    document.querySelectorAll('.open-note-btn').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            let note = state.notes[idx];
            if (note) openNoteModal(idx, note.title, note.desc);
        };
    });

    document.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            if (confirm('Удалить заметку "' + state.notes[idx].title + '"?')) {
                state.notes.splice(idx, 1);
                renderNotes();
                autoSave();
                addToLog('🗑 Заметка удалена.');
            }
        };
    });
}
