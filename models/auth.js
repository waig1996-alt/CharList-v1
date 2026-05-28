// ============ АУТЕНТИФИКАЦИЯ — bcrypt + JWT ============
// Зависимости: bcryptjs, jsonwebtoken

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('./database');

// Секрет для JWT. В production должен быть в переменных окружения.
const JWT_SECRET = process.env.JWT_SECRET || 'dnd-charsheet-secret-2026';
const JWT_EXPIRES_IN = '7d'; // токен живёт 7 дней
const BCRYPT_ROUNDS = 10;
const MAX_CHARACTERS_PER_USER = 3;

// ========== ХЭШИРОВАНИЕ ПАРОЛЕЙ ==========

async function hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// ========== JWT ==========

function generateToken(user) {
    return jwt.sign(
        { userId: user.id, login: user.login },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
}

// ========== MIDDLEWARE ==========

/**
 * Извлечь пользователя из заголовка Authorization: Bearer <token>.
 * Возвращает { userId, login } или null.
 */
function extractUser(req) {
    var authHeader = req.headers['authorization'];
    if (!authHeader) return null;

    var parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    var payload = verifyToken(parts[1]);
    if (!payload) return null;

    return { userId: payload.userId, login: payload.login };
}

/**
 * Middleware: требует авторизацию.
 * Вызывает next(user) если токен валиден, иначе 401.
 * Использование: authRequired(req, res, function(user) { ... })
 */
function authRequired(req, res, next) {
    var user = extractUser(req);
    if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Требуется авторизация' }));
        return;
    }
    next(user);
}

// ========== РЕГИСТРАЦИЯ / ЛОГИН ==========

/**
 * POST /api/auth/register
 * Body: { login, password }
 */
async function register(body) {
    if (!body || !body.login || !body.password) {
        return { error: 'Логин и пароль обязательны', status: 400 };
    }

    var login = body.login.trim();
    var password = body.password;

    if (login.length < 3) {
        return { error: 'Логин должен быть не менее 3 символов', status: 400 };
    }
    if (password.length < 4) {
        return { error: 'Пароль должен быть не менее 4 символов', status: 400 };
    }

    // Проверить, не занят ли логин
    var existing = await User.findOne({ where: { login: login } });
    if (existing) {
        return { error: 'Пользователь с таким логином уже существует', status: 409 };
    }

    var hashed = await hashPassword(password);
    var user = await User.create({ login: login, password: hashed });

    var token = generateToken(user);
    return {
        status: 201,
        data: {
            token: token,
            user: { id: user.id, login: user.login }
        }
    };
}

/**
 * POST /api/auth/login
 * Body: { login, password }
 */
async function login(body) {
    if (!body || !body.login || !body.password) {
        return { error: 'Логин и пароль обязательны', status: 400 };
    }

    var user = await User.findOne({ where: { login: body.login.trim() } });
    if (!user) {
        return { error: 'Неверный логин или пароль', status: 401 };
    }

    var valid = await comparePassword(body.password, user.password);
    if (!valid) {
        return { error: 'Неверный логин или пароль', status: 401 };
    }

    var token = generateToken(user);
    return {
        status: 200,
        data: {
            token: token,
            user: { id: user.id, login: user.login }
        }
    };
}

/**
 * GET /api/auth/me
 * Требует авторизацию.
 */
async function getMe(user) {
    var dbUser = await User.findByPk(user.userId);
    if (!dbUser) {
        return { error: 'Пользователь не найден', status: 404 };
    }

    var characterCount = await dbUser.countCharacters();
    return {
        status: 200,
        data: {
            id: dbUser.id,
            login: dbUser.login,
            characterCount: characterCount,
            maxCharacters: MAX_CHARACTERS_PER_USER,
            created: dbUser.createdAt
        }
    };
}

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    extractUser,
    authRequired,
    register,
    login,
    getMe,
    MAX_CHARACTERS_PER_USER,
    JWT_SECRET
};
