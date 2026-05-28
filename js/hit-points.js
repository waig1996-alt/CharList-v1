// ============ МОДЕЛЬ ХИТОВ (HP, temp HP, death saves, rests) ============
// Зависит от: state.js
//
// Инкапсулирует всю логику управления хитами персонажа.
// hp-system.js делегирует сюда, а не мутирует state напрямую.

var HitPoints = {
    // ========== ГЕТТЕРЫ ==========

    /** Текущие хиты (без временных) */
    current: function () { return state.currentHp; },

    /** Максимальные хиты */
    max: function () { return state.maxHp; },

    /** Временные хиты */
    temp: function () { return state.tempHp; },

    /** Эффективные хиты (основные + временные) */
    effective: function () { return state.currentHp + state.tempHp; },

    // ========== ПРЕДИКАТЫ ==========

    isUnconscious: function () { return state.currentHp <= 0; },
    isDead: function () { return state.deathFail >= 3; },
    isStabilized: function () { return state.deathSuccess >= 3; },

    // ========== ЛЕЧЕНИЕ / УРОН ==========

    /**
     * Вылечить указанное количество хитов (не выше максимума).
     * @param {number} amount
     * @returns {{ healed: number, newHp: number }}
     */
    heal: function (amount) {
        if (amount <= 0) return { healed: 0, newHp: state.currentHp };

        var oldHp = state.currentHp;
        state.currentHp = Math.min(state.maxHp, state.currentHp + amount);
        var healed = state.currentHp - oldHp;

        return { healed: healed, newHp: state.currentHp };
    },

    /**
     * Нанести урон. Сначала поглощаются временные хиты, потом основные.
     * @param {number} amount — входящий урон (положительное число)
     * @returns {{ total: number, tempAbsorbed: number, realDamage: number, isUnconscious: boolean }}
     */
    damage: function (amount) {
        if (amount <= 0) return { total: 0, tempAbsorbed: 0, realDamage: 0, isUnconscious: false };

        var remaining = amount;
        var tempAbsorbed = Math.min(state.tempHp, remaining);
        state.tempHp -= tempAbsorbed;
        remaining -= tempAbsorbed;

        var realDamage = Math.min(state.currentHp, remaining);
        state.currentHp -= realDamage;

        return {
            total: amount,
            tempAbsorbed: tempAbsorbed,
            realDamage: realDamage,
            isUnconscious: this.isUnconscious()
        };
    },

    // ========== ВРЕМЕННЫЕ ХИТЫ ==========

    /**
     * Установить временные хиты.
     * @param {number} amount
     */
    setTemp: function (amount) {
        state.tempHp = Math.max(0, amount);
        var el = document.getElementById('tempHp');
        if (el) el.value = state.tempHp;
    },

    /** Сбросить временные хиты в 0 */
    clearTemp: function () {
        state.tempHp = 0;
        var el = document.getElementById('tempHp');
        if (el) el.value = 0;
    },

    // ========== СПАСБРОСКИ СМЕРТИ ==========

    /**
     * Бросить спасбросок смерти.
     * @returns {{ roll: number, isSuccess: boolean, successCount: number, failCount: number, isStabilized: boolean, isDead: boolean }}
     */
    rollDeathSave: function () {
        var roll = Math.floor(Math.random() * 20) + 1;
        var isSuccess = roll >= 10;

        if (isSuccess) {
            state.deathSuccess = Math.min(3, state.deathSuccess + 1);
        } else {
            state.deathFail = Math.min(3, state.deathFail + 1);
        }

        return {
            roll: roll,
            isSuccess: isSuccess,
            successCount: state.deathSuccess,
            failCount: state.deathFail,
            isStabilized: this.isStabilized(),
            isDead: this.isDead()
        };
    },

    /** Сбросить счётчики спасбросков смерти */
    resetDeathSaves: function () {
        state.deathSuccess = 0;
        state.deathFail = 0;
    },

    // ========== ОТДЫХ ==========

    /**
     * Короткий отдых.
     * В D&D 5e позволяет потратить кости хитов — здесь просто логируется.
     */
    shortRest: function () {
        // В текущей реализации — только логирование.
        // Кости хитов пока не реализованы.
        return { type: 'short' };
    },

    /**
     * Долгий отдых: полное восстановление HP, сброс временных хитов,
     * сброс спасбросков смерти, снижение истощения на 1.
     */
    longRest: function () {
        state.currentHp = state.maxHp;
        state.tempHp = 0;
        state.deathSuccess = 0;
        state.deathFail = 0;

        // Снижение истощения
        var exhaustionEl = document.getElementById('exhaustion');
        if (exhaustionEl) {
            var exhaustion = parseInt(exhaustionEl.value) || 0;
            if (exhaustion > 0) {
                exhaustion--;
                exhaustionEl.value = exhaustion;
            }
        }

        var tempHpEl = document.getElementById('tempHp');
        if (tempHpEl) tempHpEl.value = 0;

        return { type: 'long', exhaustionReduced: true };
    },

    // ========== DOM-СИНХРОНИЗАЦИЯ ==========

    /**
     * Обновить все DOM-элементы, связанные с HP.
     */
    syncDOM: function () {
        var currentHpEl = document.getElementById('currentHp');
        if (currentHpEl) {
            currentHpEl.innerHTML = this.effective() +
                '<span style="font-size:0.7rem;">(+' + state.tempHp + ' вр.)</span>';
        }

        var maxHpEl = document.getElementById('maxHp');
        if (maxHpEl) maxHpEl.innerText = state.maxHp;

        var deathSuccessEl = document.getElementById('deathSuccess');
        if (deathSuccessEl) deathSuccessEl.innerText = state.deathSuccess;

        var deathFailEl = document.getElementById('deathFail');
        if (deathFailEl) deathFailEl.innerText = state.deathFail;

        var tempHpEl = document.getElementById('tempHp');
        if (tempHpEl) tempHpEl.value = state.tempHp;
    },

    /** Обновить значение maxHpInput из state */
    syncMaxHpInput: function () {
        var el = document.getElementById('maxHpInput');
        if (el) el.value = state.maxHp;
    }
};
