const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { Sequelize, Op } = require('sequelize');
const { sequelize, User, Character, Spell, Race, ClassModel } = require('./models/database');
const { raceSeed, classSeed, spellSeed } = require('./models/seed-data');
const {
    register, login, getMe,
    extractUser, authRequired, MAX_CHARACTERS_PER_USER
} = require('./models/auth');
const {
    localizeSpell, localizeSpells,
    buildClassSpellMap, getFullClassMap,
    getSpellClassesEn, getAllClasses
} = require('./models/spell-utils');
const {
    getClassProgression, getSpellSlots,
    mergeMulticlassSlots, isSpellcasterClass
} = require('./models/class-progression');

const PORT = process.env.PORT || 3000;
const publicRoot = path.join(__dirname);

function sendJson(res, data, status = 200) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data));
}

function sendError(res, message, status = 500) {
    sendJson(res, { error: message }, status);
}

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
        '.ttf': 'font/ttf'
    };
    return map[ext] || 'application/octet-stream';
}

function serveStatic(filePath, res) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            sendError(res, 'Файл не найден', 404);
            return;
        }
        res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
        res.end(content);
    });
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', () => {
            if (!body) {
                resolve(null);
                return;
            }
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}

function normalizeObjectData(obj) {
    if (!obj || typeof obj !== 'object') return {};
    return obj;
}

async function seedRacesIfEmpty() {
    const count = await Race.count();
    if (count > 0) {
        return;
    }

    const records = raceSeed.map(race => ({
        name: race.name,
        description: race.description,
        traits: JSON.stringify(race.traits),
        jsonData: JSON.stringify(race.jsonData)
    }));

    await Race.bulkCreate(records);
    console.log(`Seeded ${records.length} races into the database.`);
}

async function seedClassesIfEmpty() {
    const count = await ClassModel.count();
    if (count > 0) {
        return;
    }

    const records = classSeed.map(cls => ({
        name: cls.name,
        description: cls.description,
        hitDice: cls.hitDice,
        jsonData: JSON.stringify(cls.jsonData)
    }));

    await ClassModel.bulkCreate(records);
    console.log(`Seeded ${records.length} classes into the database.`);
}

async function seedSpellsIfEmpty() {
    const count = await Spell.count();
    if (count > 0) {
        return;
    }

    const records = spellSeed.map(spell => ({
        name: spell.name,
        description: spell.description,
        level: spell.level,
        school: spell.school,
        jsonData: JSON.stringify(spell.jsonData)
    }));

    await Spell.bulkCreate(records);
    console.log(`Seeded ${records.length} spells into the database.`);
}

// ========== МИГРАЦИЯ (добавление колонки userId в существующую БД) ==========

async function migrateAddUserId() {
    try {
        const [results] = await sequelize.query(
            "PRAGMA table_info(Characters);"
        );
        const hasUserId = results.some(col => col.name === 'userId');
        if (!hasUserId) {
            await sequelize.query(
                "ALTER TABLE Characters ADD COLUMN userId INTEGER REFERENCES Users(id) ON DELETE SET NULL;"
            );
            console.log('Migration: added userId column to Characters table.');
        }
    } catch (e) {
        console.warn('Migration warning (userId column):', e.message);
    }
}

async function handleApi(req, res, pathname) {
    const method = req.method;

    // ========== АУТЕНТИФИКАЦИЯ ==========

    if (pathname === '/api/auth/register' && method === 'POST') {
        try {
            const body = await parseBody(req);
            const result = await register(body);
            return sendJson(res, result.data || { error: result.error }, result.status);
        } catch (e) {
            console.error('Register error:', e);
            return sendError(res, 'Ошибка регистрации: ' + e.message);
        }
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
        try {
            const body = await parseBody(req);
            const result = await login(body);
            return sendJson(res, result.data || { error: result.error }, result.status);
        } catch (e) {
            console.error('Login error:', e);
            return sendError(res, 'Ошибка входа: ' + e.message);
        }
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
        authRequired(req, res, async function (user) {
            try {
                const result = await getMe(user);
                return sendJson(res, result.data || { error: result.error }, result.status);
            } catch (e) {
                console.error('Me error:', e);
                return sendError(res, 'Ошибка: ' + e.message);
            }
        });
        return;
    }

    // ========== СТАТУС ==========

    if (pathname === '/api/status') {
        return sendJson(res, { status: 'ok', database: 'sqlite', path: path.join('data', 'database.sqlite') });
    }

    if (pathname === '/api/characters') {
        if (method === 'GET') {
            const rows = await Character.findAll({ order: [['updatedAt', 'DESC']] });
            return sendJson(res, rows.map(row => row.toJSON()));
        }

        if (method === 'POST') {
            const body = await parseBody(req);
            if (!body || !body.name || !body.sheetData) {
                return sendError(res, 'Тело запроса должно содержать name и sheetData', 400);
            }

            // Если запрос с авторизацией — проверить лимит
            const authUser = extractUser(req);
            if (authUser && body.userId && body.userId === authUser.userId) {
                const count = await Character.count({ where: { userId: authUser.userId } });
                if (count >= MAX_CHARACTERS_PER_USER) {
                    return sendError(res, 'Достигнут лимит: ' + MAX_CHARACTERS_PER_USER + ' персонажа на пользователя', 403);
                }
            }

            const sheetData = JSON.stringify(normalizeObjectData(body.sheetData));
            const charData = {
                id: body.id || undefined,
                name: body.name,
                sheetData,
                tags: JSON.stringify(body.tags || [])
            };
            if (body.userId) charData.userId = body.userId;

            const [character, created] = await Character.upsert(charData, { returning: true });
            return sendJson(res, character.toJSON(), created ? 201 : 200);
        }
    }

    // Персонажи пользователя (требуется авторизация)
    if (pathname === '/api/characters/mine' && method === 'GET') {
        authRequired(req, res, async function (user) {
            try {
                const rows = await Character.findAll({
                    where: { userId: user.userId },
                    order: [['updatedAt', 'DESC']]
                });
                return sendJson(res, rows.map(function (row) {
                    var json = row.toJSON();
                    return {
                        id: json.id,
                        name: json.name,
                        tags: json.tags,
                        updatedAt: json.updatedAt,
                        createdAt: json.createdAt
                    };
                }));
            } catch (e) {
                console.error('Characters mine error:', e);
                return sendError(res, 'Ошибка: ' + e.message);
            }
        });
        return;
    }

    if (pathname.startsWith('/api/characters/')) {
        const id = pathname.split('/')[3];
        if (!id) return sendError(res, 'ID персонажа не указан', 400);
        if (method === 'GET') {
            const character = await Character.findByPk(id);
            if (!character) return sendError(res, 'Персонаж не найден', 404);
            return sendJson(res, character.toJSON());
        }
        if (method === 'DELETE') {
            const deleted = await Character.destroy({ where: { id } });
            return sendJson(res, { deleted: deleted > 0 });
        }
    }

    if (pathname === '/api/spells') {
        if (method === 'GET') {
            const query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams.entries());
            let where = {};
            if (query.name) {
                where.name = { [Op.like]: `%${query.name}%` };
            }
            if (query.level) {
                where.level = query.level;
            }
            if (query.school) {
                where.school = { [Op.like]: `%${query.school}%` };
            }
            if (query.id) {
                where.id = query.id;
            }

            // Поиск по фильтрам БД (name, level, school, id)
            let rows = await Spell.findAll({ where, order: [['level', 'ASC'], ['name', 'ASC']] });

            // Пост-фильтрация по классу (если указан)
            if (query.class) {
                const targetClass = query.class;
                rows = rows.filter(function (spell) {
                    var classes = getSpellClassesEn(spell.name);
                    return classes.indexOf(targetClass) !== -1;
                });
            }

            // Локализация (если указан язык)
            const lang = query.lang || 'ru';
            const localized = localizeSpells(rows, lang);

            return sendJson(res, localized);
        }
        if (method === 'POST') {
            const body = await parseBody(req);
            if (!body || !body.name || !body.description) {
                return sendError(res, 'Тело запроса должно содержать name и description', 400);
            }
            const spell = await Spell.create({
                name: body.name,
                description: body.description,
                level: body.level || 0,
                school: body.school || '',
                jsonData: JSON.stringify(normalizeObjectData(body.jsonData || {}))
            });
            return sendJson(res, spell.toJSON(), 201);
        }
    }

    // Маппинг «заклинание → классы» (замена eval() на клиенте!)
    if (pathname === '/api/spells/class-map') {
        if (method === 'GET') {
            return sendJson(res, getFullClassMap());
        }
    }

    // Список всех классов из маппинга
    if (pathname === '/api/spells/classes') {
        if (method === 'GET') {
            return sendJson(res, getAllClasses());
        }
    }

    if (pathname.startsWith('/api/spells/')) {
        const id = pathname.split('/')[3];
        if (!id) return sendError(res, 'ID заклинания не указан', 400);
        if (method === 'GET') {
            const spell = await Spell.findByPk(id);
            if (!spell) return sendError(res, 'Заклинание не найдено', 404);
            return sendJson(res, spell.toJSON());
        }
        if (method === 'PUT') {
            const body = await parseBody(req);
            if (!body) return sendError(res, 'Тело запроса обязательно', 400);
            const [updated] = await Spell.update({
                name: body.name,
                description: body.description,
                level: body.level || 0,
                school: body.school || '',
                jsonData: JSON.stringify(normalizeObjectData(body.jsonData || {}))
            }, { where: { id } });
            if (updated === 0) return sendError(res, 'Заклинание не найдено', 404);
            const spell = await Spell.findByPk(id);
            return sendJson(res, spell.toJSON());
        }
        if (method === 'DELETE') {
            const deleted = await Spell.destroy({ where: { id } });
            return sendJson(res, { deleted: deleted > 0 });
        }
    }

    if (pathname === '/api/races') {
        if (method === 'GET') {
            const query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams.entries());
            let where = {};
            if (query.name) {
                where.name = { [Op.like]: `%${query.name}%` };
            }
            if (query.id) {
                where.id = query.id;
            }
            const rows = await Race.findAll({ where, order: [['name', 'ASC']] });
            return sendJson(res, rows.map(row => row.toJSON()));
        }
        if (method === 'POST') {
            const body = await parseBody(req);
            if (!body || !body.name || !body.description) {
                return sendError(res, 'Тело запроса должно содержать name и description', 400);
            }
            const race = await Race.create({
                name: body.name,
                description: body.description,
                traits: JSON.stringify(body.traits || []),
                jsonData: JSON.stringify(normalizeObjectData(body.jsonData || {}))
            });
            return sendJson(res, race.toJSON(), 201);
        }
    }

    if (pathname.startsWith('/api/races/')) {
        const id = pathname.split('/')[3];
        if (!id) return sendError(res, 'ID расы не указан', 400);
        if (method === 'GET') {
            const race = await Race.findByPk(id);
            if (!race) return sendError(res, 'Раса не найдена', 404);
            return sendJson(res, race.toJSON());
        }
        if (method === 'PUT') {
            const body = await parseBody(req);
            if (!body) return sendError(res, 'Тело запроса обязательно', 400);
            const [updated] = await Race.update({
                name: body.name,
                description: body.description,
                traits: JSON.stringify(body.traits || []),
                jsonData: JSON.stringify(normalizeObjectData(body.jsonData || {}))
            }, { where: { id } });
            if (updated === 0) return sendError(res, 'Раса не найдена', 404);
            const race = await Race.findByPk(id);
            return sendJson(res, race.toJSON());
        }
        if (method === 'DELETE') {
            const deleted = await Race.destroy({ where: { id } });
            return sendJson(res, { deleted: deleted > 0 });
        }
    }

    if (pathname === '/api/classes') {
        if (method === 'GET') {
            const query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams.entries());
            let where = {};
            if (query.name) {
                where.name = { [Op.like]: `%${query.name}%` };
            }
            if (query.id) {
                where.id = query.id;
            }
            const rows = await ClassModel.findAll({ where, order: [['name', 'ASC']] });
            return sendJson(res, rows.map(row => row.toJSON()));
        }
        if (method === 'POST') {
            const body = await parseBody(req);
            if (!body || !body.name || !body.description) {
                return sendError(res, 'Тело запроса должно содержать name и description', 400);
            }
            const cls = await ClassModel.create({
                name: body.name,
                description: body.description,
                hitDice: body.hitDice || '',
                jsonData: JSON.stringify(normalizeObjectData(body.jsonData || {}))
            });
            return sendJson(res, cls.toJSON(), 201);
        }
    }

    // Прогрессия класса (spell slots, resources, cantrips)
    if (pathname.startsWith('/api/classes/progression/')) {
        if (method === 'GET') {
            const className = pathname.split('/')[4];
            if (!className) return sendError(res, 'Имя класса не указано', 400);
            const query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams.entries());
            const level = parseInt(query.level) || 1;
            const progression = getClassProgression(className, level);
            return sendJson(res, progression);
        }
    }

    // Ячейки заклинаний для класса (быстрый доступ)
    if (pathname === '/api/classes/spell-slots') {
        if (method === 'GET') {
            const query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams.entries());
            const className = query.class;
            const level = parseInt(query.level) || 1;
            if (!className) return sendError(res, 'Параметр class обязателен', 400);
            const slots = getSpellSlots(className, level);
            return sendJson(res, { className, level, slots });
        }
    }

    // Объединение ячеек для мультикласса
    if (pathname === '/api/classes/multiclass-slots') {
        if (method === 'POST') {
            const body = await parseBody(req);
            if (!body || !body.classes || !Array.isArray(body.classes)) {
                return sendError(res, 'Тело запроса должно содержать массив classes [{className, level}]', 400);
            }
            const slots = mergeMulticlassSlots(body.classes);
            return sendJson(res, { slots });
        }
    }

    if (pathname.startsWith('/api/classes/')) {
        const id = pathname.split('/')[3];
        if (!id) return sendError(res, 'ID класса не указан', 400);
        if (method === 'GET') {
            const cls = await ClassModel.findByPk(id);
            if (!cls) return sendError(res, 'Класс не найден', 404);
            return sendJson(res, cls.toJSON());
        }
        if (method === 'PUT') {
            const body = await parseBody(req);
            if (!body) return sendError(res, 'Тело запроса обязательно', 400);
            const [updated] = await ClassModel.update({
                name: body.name,
                description: body.description,
                hitDice: body.hitDice || '',
                jsonData: JSON.stringify(normalizeObjectData(body.jsonData || {}))
            }, { where: { id } });
            if (updated === 0) return sendError(res, 'Класс не найден', 404);
            const cls = await ClassModel.findByPk(id);
            return sendJson(res, cls.toJSON());
        }
        if (method === 'DELETE') {
            const deleted = await ClassModel.destroy({ where: { id } });
            return sendJson(res, { deleted: deleted > 0 });
        }
    }

    return sendError(res, 'API route not found', 404);
}

async function startServer() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        await migrateAddUserId();
        await seedRacesIfEmpty();
        await seedClassesIfEmpty();
        await seedSpellsIfEmpty();

        // Построить маппинг «заклинание → классы» при старте
        buildClassSpellMap();

        const server = http.createServer(async (req, res) => {
const parsedUrl = new URL(req.url || '/', 'http://localhost');
        const pathname = parsedUrl.pathname || '/';

            if (pathname.startsWith('/api/')) {
                try {
                    await handleApi(req, res, pathname);
                } catch (error) {
                    console.error(error);
                    sendError(res, 'Ошибка сервера: ' + error.message);
                }
                return;
            }

            let safePath = pathname === '/' ? '/index.html' : pathname;
            const filePath = path.join(publicRoot, safePath);
            const normalized = path.normalize(filePath);
            if (!normalized.startsWith(publicRoot)) {
                sendError(res, 'Неверный путь', 400);
                return;
            }

            fs.stat(normalized, (err, stats) => {
                if (err || !stats.isFile()) {
                    sendError(res, 'Файл не найден', 404);
                    return;
                }
                serveStatic(normalized, res);
            });
        });

        server.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
            console.log(`SQLite database path: ${path.join(__dirname, 'data', 'database.sqlite')}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
    }
}

startServer();
