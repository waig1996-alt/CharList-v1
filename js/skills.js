// ============ НАВЫКИ ============
// Зависит от: state.js, constants.js, ui-core.js, utils.js

function getSkillBonus(skillName) {
    let attr = attrMap[skillName] || "wis";
    let mod = getMod(attr);
    let isProf = state.customSkills.find(s => s.name === skillName)?.proficient || false;
    if (isProf) mod += getProfBonus();
    let extra = state.skillExtraBonuses[skillName]?.bonus || 0;
    return mod + extra;
}

function renderSkills() {
    let container = document.getElementById('skillsContainer');
    if (!container) return;
    let allSkills = [...defaultSkills];
    state.customSkills.forEach(s => { if (!allSkills.includes(s.name)) allSkills.push(s.name); });
    allSkills.sort();
    container.innerHTML = '';
    allSkills.forEach(skill => {
        let isProficient = state.customSkills.find(s => s.name === skill)?.proficient || false;
        let bonus = getSkillBonus(skill);
        let extra = state.skillExtraBonuses[skill] || { bonus: 0, desc: "" };
        let div = document.createElement('div');
        div.className = 'skill-row';
        div.innerHTML = '<span class="skill-name">' + (skill) + '</span> <span class="skill-bonus">' + ((bonus >= 0 ? '+' : '') + bonus) + '</span> <input type="number" class="extra-bonus-input" data-skill="' + (skill) + '" value="' + (extra.bonus) + '" placeholder="бонус" style="width:50px;"> <input type="text" class="extra-desc-input" data-skill="' + (skill) + '" value="' + (extra.desc) + '" placeholder="описание" style="width:80px;"> <label><input type="checkbox" class="skill-profic" data-skill="' + (skill) + '" ' + (isProficient ? 'checked' : '') + '> мастерство</label> <button class="skill-roll dice" data-bonus="' + (bonus) + '"></button>';
        container.appendChild(div);
    });

    document.querySelectorAll('.extra-bonus-input').forEach(inp => {
        inp.onchange = () => {
            let skill = inp.dataset.skill;
            let val = parseInt(inp.value) || 0;
            if (!state.skillExtraBonuses[skill]) state.skillExtraBonuses[skill] = { bonus: 0, desc: "" };
            state.skillExtraBonuses[skill].bonus = val;
            renderSkills();
            autoSave();
        };
    });

    document.querySelectorAll('.extra-desc-input').forEach(inp => {
        inp.onchange = () => {
            let skill = inp.dataset.skill;
            let val = inp.value;
            if (!state.skillExtraBonuses[skill]) state.skillExtraBonuses[skill] = { bonus: 0, desc: "" };
            state.skillExtraBonuses[skill].desc = val;
            autoSave();
        };
    });

    document.querySelectorAll('.skill-profic').forEach(cb => {
        cb.onchange = () => {
            let skill = cb.dataset.skill;
            let existing = state.customSkills.find(s => s.name === skill);
            if (existing) existing.proficient = cb.checked;
            else state.customSkills.push({ name: skill, proficient: cb.checked });
            renderSkills();
            autoSave();
        };
    });

    document.querySelectorAll('.skill-roll').forEach(btn => {
        btn.onclick = () => {
            let bonus = parseInt(btn.dataset.bonus);
            let skillName = btn.parentElement.querySelector('.skill-name').innerText.trim();
            rollD20(bonus, skillName, addToLog);
        };
    });
}
