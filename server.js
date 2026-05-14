const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { Sequelize, Op } = require('sequelize');
const { sequelize, Character, Spell, Race, ClassModel } = require('./models/database');
const { raceSeed, classSeed, spellSeed } = require('./models/seed-data');

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

async function handleApi(req, res, pathname) {
    const method = req.method;

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
            const sheetData = JSON.stringify(normalizeObjectData(body.sheetData));
            const [character, created] = await Character.upsert({ id: body.id, name: body.name, sheetData, tags: JSON.stringify(body.tags || []) }, { returning: true });
            return sendJson(res, character.toJSON(), created ? 201 : 200);
        }
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
            const rows = await Spell.findAll({ where, order: [['level', 'ASC'], ['name', 'ASC']] });
            return sendJson(res, rows.map(row => row.toJSON()));
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
        await seedRacesIfEmpty();
        await seedClassesIfEmpty();
        await seedSpellsIfEmpty();
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
