// Action panel: buttons for Action, Bonus, Reaction and End Turn
// Adds modal lists and basic class-trigger hooks (fighter/paladin)

(function(){
    const basicActions = {
        action: [
            { key: 'attack', title: 'Атаковать' },
            { key: 'dash', title: 'Бросок (Dash)' },
            { key: 'disengage', title: 'Отойти (Disengage)' },
            { key: 'dodge', title: 'Уклониться (Dodge)' },
            { key: 'use_item', title: 'Использовать предмет' },
            { key: 'cast_spell', title: 'Заклинание' }
        ],
        bonus: [
            { key: 'bonus_attack', title: 'Бонусная атака' },
            { key: 'bonus_item', title: 'Использовать предмет (бонус) ' },
            { key: 'bonus_spell', title: 'Заклинание (бонус)'}
        ],
        reaction: [
            { key: 'reaction_default', title: 'Реакция (по ситуации)' },
            { key: 'opportunity', title: 'Атака возможности' },
            { key: 'counterspell', title: 'Контрзаклинание/интервент' }
        ]
    };

    function initActionPanel(){
        document.addEventListener('click', (e)=>{
            // close modal when clicking outside
            if (e.target.classList && e.target.classList.contains('action-modal-overlay')) {
                e.target.remove();
            }
        });

        const buttons = document.querySelectorAll('.action-btn[data-type]');
        buttons.forEach(btn => {
            const type = btn.dataset.type;
            btn.addEventListener('click', (ev)=>{
                ev.preventDefault();
                if (!isButtonAvailable(type)) return;
                openActionModal(type);
            });
        });

        const endBtn = document.getElementById('endTurnBtn');
        if (endBtn) endBtn.addEventListener('click', () => {
            resetActionPanel();
            if (typeof addToLog === 'function') addToLog('🔄 Круг завершён — кнопки сброшены.');
        });

        // restore visual state from state.actionPanel if present
        if (window.state && state.actionPanel) {
            Object.keys(state.actionPanel).forEach(t => {
                if (state.actionPanel[t] && state.actionPanel[t].used) setButtonUsedVisual(t, state.actionPanel[t].label);
            });
        }
    }

    function isButtonAvailable(type){
        const btn = document.querySelector(`.action-btn[data-type="${type}"]`);
        if (!btn) return false;
        // if data-used and no temporary extra, not available
        if (btn.classList.contains('used')){
            // allow if there is a temporary extra for this type
            if (state._tempExtra && state._tempExtra.type === type && state._tempExtra.remaining > 0) return true;
            return false;
        }
        return true;
    }

    function openActionModal(type){
        const overlay = document.createElement('div');
        overlay.className = 'action-modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'action-modal';
        modal.innerHTML = `<h3>${type === 'action' ? 'Действие' : type === 'bonus' ? 'Бонусное действие' : 'Реакция'}</h3>`;

        const optionsWrap = document.createElement('div');
        optionsWrap.className = 'action-options';

        const list = [];
        // basic actions
        (basicActions[type] || []).forEach(a => list.push(Object.assign({source:'basic'}, a)));

        // personal attacks
        if (Array.isArray(state.attacks) && state.attacks.length > 0) {
            state.attacks.forEach(at => list.push({ key: 'attack_' + (at.name||'unnamed'), title: 'Атака: ' + (at.name||'Атака'), sub: at.damage || '', source: 'attack' }));
        }

        // spells
        if (Array.isArray(state.spells) && state.spells.length > 0) {
            state.spells.forEach(sp => list.push({ key: 'spell_' + (sp.name||'unnamed'), title: 'Заклинание: ' + (sp.name||'Заклинание'), sub: sp.level === 0 ? 'Заговор' : ('Уровень ' + sp.level), source: 'spell', spell: sp }));
        }

        // class resources
        if (state.multClasses && Array.isArray(state.multClasses)){
            Object.keys(state.classResources || {}).forEach(cls => {
                const res = state.classResources[cls];
                if (res && res.current > 0) {
                    list.push({ key: 'classres_' + cls, title: `${res.name} (${classNames[cls]||cls})`, sub: `${res.current}/${res.max}`, source: 'classres', cls });
                }
            });
        }

        // fighter action surge quick access
        if (state.classResources && state.classResources.fighter && state.classResources.fighter.current > 0) {
            if (type === 'action') list.unshift({ key: 'action_surge', title: 'Всплеск действий (Action Surge)', sub: 'использует ресурс воина', source: 'special' });
        }

        // render options
        list.forEach(opt => {
            const el = document.createElement('div');
            el.className = 'action-option';
            el.innerHTML = `<div style="width:32px;height:32px;border-radius:6px;background:#fff2;display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--text-primary);">${opt.source === 'spell' ? '✨' : opt.source === 'attack' ? '⚔' : '•'}</div>` +
                           `<div style="display:flex;flex-direction:column;flex:1;"><span class="title">${opt.title}</span><span class="sub">${opt.sub||''}</span></div>`;
            el.addEventListener('click', ()=>{
                handleActionSelected(type, opt);
                overlay.remove();
            });
            optionsWrap.appendChild(el);
        });

        modal.appendChild(optionsWrap);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    function handleActionSelected(type, opt){
        const label = opt.title || opt.key || 'Действие';
        // consume class resource if needed
        if (opt.source === 'classres' && opt.cls) {
            if (state.classResources && state.classResources[opt.cls]){
                state.classResources[opt.cls].current = Math.max(0, state.classResources[opt.cls].current - 1);
                if (typeof addToLog === 'function') addToLog(`🔸 Использовано: ${label}`);
            }
        }
        if (opt.key === 'action_surge'){
            if (state.classResources && state.classResources.fighter && state.classResources.fighter.current > 0){
                state.classResources.fighter.current = Math.max(0, state.classResources.fighter.current - 1);
                // allow re-use of action button once
                state._tempExtra = { type: 'action', remaining: 1, reason: 'action_surge' };
                // ensure button is not permanently marked used
                enableButtonTemporarily('action');
                if (typeof addToLog === 'function') addToLog('⚡ Всплеск действий использован — одно дополнительное действие.');
                return setButtonUsed('action', 'Всплеск действий');
            }
        }

        // if spell chosen, we won't auto-consume slots here; keep visual only
        setButtonUsed(type, label);
        if (typeof addToLog === 'function') addToLog(`✅ ${label} (${type})`);

        // class-specific triggers: paladin extra attack
        checkClassTriggers(type, opt);
    }

    function checkClassTriggers(type, opt){
        // Paladin: if first action was an attack, enable one extra attack as action (simple heuristic)
        if (state.primaryClass === 'paladin' && type === 'action'){
            if ((opt.key && opt.key.startsWith('attack')) || (opt.title && opt.title.toLowerCase().includes('атак'))){
                state._tempExtra = { type: 'action', remaining: 1, reason: 'paladin_extra_attack' };
                enableButtonTemporarily('action');
                if (typeof addToLog === 'function') addToLog('🔔 Паладин: дополнительная атака доступна (условие выполнено).');
            }
        }
    }

    function enableButtonTemporarily(type){
        const btn = document.querySelector(`.action-btn[data-type="${type}"]`);
        if (!btn) return;
        btn.classList.remove('used');
        btn.removeAttribute('data-used');
    }

    function setButtonUsed(type, label){
        // mark state
        state.actionPanel = state.actionPanel || {};
        state.actionPanel[type] = { used: true, label };
        // visual
        setButtonUsedVisual(type, label);
        // reduce temp extra if used to consume it
        if (state._tempExtra && state._tempExtra.type === type && state._tempExtra.remaining > 0){
            state._tempExtra.remaining = Math.max(0, state._tempExtra.remaining - 1);
            if (state._tempExtra.remaining === 0) delete state._tempExtra;
        }
    }

    function setButtonUsedVisual(type, label){
        const btn = document.querySelector(`.action-btn[data-type="${type}"]`);
        if (!btn) return;
        btn.classList.add('used');
        btn.setAttribute('data-used','1');
        const circle = btn.querySelector('.action-circle');
        if (circle) {
            // show short label/emoji
            let short = label;
            if (label.length > 10) short = label.slice(0,10) + '…';
            circle.innerText = short;
        }
    }

    function resetActionPanel(){
        // clear visuals
        document.querySelectorAll('.action-btn[data-type]').forEach(btn => {
            btn.classList.remove('used');
            btn.removeAttribute('data-used');
            const type = btn.dataset.type;
            const circle = btn.querySelector('.action-circle');
            if (circle){
                if (type === 'action') circle.innerText = '⚪';
                else if (type === 'bonus') circle.innerText = '⚪';
                else if (type === 'reaction') circle.innerText = '⚪';
            }
        });
        // clear temp extras and state mapping
        if (state._tempExtra) delete state._tempExtra;
        if (state.actionPanel) state.actionPanel = {};
    }

    // expose some functions for other modules/tests
    window.actionPanelAPI = {
        init: initActionPanel,
        setUsed: setButtonUsed,
        reset: resetActionPanel,
        isAvailable: isButtonAvailable
    };

    // init on DOM ready
    document.addEventListener('DOMContentLoaded', initActionPanel);
})();
