# Character API Documentation

## Обзор

REST API для управления данными персонажей D&D 5e. API предоставляет доступ к расам, классам, заклинаниям и персонажам с поддержкой фильтрации и CRUD операций.

База данных: SQLite  
Сервер: Node.js + Express-like (чистый HTTP)  
Порт: 3000 (по умолчанию)

## Базовые эндпоинты

### Статус сервера
- **GET** `/api/status`
  - Возвращает информацию о статусе сервера и базы данных

### Персонажи (Characters)
- **GET** `/api/characters` - Получить все персонажи
- **GET** `/api/characters/:id` - Получить персонажа по ID
- **POST** `/api/characters` - Создать нового персонажа
- **PUT** `/api/characters/:id` - Обновить персонажа
- **DELETE** `/api/characters/:id` - Удалить персонажа

### Расы (Races)
- **GET** `/api/races` - Получить все расы
- **GET** `/api/races/:id` - Получить расу по ID
- **POST** `/api/races` - Создать новую расу
- **PUT** `/api/races/:id` - Обновить расу
- **DELETE** `/api/races/:id` - Удалить расу

### Классы (Classes)
- **GET** `/api/classes` - Получить все классы
- **GET** `/api/classes/:id` - Получить класс по ID
- **POST** `/api/classes` - Создать новый класс
- **PUT** `/api/classes/:id` - Обновить класс
- **DELETE** `/api/classes/:id` - Удалить класс

### Заклинания (Spells)
- **GET** `/api/spells` - Получить все заклинания
- **GET** `/api/spells/:id` - Получить заклинание по ID
- **POST** `/api/spells` - Создать новое заклинание
- **PUT** `/api/spells/:id` - Обновить заклинание
- **DELETE** `/api/spells/:id` - Удалить заклинание

## Фильтрация и поиск

### Расы
- **GET** `/api/races?name=Эльф` - Поиск по имени (регистронезависимый)
- **GET** `/api/races?id=1` - Поиск по ID

### Классы
- **GET** `/api/classes?name=Воин` - Поиск по имени (регистронезависимый)
- **GET** `/api/classes?id=5` - Поиск по ID

### Заклинания
- **GET** `/api/spells?name=Огненный шар` - Поиск по имени (регистронезависимый)
- **GET** `/api/spells?level=3` - Фильтр по уровню
- **GET** `/api/spells?school=Воплощение` - Фильтр по школе (регистронезависимый)
- **GET** `/api/spells?id=10` - Поиск по ID

## Форматы данных

### Персонаж (Character)
```json
{
  "id": 1,
  "name": "Артур",
  "sheetData": "{\"level\": 5, \"class\": \"Воин\"}",
  "tags": "[\"человек\", \"воин\"]",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Раса (Race)
```json
{
  "id": 1,
  "name": "Эльф",
  "description": "Элегантные и долгоживущие эльфы...",
  "traits": "[\"Острое зрение\", \"Магическая природа\"]",
  "jsonData": "{\"abilityBoosts\": {\"dex\": 2}, \"speed\": 30}",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Класс (Class)
```json
{
  "id": 1,
  "name": "Воин",
  "description": "Мастерские бойцы...",
  "hitDice": "d10",
  "jsonData": "{\"saves\": [\"str\", \"con\"], \"skills\": [\"Атлетика\"]}",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Заклинание (Spell)
```json
{
  "id": 1,
  "name": "Огненный шар",
  "description": "Яркий луч света вырывается...",
  "level": 3,
  "school": "Воплощение",
  "jsonData": "{\"castingTime\": \"1 действие\", \"range\": \"150 футов\"}",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Примеры запросов

### Создание новой расы
```bash
curl -X POST http://localhost:3000/api/races \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Дварф",
    "description": "Крепкие горные жители",
    "traits": ["Устойчивость", "Каменное знание"],
    "jsonData": {
      "abilityBoosts": {"con": 2, "wis": 1},
      "speed": 25,
      "darkvision": 60
    }
  }'
```

### Поиск заклинаний 3 уровня
```bash
curl "http://localhost:3000/api/spells?level=3"
```

### Обновление класса
```bash
curl -X PUT http://localhost:3000/api/classes/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Воин",
    "description": "Обновленное описание",
    "hitDice": "d10"
  }'
```

### Поиск рас по имени
```bash
curl "http://localhost:3000/api/races?name=эльф"
```

## Автоматическое заполнение базы

При первом запуске сервера база данных автоматически заполняется начальными данными:

- 16 рас (Человек, Эльф, Карлик, и т.д.)
- 12 классов (Варвар, Бард, Жрец, и т.д.)
- 10 заклинаний (Волшебная стрела, Огненный шар, и т.д.)

Для ручного заполнения используйте скрипты:

```bash
npm run seed:races    # Загрузить расы
npm run seed:classes  # Загрузить классы
npm run seed:spells   # Загрузить заклинания
npm run seed:all      # Загрузить всё
```

## Запуск сервера

```bash
npm start
```

Сервер будет доступен по адресу: `http://localhost:3000`

## Ошибки

API возвращает ошибки в формате:
```json
{
  "error": "Описание ошибки"
}
```

Коды HTTP:
- 200: Успех
- 201: Создано
- 400: Неверный запрос
- 404: Не найдено
- 500: Внутренняя ошибка сервера