// ============ АТАКИ ============
// Зависит от: state.js, constants.js, ui-core.js, utils.js

function renderAttacks() {
    let container = document.getElementById('attacksList');
    if (!container) return;
    container.innerHTML = '';
    state.attacks.forEach((a, idx) => {
        let attrName = attrDisplayNames[a.attr] || a.attr;
        let li = document.createElement('li');
        li.className = 'attack-item';
        li.dataset.idx = idx;
        li.innerHTML = '<div><strong>' + (a.name) + '</strong> <span style="font-size:0.7rem;">(' + (attrName) + ')</span> (' + (a.dice) + ')</div> <div> <button class="attack-roll dice" data-idx="' + (idx) + '">🎲 атака</button> <button class="attack-damage dice" data-idx="' + (idx) + '" data-dice="' + (a.dice) + '">💥 урон</button> <button class="remove-attack remove-btn" data-idx="' + (idx) + '">🗑</button> </div>';
        container.appendChild(li);
    });

    document.querySelectorAll('.attack-roll').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            let a = state.attacks[idx];
            if (!a) return;
            let attrMod = getMod(a.attr);
            let prof = a.proficient ? getProfBonus() : 0;
            let attackBonus = attrMod + prof;
            rollD20(attackBonus, 'Атака: ' + a.name, addToLog);
        };
    });

    document.querySelectorAll('.attack-damage').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            let a = state.attacks[idx];
            if (!a) return;
            rollDamage(a.dice, addToLog, 'Урон: ' + a.name);
        };
    });

    document.querySelectorAll('.remove-attack').forEach(btn => {
        btn.onclick = () => {
            let idx = parseInt(btn.dataset.idx);
            state.attacks.splice(idx, 1);
            renderAttacks();
            autoSave();
        };
    });
}
