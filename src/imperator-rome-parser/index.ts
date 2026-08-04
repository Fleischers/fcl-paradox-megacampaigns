const fs = require('fs');
const readline = require('readline');

// Список тегів країн гравців / ключових AI для відстеження
const TARGET_TAGS = [
    'TUS', // Tuscia
    'TAR', // Tartessia / Turdetania
    'DAC', // Dacia
    'MAC', // Macedonia
    'SCY', // Scythia / Roxolania
    'BEL', // Belgia / Remia
    'ARM', // Greater Armenia
    'ALB', // Albion / Icenia
    'SUI', // Suionia
    'MAU'  // Mauretania
];

// Шлях до вашого розпакованого (melted) сейв-файлу або JSON
const SAVE_FILE_PATH = './gamestate.rome'; // вкажіть назву вашого файлу

async function parseSave() {
    if (!fs.existsSync(SAVE_FILE_PATH)) {
        console.error(`❌ Файл ${SAVE_FILE_PATH} не знайдено! Перевірте шлях.`);
        return;
    }

    console.log(`🔍 Розпочинаємо аналіз сейву: ${SAVE_FILE_PATH}...`);

    const fileStream = fs.createReadStream(SAVE_FILE_PATH, { encoding: 'utf8' });
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let state = 'ROOT';
    let currentBlock = '';

    // Результати
    const wonders = [];
    const treasures = [];
    const countries = {};

    let lineBuffer = [];

    for await (const line of rl) {
        const trimmed = line.trim();

        // Пошук Великих Чудес (Great Wonders)
        if (trimmed.includes('great_wonder=') || trimmed.includes('great_wonders=')) {
            state = 'WONDERS';
        }

        // Режим швидкого парсингу тегів країн
        TARGET_TAGS.forEach(tag => {
            if (trimmed.startsWith(`tag="${tag}"`) || trimmed === `tag=${tag}`) {
                if (!countries[tag]) {
                    countries[tag] = { tag: tag };
                }
            }
        });

        // Витягуємо назви та локації чудес / артефактів
        if (trimmed.startsWith('custom_name=') || trimmed.startsWith('name=')) {
            const match = trimmed.match(/"([^"]+)"/);
            if (match && state === 'WONDERS') {
                wonders.push(match[1]);
            }
        }
    }

    console.log('\n==========================================');
    console.log('🗿 ЗНАЙДЕНІ ВЕЛИКІ ЧУДЕСА ТА АРТЕФАКТИ');
    console.log('==========================================');
    if (wonders.length > 0) {
        wonders.slice(0, 15).forEach((w, i) => console.log(`${i + 1}. 🏛️ Чудо/Споруда: ${w}`));
    } else {
        console.log('⚠️ Звичайний пошук чудес потребує глибшого тексту або списку з блоку great_wonder_manager.');
    }

    console.log('\n==========================================');
    console.log('📊 ПОРАДА ДЛЯ ОПТИМАЛЬНОЇ ОБРОБКИ ЧЕРЕЗ RAKALY');
    console.log('==========================================');
    console.log('Якщо ви використовуєте Rakaly CLI, виконайте команду:');
    console.log(`👉 rakaly json "${SAVE_FILE_PATH}" > save.json`);
    console.log('Після цього ви отримаєте зручний JSON-файл.');
}

parseSave().catch(console.error);