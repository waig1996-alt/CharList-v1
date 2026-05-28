// ============ AUTH SERVICE — API обёртка для авторизации ============
// Никакого UI — только fetch-запросы к серверу.

var AuthService = {
    _token: null,
    _user: null,

    // ========== СОСТОЯНИЕ СЕССИИ ==========

    /** Сохранить токен в памяти + localStorage */
    setSession: function (token, user) {
        this._token = token;
        this._user = user;
        localStorage.setItem('dnd_auth_token', token);
        localStorage.setItem('dnd_auth_user', JSON.stringify(user));
    },

    /** Загрузить сессию из localStorage (при перезагрузке страницы) */
    loadSession: function () {
        var token = localStorage.getItem('dnd_auth_token');
        var userStr = localStorage.getItem('dnd_auth_user');
        if (token && userStr) {
            try {
                this._token = token;
                this._user = JSON.parse(userStr);
                return true;
            } catch (e) {}
        }
        return false;
    },

    /** Очистить сессию (выход) */
    clearSession: function () {
        this._token = null;
        this._user = null;
        localStorage.removeItem('dnd_auth_token');
        localStorage.removeItem('dnd_auth_user');
    },

    /** Есть ли активная сессия */
    isLoggedIn: function () {
        return !!this._token;
    },

    /** Текущий пользователь */
    getUser: function () {
        return this._user;
    },

    /** Токен */
    getToken: function () {
        return this._token;
    },

    // ========== API ЗАПРОСЫ ==========

    /**
     * POST /api/auth/register
     * @returns {Promise<{token, user}>}
     */
    register: async function (login, password) {
        var response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: login, password: password })
        });
        var data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка регистрации');
        this.setSession(data.token, data.user);
        return data;
    },

    /**
     * POST /api/auth/login
     * @returns {Promise<{token, user}>}
     */
    login: async function (login, password) {
        var response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ login: login, password: password })
        });
        var data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка входа');
        this.setSession(data.token, data.user);
        return data;
    },

    /**
     * GET /api/auth/me
     * @returns {Promise<Object>}
     */
    getMe: async function () {
        var response = await fetch('/api/auth/me', {
            headers: { 'Authorization': 'Bearer ' + this._token }
        });
        var data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Сессия истекла');
        return data;
    },

    /**
     * GET /api/characters/mine
     * @returns {Promise<Array>}
     */
    getMyCharacters: async function () {
        var response = await fetch('/api/characters/mine', {
            headers: { 'Authorization': 'Bearer ' + this._token }
        });
        if (!response.ok) throw new Error('Ошибка загрузки персонажей');
        return await response.json();
    },

    /**
     * Загрузить полные данные персонажа с сервера.
     * @param {number} characterId
     * @returns {Promise<Object>}
     */
    loadCharacter: async function (characterId) {
        var response = await fetch('/api/characters/' + characterId, {
            headers: { 'Authorization': 'Bearer ' + this._token }
        });
        if (!response.ok) throw new Error('Ошибка загрузки персонажа');
        var data = await response.json();
        try {
            return JSON.parse(data.sheetData);
        } catch (e) {
            throw new Error('Ошибка парсинга данных персонажа');
        }
    },

    /**
     * Сохранить персонажа на сервер.
     * @param {Object} options — { name, sheetData, characterId? }
     * @returns {Promise<Object>}
     */
    saveCharacter: async function (options) {
        var body = {
            name: options.name || 'Безымянный',
            sheetData: options.sheetData || '{}',
            userId: this._user ? this._user.id : undefined
        };
        if (options.characterId) body.id = options.characterId;

        var response = await fetch('/api/characters', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + this._token
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            var errData = await response.json();
            throw new Error(errData.error || 'Ошибка сохранения');
        }
        return await response.json();
    },

    /**
     * Удалить персонажа с сервера.
     * @param {number} characterId
     */
    deleteCharacter: async function (characterId) {
        var response = await fetch('/api/characters/' + characterId, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + this._token }
        });
        if (!response.ok) throw new Error('Ошибка удаления персонажа');
    }
};
