// ============ КЛАССОВЫЕ РЕСУРСЫ ============
// Зависит от: state.js, constants.js, ui-core.js, class-resource-registry.js
//
// ПОСЛЕ РЕФАКТОРИНГА: вся логика calcMax() в ClassResourceRegistry.
// Здесь — только рендеринг и обработчики, без единого if/else по имени класса.

function renderClassResource() {
    var container = document.getElementById('classResourceContainer');
    if (!container) return;

    var className = state.primaryClass;
    var result = calcClassResourceMax(className);

    if (!result.config) {
        container.innerHTML = '';
        return;
    }

    var maxValue = result.max;
    var resource = state.classResources[className];

    // Синхронизация state с рассчитанным max
    resource.max = maxValue;
    resource.current = Math.min(resource.current, maxValue);
    if (maxValue === Infinity) {
        resource.current = Infinity;
    }
    resource.name = result.config.name;

    var maxDisplay = maxValue === Infinity ? "∞" : maxValue;
    var currentDisplay = maxValue === Infinity ? "∞" : resource.current;

    // Если ресурс = 0 (warlock или класс без ресурсов) — не показываем
    if (maxDisplay === 0 && currentDisplay === 0) {
        container.innerHTML = '';
        return;
    }

    var html =
        '<div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0; padding: 8px; background: var(--stat-bg); border-radius: 16px;">' +
        '<strong>⭐ ' + resource.name + ':</strong>' +
        '<span id="resourceCounter">' + currentDisplay + '/' + maxDisplay + '</span>' +
        '<button id="useResourceBtn" class="dice" style="background: #8b5cf6;">⚡ Использовать</button>' +
        '<button id="restoreResourceBtn" class="dice" style="background: #2c6e2c;">🔄 Восстановить</button>' +
        '</div>';

    container.innerHTML = html;

    // === ОБОБЩЁННЫЙ ОБРАБОТЧИК «ИСПОЛЬЗОВАТЬ» (без if/else по классам) ===
    var useBtn = document.getElementById('useResourceBtn');
    if (useBtn) {
        useBtn.addEventListener('click', function () {
            var r = state.classResources[state.primaryClass];
            if (r.max === Infinity) {
                addToLog('✨ ' + r.name + ': бесконечное использование!');
                return;
            }
            if (r.current > 0) {
                r.current = Math.max(0, r.current - 1);
                renderClassResource();
                addToLog('✨ Использован ' + r.name + ' (' + r.current + '/' + r.max + ')');
                autoSave();
            } else {
                addToLog('❌ Нет доступных ' + r.name + '!');
            }
        });
    }

    // === ОБОБЩЁННЫЙ ОБРАБОТЧИК «ВОССТАНОВИТЬ» (без if/else по классам) ===
    var restoreBtn = document.getElementById('restoreResourceBtn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', function () {
            var r = state.classResources[state.primaryClass];
            r.current = (r.max === Infinity) ? Infinity : r.max;
            renderClassResource();
            addToLog('🔄 Восстановлены ' + r.name);
            autoSave();
        });
    }
}
