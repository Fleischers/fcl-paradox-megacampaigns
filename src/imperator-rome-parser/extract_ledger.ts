import * as fs from 'fs';
import * as zlib from 'zlib';

// Інтерфейси для JSON сейву Imperator: Rome
interface CurrencyData {
    gold?: number;
    manpower?: number;
}

interface TechData {
    technology_level?: number;
}

interface CountryData {
    tag?: string;
    has_capital?: boolean;
    capital?: number;
    num_of_cities?: number;
    owned_provinces?: number[];
    total_population?: number;
    currency_data?: CurrencyData;
    technology?: TechData;
    monarch?: number;
    ruler?: number;
    primary_culture?: string;
    religion?: string;
}

interface SaveData {
    country?: Record<string, CountryData>;
    countries?: Record<string, CountryData>;
}

const SAVE_FILE_PATH = 'E:\\Games\\paradox_tools\\FCL1-2026-08-02-b.json'; // вкажіть назву вашого файлу


function buildCountryMap(saveData: SaveData): Record<string, CountryData> {
    let mgr: any = (saveData as any).country || (saveData as any).countries;

    if (mgr && !Array.isArray(mgr) && typeof mgr === 'object') {
        return mgr as Record<string, CountryData>;
    }

    if (Array.isArray(mgr)) {
        const map: Record<string, CountryData> = {};
        for (const item of mgr) {
            const key = item?.tag ?? (typeof item?.country_id !== 'undefined' ? String(item.country_id) : undefined) ?? JSON.stringify(item).slice(0, 12);
            map[key] = item;
        }
        return map;
    }

    // Heuristic: scan top-level for objects/arrays that look like countries
    for (const [k, v] of Object.entries(saveData as any)) {
        if (!v) continue;
        if (typeof v === 'object' && !Array.isArray(v)) {
            const keys = Object.keys(v);
            if (keys.length > 0) {
                const sample = v[keys[0]];
                if (sample && typeof sample === 'object' && (sample.tag || sample.primary_culture || sample.religion || sample.owned_provinces)) {
                    return v as Record<string, CountryData>;
                }
            }
        }
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object' && (v[0].tag || v[0].country_id)) {
            const map: Record<string, CountryData> = {};
            for (const item of v) {
                const key = item?.tag ?? (typeof item?.country_id !== 'undefined' ? String(item.country_id) : undefined) ?? JSON.stringify(item).slice(0, 12);
                map[key] = item;
            }
            return map;
        }
    }

    return {};
}


function processSaveJson(jsonPath: string = './save.json'): void {
    if (!fs.existsSync(jsonPath)) {
        console.error(`❌ Файл ${jsonPath} не знайдено!`);
        return;
    }

    console.log('Читаємо save.json...');
    const rawBuffer = fs.readFileSync(jsonPath);

    function tryParseBuffer(buf: Buffer): SaveData {
        // Try UTF-8 first
        try {
            const s = buf.toString('utf8');
            return JSON.parse(s) as SaveData;
        } catch (_) {}

        // Try UTF-16 LE (common on Windows) next
        try {
            let s = buf.toString('utf16le');
            s = s.replace(/^\uFEFF/, '');
            return JSON.parse(s) as SaveData;
        } catch (_) {}

        // If file looks gzipped, try to gunzip and parse
        try {
            if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
                const dec = zlib.gunzipSync(buf);
                try {
                    return JSON.parse(dec.toString('utf8')) as SaveData;
                } catch (_) {
                    return JSON.parse(dec.toString('utf16le')) as SaveData;
                }
            }
        } catch (_) {}

        // Try UTF-16 BE by swapping bytes (then interpreting as utf16le)
        try {
            const swapped = Buffer.from(buf);
            swapped.swap16();
            let s = swapped.toString('utf16le');
            s = s.replace(/^\uFEFF/, '');
            return JSON.parse(s) as SaveData;
        } catch (_) {}

        // Last resort: try replacing any leading BOM and parse as utf8, and print diagnostics
        try {
            let s = buf.toString('utf8');
            s = s.replace(/^\uFEFF/, '');
            return JSON.parse(s) as SaveData;
        } catch (err) {
            try {
                const head = buf.slice(0, 32);
                console.error('❌ Не вдалось розпізнати кодування або файл пошкоджено.');
                console.error(`   Розмір файлу: ${buf.length} bytes`);
                console.error(`   Початкові байти (hex): ${head.toString('hex')}`);
            } catch (_) {}
            throw err;
        }
    }

    const saveData: SaveData = tryParseBuffer(rawBuffer);

    const countryManager = buildCountryMap(saveData);

    if (!countryManager || Object.keys(countryManager).length === 0) {
        console.error('❌ Не вдалося знайти блок країн у JSON сейву.');
        try { console.error('   Top-level keys: ' + Object.keys(saveData as any).join(', ')); } catch (_) {}
        return;
    }

    console.log('\n=== ЗВІТ ПО КРАЇНАХ ДЛЯ LEDGER ===\n');

    // Diagnostics: counts and quick overview to explain empty output
    const allEntries = Object.entries(countryManager);
    const totalCountries = allEntries.length;
    const withTag = allEntries.filter(([, c]) => !!c?.tag).length;
    const territories = allEntries.map(([id, c]) => ({ id, tag: c?.tag ?? null, territories: (c?.num_of_cities ?? c?.owned_provinces?.length ?? 0) }));
    const overThreshold = territories.filter(t => t.territories > 20).length;
    console.log(`DEBUG: total countries=${totalCountries}, withTag=${withTag}, territories>20=${overThreshold}`);
    // show top 10 by territory count
    territories.sort((a, b) => b.territories - a.territories);
    console.log('DEBUG: top countries by territories:', territories.slice(0, 10).map(t => `${t.tag ?? t.id}:${t.territories}`).join(', '));

    for (const [id, cData] of Object.entries(countryManager)) {
        if (!cData.tag) continue;

        const numTerritories = cData.num_of_cities ?? cData.owned_provinces?.length ?? 0;

        // Показуємо лише країни з понад 20 територіями (гравці / регіональні держави)
        if (numTerritories > 20) {
            console.log(`🏳️ [${cData.tag}] (ID: ${id})`);
            console.log(`   🏞️  Території: ${numTerritories}`);
            console.log(`   👥  Населення (Pops): ${cData.total_population ?? 'N/A'}`);
            console.log(`   💰  Казна: ${cData.currency_data?.gold ?? 'N/A'}`);
            console.log(`   🔬  Рівень техн.: ${cData.technology?.technology_level ?? 'N/A'}`);
            console.log(`   👑  Правитель ID: ${cData.monarch ?? cData.ruler ?? 'N/A'}`);
            console.log(`   🏛️  Культура / Релігія: ${cData.primary_culture ?? 'N/A'} / ${cData.religion ?? 'N/A'}`);
            console.log('-----------------------------------');
        }
    }
}

const argvPath = process.argv[2] || SAVE_FILE_PATH;
processSaveJson(argvPath);