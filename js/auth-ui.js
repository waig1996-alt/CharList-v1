// ============ AUTH UI — модальные окна авторизации ============
// Зависит от: auth-service.js

var AuthUI = {
    // ========== МОДАЛЬНОЕ ОКНО АВТОРИЗАЦИИ ==========

    /**
     * Показать модалку входа/регистрации.
     * @returns {Promise<string>} — 'server' (вошли через сервер) или 'local' (без аккаунта)
     */
    showAuthModal: function () {
        var self = this;

        return new Promise(function (resolve) {
            var overlay = self._createOverlay();
            overlay.id = 'authModalOverlay';

            var modal = self._createModal('400px');
            modal.innerHTML =
                '<h2 style="text-align:center; margin:0 0 20px 0;">🎭 Добро пожаловать!</h2>' +

                // Табы
                '<div style="display:flex; margin-bottom:20px; border-bottom:2px solid #e0e0e0;">' +
                '<button id="authTabLogin" class="auth-tab active" style="flex:1; padding:10px; border:none; background:none; cursor:pointer; font-weight:bold; color:#2c6e2c; border-bottom:2px solid #2c6e2c; margin-bottom:-2px;">🔑 Вход</button>' +
                '<button id="authTabRegister" class="auth-tab" style="flex:1; padding:10px; border:none; background:none; cursor:pointer; color:#888;">📝 Регистрация</button>' +
                '</div>' +

                // Поля
                '<input type="text" id="authLogin" placeholder="Логин" style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ccc; border-radius:8px; box-sizing:border-box; font-size:1rem;">' +
                '<input type="password" id="authPassword" placeholder="Пароль" style="width:100%; padding:12px; margin-bottom:5px; border:1px solid #ccc; border-radius:8px; box-sizing:border-box; font-size:1rem;">' +

                // Ошибка
                '<div id="authError" style="color:#d32f2f; font-size:0.85rem; margin:10px 0; min-height:20px;"></div>' +

                // Кнопка действия
                '<button id="authActionBtn" style="width:100%; padding:14px; background:#2c6e2c; color:white; border:none; border-radius:8px; font-size:1.1rem; cursor:pointer; margin-bottom:15px;">🔑 Войти</button>' +

                // Ссылка «без аккаунта»
                '<div style="text-align:center;">' +
                '<a href="#" id="authSkipLink" style="color:#888; text-decoration:none; font-size:0.9rem;">Продолжить без аккаунта (локально)</a>' +
                '</div>';

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            var mode = 'login'; // 'login' | 'register'
            var loginInput = modal.querySelector('#authLogin');
            var passwordInput = modal.querySelector('#authPassword');
            var errorEl = modal.querySelector('#authError');
            var actionBtn = modal.querySelector('#authActionBtn');
            var tabLogin = modal.querySelector('#authTabLogin');
            var tabRegister = modal.querySelector('#authTabRegister');

            function switchTab(newMode) {
                mode = newMode;
                if (mode === 'login') {
                    tabLogin.className = 'auth-tab active';
                    tabLogin.style.cssText = 'flex:1; padding:10px; border:none; background:none; cursor:pointer; font-weight:bold; color:#2c6e2c; border-bottom:2px solid #2c6e2c; margin-bottom:-2px;';
                    tabRegister.className = 'auth-tab';
                    tabRegister.style.cssText = 'flex:1; padding:10px; border:none; background:none; cursor:pointer; color:#888;';
                    actionBtn.textContent = '🔑 Войти';
                } else {
                    tabRegister.className = 'auth-tab active';
                    tabRegister.style.cssText = 'flex:1; padding:10px; border:none; background:none; cursor:pointer; font-weight:bold; color:#2c6e2c; border-bottom:2px solid #2c6e2c; margin-bottom:-2px;';
                    tabLogin.className = 'auth-tab';
                    tabLogin.style.cssText = 'flex:1; padding:10px; border:none; background:none; cursor:pointer; color:#888;';
                    actionBtn.textContent = '📝 Зарегистрироваться';
                }
                errorEl.textContent = '';
            }

            async function doAction() {
                var login = loginInput.value.trim();
                var password = passwordInput.value;
                errorEl.textContent = '';

                if (!login || !password) {
                    errorEl.textContent = 'Заполните все поля';
                    return;
                }

                actionBtn.disabled = true;
                actionBtn.textContent = '⏳ Подождите...';

                try {
                    if (mode === 'login') {
                        await AuthService.login(login, password);
                    } else {
                        await AuthService.register(login, password);
                    }
                    overlay.remove();
                    resolve('server');
                } catch (e) {
                    errorEl.textContent = e.message;
                    actionBtn.disabled = false;
                    actionBtn.textContent = mode === 'login' ? '🔑 Войти' : '📝 Зарегистрироваться';
                }
            }

            tabLogin.addEventListener('click', function () { switchTab('login'); });
            tabRegister.addEventListener('click', function () { switchTab('register'); });
            actionBtn.addEventListener('click', doAction);
            passwordInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doAction(); });
            loginInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') passwordInput.focus(); });

            modal.querySelector('#authSkipLink').addEventListener('click', function (e) {
                e.preventDefault();
                overlay.remove();
                resolve('local');
            });

            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) {
                    overlay.remove();
                    resolve('local');
                }
            });

            loginInput.focus();
        });
    },

    // ========== МОДАЛЬНОЕ ОКНО ВЫБОРА ПЕРСОНАЖА ==========

    /**
     * Показать модалку со списком персонажей пользователя.
     * @returns {Promise<{action: string, characterId?: number}>}
     *   action: 'load' | 'create' | 'logout'
     *   characterId: ID персонажа для загрузки
     */
    showCharacterSelectModal: function (characters) {
        var self = this;

        return new Promise(async function (resolve) {
            var overlay = self._createOverlay();
            overlay.id = 'charSelectOverlay';

            var modal = self._createModal('500px');

            var charsHtml = '';
            if (characters && characters.length > 0) {
                charsHtml += '<div style="margin-bottom:15px;"><strong>Ваши персонажи (' + characters.length + '/3):</strong></div>';
                characters.forEach(function (c) {
                    var date = new Date(c.updatedAt || c.createdAt);
                    var dateStr = date.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });
                    charsHtml +=
                        '<div class="char-select-item" data-id="' + c.id + '" style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin:8px 0; background:#f8f9fa; border-radius:8px; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background=\'#e8f5e9\';" onmouseout="this.style.background=\'#f8f9fa\';">' +
                        '<div>' +
                        '<strong>' + (c.name || 'Безымянный') + '</strong>' +
                        '<div style="font-size:0.8rem; color:#888;">Обновлён: ' + dateStr + '</div>' +
                        '</div>' +
                        '<div style="display:flex; gap:8px;">' +
                        '<button class="char-delete-btn" data-id="' + c.id + '" style="padding:4px 8px; background:#d32f2f; color:white; border:none; border-radius:4px; cursor:pointer; font-size:0.8rem;">🗑</button>' +
                        '</div>' +
                        '</div>';
                });
            } else {
                charsHtml += '<div style="text-align:center; color:#888; padding:20px;">У вас пока нет персонажей</div>';
            }

            modal.innerHTML =
                '<h2 style="text-align:center; margin:0 0 20px 0;">⚔️ Выбор персонажа</h2>' +
                '<div style="margin-bottom:5px; color:#888; font-size:0.9rem;">👤 ' + (AuthService.getUser() ? AuthService.getUser().login : '') + '</div>' +
                charsHtml +
                '<div style="display:flex; gap:10px; margin-top:20px;">' +
                '<button id="createNewCharBtn" style="flex:1; padding:12px; background:#2c6e2c; color:white; border:none; border-radius:8px; font-size:1rem; cursor:pointer;">🎲 Создать нового</button>' +
                '<button id="logoutBtn" style="padding:12px 20px; background:#888; color:white; border:none; border-radius:8px; cursor:pointer;">🚪 Выйти</button>' +
                '</div>';

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // Клик по карточке персонажа = загрузить
            modal.querySelectorAll('.char-select-item').forEach(function (item) {
                item.addEventListener('click', function (e) {
                    if (e.target.classList.contains('char-delete-btn')) return;
                    var id = parseInt(item.dataset.id);
                    overlay.remove();
                    resolve({ action: 'load', characterId: id });
                });
            });

            // Кнопка удаления
            modal.querySelectorAll('.char-delete-btn').forEach(function (btn) {
                btn.addEventListener('click', async function (e) {
                    e.stopPropagation();
                    var id = parseInt(btn.dataset.id);
                    if (confirm('Удалить персонажа "' + (btn.closest('.char-select-item').querySelector('strong').textContent) + '"?')) {
                        try {
                            await AuthService.deleteCharacter(id);
                            // Обновить список
                            var updated = await AuthService.getMyCharacters();
                            overlay.remove();
                            resolve(await self.showCharacterSelectModal(updated));
                        } catch (e) {
                            alert('Ошибка удаления: ' + e.message);
                        }
                    }
                });
            });

            // Создать нового
            modal.querySelector('#createNewCharBtn').addEventListener('click', function () {
                overlay.remove();
                resolve({ action: 'create' });
            });

            // Выйти
            modal.querySelector('#logoutBtn').addEventListener('click', function () {
                AuthService.clearSession();
                overlay.remove();
                resolve({ action: 'logout' });
            });
        });
    },

    // ========== ХЕЛПЕРЫ ==========

    _createOverlay: function () {
        var overlay = document.createElement('div');
        overlay.className = 'custom-prompt-overlay';
        overlay.style.cssText = 'display:flex; align-items:center; justify-content:center; z-index:10000; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5);';
        return overlay;
    },

    _createModal: function (maxWidth) {
        var modal = document.createElement('div');
        modal.className = 'custom-prompt';
        modal.style.cssText = 'max-width:' + maxWidth + '; padding:25px; background:white; border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,0.3);';
        return modal;
    }
};
