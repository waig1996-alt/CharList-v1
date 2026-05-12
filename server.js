const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { sequelize, Character, Spell, Race, ClassModel } = require('./models/database');

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
            const rows = await Spell.findAll({ order: [['name', 'ASC']] });
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

    if (pathname === '/api/races') {
        if (method === 'GET') {
            const rows = await Race.findAll({ order: [['name', 'ASC']] });
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

    if (pathname === '/api/classes') {
        if (method === 'GET') {
            const rows = await ClassModel.findAll({ order: [['name', 'ASC']] });
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

    return sendError(res, 'API route not found', 404);
}

async function startServer() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        const server = http.createServer(async (req, res) => {
            const parsed = url.parse(req.url || '', true);
            const pathname = parsed.pathname || '/';

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
