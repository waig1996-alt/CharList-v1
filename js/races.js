/**
 * Полные данные рас D&D 5e с бонусами, способностями и языками
 */

const races = {
    "Человек": {
        name: "Человек",
        abilityBoosts: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
        speed: 30,
        darkvision: 0,
        traits: [
            "Достижение: Получите одно дополнительное мастерство",
            "Универсальный: Получите один дополнительный точка в распределении умений"
        ],
        languages: ["Общий"],
        resistances: [],
        description: "Люди — самая адаптивная и амбициозная раса, заселяющая большинство земель."
    },
    "Эльф": {
        name: "Эльф",
        abilityBoosts: { dex: 2 },
        speed: 30,
        darkvision: 60,
        traits: [
            "Острое зрение: Преимущество на проверки Восприятия, основанные на зрении",
            "Магическая природа: Сопротивление магическому сну",
            "Транс вместо сна: Не спите. Вместо этого медитируйте 4 часа в день"
        ],
        languages: ["Общий", "Эльфийский"],
        resistances: [],
        description: "Элегантные и долгоживущие эльфы, известны своей магией и мастерством."
    },
    "Полуэльф": {
        name: "Полуэльф",
        abilityBoosts: { cha: 2, str: 1, dex: 1, con: 1, int: 1, wis: 1 },
        speed: 30,
        darkvision: 60,
        traits: [
            "Врожденные умения: Выберите три умения, получите бонус +2 к ним",
            "Магическое наследие: Выучите один заговор, который понравится",
            "Сопротивление магии: Сопротивление магическому сну"
        ],
        languages: ["Общий", "Эльфийский"],
        resistances: [],
        description: "Полуэльфы — наследники обоих миров, очень социальны и харизматичны."
    },
    "Карлик": {
        name: "Карлик",
        abilityBoosts: { con: 2, wis: 1 },
        speed: 25,
        darkvision: 60,
        traits: [
            "Устойчивость: Преимущество на спасброски против яда",
            "Каменное знание: Навык Архитектуры, инженерии и кузнечного дела",
            "Боевая подготовка: Владение боевыми топорами и молотами",
            "Толстая шкура: Сопротивление урону яда"
        ],
        languages: ["Общий", "Дварфийский"],
        resistances: ["Яд"],
        description: "Карлики — крепкие горные жители, известны своей стойкостью и мастерством."
    },
    "Гном": {
        name: "Гном",
        abilityBoosts: { int: 2, cha: 1 },
        speed: 25,
        darkvision: 60,
        traits: [
            "Гномская хитрость: Преимущество на спасброски Интеллекта, Мудрости и Харизмы против магии",
            "Естественный механик: Бонус к проверкам Ремесла и Магии при работе с механизмами",
            "Крошечные размеры: Могут пробираться через узкие пространства"
        ],
        languages: ["Общий", "Гномский"],
        resistances: [],
        description: "Гномы — изобретательные и веселые создания, известны своим интеллектом."
    },
    "Полурослик": {
        name: "Полурослик",
        abilityBoosts: { dex: 2, cha: 1 },
        speed: 25,
        darkvision: 0,
        traits: [
            "Счастливчик: Если вы выбросили 1 на d20, можете перебросить",
            "Смелый: Имеет преимущество на спасброски от испуга",
            "Проворство: Может двигаться сквозь пространство, занятое большим существом",
            "Естественный скрытник: Может попытаться спрятаться за чем-то немного больше себя"
        ],
        languages: ["Общий", "Полуросликовый"],
        resistances: [],
        description: "Полурослики — крошечные, удачливые и любящие комфорт существа."
    },
    "Драконорожденный": {
        name: "Драконорожденный",
        abilityBoosts: { str: 2, cha: 1 },
        speed: 30,
        darkvision: 60,
        traits: [
            "Сопротивление: Выберите тип урона, получайте сопротивление ему",
            "Дыхание дракона: Выпустите дыхание в конусе (доп. действие, 1/короткий отдых)",
            "Боевое наследие: Владение простым и боевым оружием"
        ],
        languages: ["Общий", "Драконий"],
        resistances: ["По выбору"],
        description: "Мощные гуманоиды с драконьим наследием, исключительно физически развитые."
    },
    "Гнолл": {
        name: "Гнолл",
        abilityBoosts: { str: 2, con: 1 },
        speed: 30,
        darkvision: 60,
        traits: [
            "Звериный инстинкт: Преимущество на проверки Восприятия (обоняние)",
            "Мощь дикости: При попадании в ближнем бою добавьте урон",
            "Охотничий опыт: Преимущество на проверки Скрытности в природной местности"
        ],
        languages: ["Общий", "Гнолльский"],
        resistances: [],
        description: "Гнеллы — гуманоидные существа, похожие на гиен, с охотничьими инстинктами."
    },
    "Полуорк": {
        name: "Полуорк",
        abilityBoosts: { str: 2, con: 1, int: -2 },
        speed: 30,
        darkvision: 60,
        traits: [
            "Угрожающий вид: Преимущество на проверки Запугивания",
            "Упорство: Если проверка Силы не удалась, можете повторить один раз",
            "Мощное телосложение: Считаетесь на одну категорию больше при поднятии грузов",
            "Мощный удар: Если попали, добавьте костью урона оружию"
        ],
        languages: ["Общий", "Оркский"],
        resistances: [],
        description: "Полуорки — сильные и дикие гибриды, часто сталкивающиеся с предубеждением."
    },
    "Тифлинг": {
        name: "Тифлинг",
        abilityBoosts: { cha: 2, int: 1 },
        speed: 30,
        darkvision: 60,
        traits: [
            "Наследие инферно: Выучите один заговор, соответствующий вашей природе",
            "Адское сопротивление: Сопротивление урону огнём",
            "Инфернальные наследники: Выглядите нечеловечески (рога, хвост, странная кожа)",
            "Врожденное колдовство: Один раз в день произнесите заклинание магии инфернала"
        ],
        languages: ["Общий", "Инфернальный"],
        resistances: ["Огонь"],
        description: "Тифлинги — притворные потомки инфернальных существ, часто отверженные."
    },
    "Эладрин": {
        name: "Эладрин",
        abilityBoosts: { int: 2, wis: 1 },
        speed: 30,
        darkvision: 60,
        traits: [
            "Фейное происхождение: Иммунитет к магическому сну",
            "Временное изменение: Один раз в короткий отдых телепортируйтесь",
            "Магический аспект: Выучите один заговор магии",
            "Врожденное колдовство: Может влиять на погоду вокруг себя"
        ],
        languages: ["Общий", "Сильван"],
        resistances: [],
        description: "Эладрины — магические существа, произошедшие из загадочных земель."
    },
    "Гоблин": {
        name: "Гоблин",
        abilityBoosts: { dex: 2, con: 1 },
        speed: 30,
        darkvision: 60,
        traits: [
            "Ловкость: Может использовать Ловкость вместо Силы для инициативы",
            "Невидимость: Может попытаться спрятаться даже в слабом укрытии",
            "Мастерство прыжков: Максимальная дальность прыжков увеличена",
            "Боевой транспорт: Может ездить верхом на вспомогательном существе"
        ],
        languages: ["Общий", "Гоблинский"],
        resistances: [],
        description: "Гоблины — маленькие, хитрые существа, часто работают по найму."
    },
    "Орк": {
        name: "Орк",
        abilityBoosts: { str: 2, con: 1, int: -2 },
        speed: 30,
        darkvision: 60,
        traits: [
            "Мощное телосложение: Категория размера на одну больше",
            "Агрессор: Когда попали атакой, добавьте костью урона",
            "Боевой опыт: Преимущество при попытке запугивания врагов",
            "Боевой дух: Может получить дополнительное действие для атаки"
        ],
        languages: ["Общий", "Оркский"],
        resistances: [],
        description: "Орки — воинственные существа, известные своей физической мощью."
    },
    "Таур": {
        name: "Таур",
        abilityBoosts: { str: 2, wis: 1, dex: -1 },
        speed: 35,
        darkvision: 60,
        traits: [
            "Рогатая атака: Природное оружие с рогами (1к8 урона)",
            "Тяжелое телосложение: Может поднимать в два раза больше",
            "Природное равновесие: Не падает при попытке сбить с ног",
            "Ароматический след: Враги имеют недостаток на попытку скрыться от вас"
        ],
        languages: ["Общий", "Таурский"],
        resistances: [],
        description: "Тауры — могучие существа похожие на центавров, кочевники и воины."
    },
    "Хромозаур": {
        name: "Хромозаур",
        abilityBoosts: { str: 1, con: 1, wis: 1 },
        speed: 30,
        darkvision: 60,
        traits: [
            "Древний интеллект: Не восприимчивы к глупым замечаниям",
            "Природная броня: КД = 13 + модификатор ловкости",
            "Температурный контроль: Сопротивление урону холодом",
            "Примитивное мышление: Погрузитесь в первозданное состояние"
        ],
        languages: ["Общий", "Драконий"],
        resistances: ["Холод"],
        description: "Хромозавры — древние рептилоиды, носители забытых знаний природы."
    }
};

function parseRaceRecord(record) {
    let jsonData = {};
    try {
        jsonData = typeof record.jsonData === 'string' ? JSON.parse(record.jsonData) : record.jsonData || {};
    } catch (error) {
        console.warn('Не удалось разобрать jsonData для расы', record.name, error);
        jsonData = {};
    }

    let traits = [];
    try {
        if (typeof record.traits === 'string') {
            traits = JSON.parse(record.traits);
        } else if (Array.isArray(record.traits)) {
            traits = record.traits;
        } else {
            traits = [];
        }
    } catch (error) {
        console.warn('Не удалось разобрать traits для расы', record.name, error);
        traits = [];
    }

    return {
        name: record.name,
        description: record.description || '',
        traits,
        abilityBoosts: jsonData.abilityBoosts || {},
        speed: jsonData.speed || 0,
        darkvision: jsonData.darkvision || 0,
        languages: jsonData.languages || [],
        resistances: jsonData.resistances || []
    };
}

async function loadRaceOptionsFromDb() {
    const select = document.getElementById('charRace');
    if (!select) return;

    select.innerHTML = '<option value="">Выберите расу</option>';

    try {
        const response = await fetch('/api/races');
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        const raceRows = await response.json();
        if (!Array.isArray(raceRows) || raceRows.length === 0) {
            throw new Error('Empty race list from DB');
        }

        raceRows.sort((a, b) => a.name.localeCompare(b.name, 'ru')); 

        raceRows.forEach((raceRow) => {
            const raceData = parseRaceRecord(raceRow);
            races[raceData.name] = raceData;

            const option = document.createElement('option');
            option.value = raceData.name;
            option.textContent = raceData.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки рас из БД:', error);
        Object.keys(races).sort((a, b) => a.localeCompare(b, 'ru')).forEach((raceName) => {
            const option = document.createElement('option');
            option.value = raceName;
            option.textContent = raceName;
            select.appendChild(option);
        });
    }
}

/**
 * Получить данные расы
 */
function getRaceData(raceName) {
    return races[raceName] || null;
}

/**
 * Применить расовые бонусы к характеристикам
 */
function applyRaceBoosts(raceName) {
    const raceData = getRaceData(raceName);
    if (!raceData) return;

    const boosts = raceData.abilityBoosts;
    const previousBonuses = state.appliedRaceBoosts || {};

    // Откатить старые бонусы если была другая раса
    Object.entries(previousBonuses).forEach(([ability, bonus]) => {
        const statElement = document.getElementById(ability);
        if (statElement) {
            const currentValue = parseInt(statElement.value) || 10;
            statElement.value = Math.max(3, currentValue - bonus);
        }
    });

    // Применить новые бонусы
    Object.entries(boosts).forEach(([ability, bonus]) => {
        const statElement = document.getElementById(ability);
        if (statElement) {
            const currentValue = parseInt(statElement.value) || 10;
            statElement.value = currentValue + bonus;
        }
    });

    // Сохранить применённые бонусы
    state.appliedRaceBoosts = boosts;
    
    // Обновить UI
    updateUI();
    addToLog(`⭐ Применены расовые бонусы: ${raceName}`);
}

/**
 * Откатить расовые бонусы
 */
function revertRaceBoosts() {
    if (!state.appliedRaceBoosts) return;

    Object.entries(state.appliedRaceBoosts).forEach(([ability, bonus]) => {
        const statElement = document.getElementById(ability);
        if (statElement) {
            const currentValue = parseInt(statElement.value) || 10;
            statElement.value = Math.max(3, currentValue - bonus);
        }
    });

    state.appliedRaceBoosts = null;
    updateUI();
}

/**
 * Открыть модальное окно информации о расе
 */
function openRaceModal(raceName) {
    const raceData = getRaceData(raceName);
    if (!raceData) return;

    const modal = document.getElementById('raceInfoModal');
    if (!modal) return;

    // Заполнить информацию о расе
    document.getElementById('raceModalTitle').textContent = raceData.name;
    document.getElementById('raceDescription').textContent = raceData.description;

    // Бонусы к характеристикам
    const isDarkMode = document.body.classList.contains('dark');
    const boostsHtml = Object.entries(raceData.abilityBoosts)
        .map(([ability, bonus]) => {
            const abilityNames = { str: 'Сила', dex: 'Ловкость', con: 'Телосложение', 
                                   int: 'Интеллект', wis: 'Мудрость', cha: 'Харизма' };
            const sign = bonus > 0 ? '+' : '';
            let color;
            if (isDarkMode) {
                color = bonus > 0 ? '#90ee90' : '#ff7a6a';
            } else {
                color = bonus > 0 ? '#0d4620' : '#6b1a10';
            }
            const labelColor = isDarkMode ? '#f0e0c0' : '#2c1a12';
            return `<div class="race-boost-item"><div style="margin-bottom: 5px; color: ${labelColor};">${abilityNames[ability]}</div><strong style="color: ${color}; font-size: 1.3rem;">${sign}${bonus}</strong></div>`;
        })
        .join('');
    document.getElementById('raceBoosts').innerHTML = boostsHtml;

    // Характеристики
    document.getElementById('raceSpeed').textContent = raceData.speed + ' фт';
    document.getElementById('raceDarkvision').textContent = raceData.darkvision ? raceData.darkvision + ' фт' : 'Нет';

    // Способности
    const traitsHtml = raceData.traits
        .map(trait => `<li>${trait}</li>`)
        .join('');
    document.getElementById('raceTraits').innerHTML = traitsHtml;

    // Языки
    const languagesHtml = raceData.languages
        .map(lang => `<span class="race-badge">${lang}</span>`)
        .join(' ');
    document.getElementById('raceLanguages').innerHTML = languagesHtml;

    // Сопротивления
    if (raceData.resistances.length > 0) {
        const resistanceStyle = isDarkMode ? 'background: linear-gradient(135deg, #8b3c2a 0%, #6b1a10 100%);' : 'background: linear-gradient(135deg, #c2975b 0%, #a0754a 100%);';
        const resistancesHtml = raceData.resistances
            .map(res => `<span class="race-badge" style="${resistanceStyle}">${res}</span>`)
            .join(' ');
        document.getElementById('raceResistances').innerHTML = resistancesHtml;
        document.getElementById('raceResistancesSection').style.display = 'block';
    } else {
        document.getElementById('raceResistancesSection').style.display = 'none';
    }

    modal.style.display = 'flex';
}

/**
 * Закрыть модальное окно информации о расе
 */
function closeRaceModal() {
    const modal = document.getElementById('raceInfoModal');
    if (modal) modal.style.display = 'none';
}

/**
 * Применить бонусы и закрыть модаль
 */
function applyAndCloseRaceModal(raceName) {
    applyRaceBoosts(raceName);
    closeRaceModal();
}
