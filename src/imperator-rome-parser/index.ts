import fs from 'fs';
import readline from 'readline';
import zlib from 'zlib';
import { Readable, Transform } from 'stream';
import { StringDecoder } from 'string_decoder';

// Список тегів країн гравців / ключових AI для відстеження
const TARGET_TAGS = [
    'ETR', // Tuscia
    'TAR', // Tartessia / Turdetania
    'GET', // Dacia
    'MAC', // Macedonia
    'SCY', // Scythia / Roxolania
    'REM', // Belgia / Remia
    'ARM', // Greater Armenia
    'ICE', // Albion / Icenia
    'SUI', // Suionia
    'MAU'  // Mauretania
];

// Шлях до вашого розпакованого (melted) сейв-файлу або JSON
// Передавайте шлях першим аргументом CLI: `node index.js path/to/save.rome`
const SAVE_FILE_PATH = process.argv[2] || 'E:\\Games\\paradox_tools\\FCL1-2026-08-02-b_melted.rome'; // вкажіть назву вашого файлу

const TAG_NAMES: Record<string, string> = {
    ETR: 'Tuscia',
    TAR: 'Tartessia',
    GET: 'Dacia',
    MAC: 'Macedonia',
    SCY: 'Scythia',
    REM: 'Belgia',
    ARM: 'Armenia',
    ICE: 'Albion',
    SUI: 'Suionia',
    MAU: 'Mauretania'
};

const ZIP_GAMEDSTATE_NAME = 'gamestate';
const ZIP_SIGNATURE = Buffer.from('PK\x03\x04', 'binary');
const STREAM_TEXT_THRESHOLD = 120 * 1024 * 1024; // 120 MB

function extractEmbeddedZipEntry(buf: Buffer, expectedName?: string): Buffer | null {
    let offset = buf.indexOf(ZIP_SIGNATURE);
    while (offset !== -1 && offset + 30 <= buf.length) {
        const compressionMethod = buf.readUInt16LE(offset + 8);
        const compressedSize = buf.readUInt32LE(offset + 18);
        const uncompressedSize = buf.readUInt32LE(offset + 22);
        const nameLen = buf.readUInt16LE(offset + 26);
        const extraLen = buf.readUInt16LE(offset + 28);
        const headerEnd = offset + 30 + nameLen + extraLen;
        if (headerEnd > buf.length) break;
        const name = buf.slice(offset + 30, offset + 30 + nameLen).toString('utf8');
        if (!expectedName || name === expectedName) {
            const compressed = buf.slice(headerEnd, headerEnd + compressedSize);
            if (compressed.length < compressedSize) break;
            if (compressionMethod === 0) {
                return compressed;
            }
            if (compressionMethod === 8) {
                return zlib.inflateRawSync(compressed);
            }
            return null;
        }
        offset = buf.indexOf(ZIP_SIGNATURE, offset + 4);
    }
    return null;
}

function isLikelyText(text: string): boolean {
    if (!text || text.length === 0) return false;
    const printable = (text.match(/[\t\r\n\x20-\x7e]/g) || []).length;
    if (printable / text.length < 0.65) return false;
    return /(?:tag|country|countries|religion|province|owned_provinces|people|dynasty|ruler)/i.test(text);
}

function tryDecodeText(buffer: Buffer): string | null {
    const utf8 = buffer.toString('utf8').replace(/^\uFEFF/, '');
    if (isLikelyText(utf8)) return utf8;
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
        const text = buffer.toString('utf16le').replace(/^\uFEFF/, '');
        if (isLikelyText(text)) return text;
    }
    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
        const swapped = Buffer.from(buffer);
        swapped.swap16();
        const text = swapped.toString('utf16le').replace(/^\uFEFF/, '');
        if (isLikelyText(text)) return text;
    }
    return null;
}

function extractWonders(content: string): string[] {
    const res: string[] = [];
    const re = /\b(relic|treasure|artifact|holy_relic)\s*=\s*\{([\s\S]*?)\}/gi;
    let m;
    while ((m = re.exec(content)) !== null) {
        const block = m[2] || '';
        const name = (block.match(/name\s*=\s*"([^"]+)"/) || [])[1] || m[1];
        const owner = (block.match(/owner\s*=\s*"?([A-Z0-9_\- ]+)"?/) || [])[1] || 'unknown';
        res.push(`${name} (${owner})`);
    }
    return res;
}

function extractCountriesFromText(full: string, outPath: string) {
    const re = /^(\s*)(\d+)\s*=\s*\{/gm;
    let match;
    const countries: any[] = [];
    while ((match = re.exec(full)) !== null) {
        const start = match.index;
        let openCount = 0;
        let end = -1;
        for (let i = start; i < full.length; i++) {
            if (full[i] === '{') openCount++;
            if (full[i] === '}') openCount--;
            if (openCount === 0) {
                end = i + 1;
                break;
            }
        }
        if (end === -1) continue;
        const block = full.slice(start, end);
        const tagMatch = block.match(/tag\s*=\s*"?([A-Z0-9_]+)"?/);
        const tag = tagMatch ? tagMatch[1] : null;
        if (tag && TARGET_TAGS.includes(tag)) {
            const obj: any = { tag };
            const numCities = block.match(/num_of_cities\s*=\s*(\d+)/);
            if (numCities) obj.num_of_cities = Number(numCities[1]);
            const totalPop = block.match(/total_population\s*=\s*(\d+)/);
            if (totalPop) obj.total_population = Number(totalPop[1]);
            const gold = block.match(/gold\s*=\s*(\d+)/);
            if (gold) obj.gold = Number(gold[1]);
            const tech = block.match(/technology_level\s*=\s*(\d+)/);
            if (tech) obj.technology_level = Number(tech[1]);
            const monarch = block.match(/monarch\s*=\s*(\d+)/);
            if (monarch) obj.monarch = Number(monarch[1]);
            const ruler = block.match(/ruler\s*=\s*(\d+)/);
            if (ruler) obj.ruler = Number(ruler[1]);
            const culture = block.match(/primary_culture\s*=\s*"([^"]+)"/);
            if (culture) obj.primary_culture = culture[1];
            const religion = block.match(/religion\s*=\s*"([^"]+)"/);
            if (religion) obj.religion = religion[1];
            const owned = block.match(/owned_provinces\s*=\s*\{([^}]*)\}/s);
            if (owned) {
                const nums = (owned[1] ?? '').match(/-?\d+/g) || [];
                obj.owned_provinces = nums.map(Number);
                obj.owned_provinces_count = obj.owned_provinces.length;
            }
            const capital = block.match(/\bcapital\s*=\s*(\d+)/);
            if (capital) obj.capital = Number(capital[1]);
            obj.raw = block;
            countries.push(obj);
        }
    }
    fs.writeFileSync(outPath, countries.map(c => JSON.stringify(c)).join('\n') + '\n', 'utf8');
}

function extractAsciiContext(buf: Buffer, idx: number, before = 32, after = 120): string {
    const start = Math.max(0, idx - before);
    const end = Math.min(buf.length, idx + after);
    const segment = buf.slice(start, end).toString('latin1');
    return segment.replace(/[^\t\r\n\x20-\x7e]/g, ' ');
}

function isLikelyTextBuffer(buffer: Buffer): boolean {
    return !!tryDecodeText(buffer);
}

async function createTextReadStream(savePath: string): Promise<NodeJS.ReadableStream> {
    const header = await readSampleHeader(savePath, 4);
    const rawStream = fs.createReadStream(savePath);
    if (header.length >= 2 && header[0] === 0x1f && header[1] === 0x8b) {
        return rawStream.pipe(zlib.createGunzip());
    }
    return rawStream;
}

async function extractBlocksFromStream(savePath: string, startPattern: RegExp): Promise<string[]> {
    const inStream = await createTextReadStream(savePath);
    const rl = readline.createInterface({ input: inStream, crlfDelay: Infinity });
    let collecting = false;
    let collectDepth = 0;
    let buffer: string[] = [];
    const blocks: string[] = [];

    for await (const line of rl) {
        const opens = (line.match(/{/g) || []).length;
        const closes = (line.match(/}/g) || []).length;

        if (!collecting && startPattern.test(line)) {
            collecting = true;
            collectDepth = opens - closes;
            buffer = [line];
            if (collectDepth <= 0) {
                blocks.push(buffer.join('\n'));
                collecting = false;
            }
            continue;
        }

        if (collecting) {
            buffer.push(line);
            collectDepth += opens - closes;
            if (collectDepth <= 0) {
                blocks.push(buffer.join('\n'));
                collecting = false;
            }
        }
    }

    return blocks;
}

async function extractWondersStreaming(savePath: string) {
    const res: string[] = [];
    const blocks = await extractBlocksFromStream(savePath, /\b(relic|treasure|artifact|holy_relic)\s*=\s*\{/i);
    for (const block of blocks) {
        const owner = (block.match(/owner\s*=\s*"?([A-Z0-9_\- ]+)"?/i) || [])[1] || 'unknown';
        const name = (block.match(/name\s*=\s*"([^"]+)"/) || [])[1] || (block.match(/\b(relic|treasure|artifact|holy_relic)\b/i) || [])[1];
        res.push(`${name} (${owner})`);
    }
    return res;
}

async function extractArtifactsStreaming(savePath: string) {
    const res: any[] = [];
    const blocks = await extractBlocksFromStream(savePath, /\b(relic|treasure|artifact|holy_relic)\s*=\s*\{/i);
    for (const block of blocks) {
        const owner = (block.match(/owner\s*=\s*"?([A-Z0-9_\- ]+)"?/i) || [])[1] || null;
        const name = (block.match(/name\s*=\s*"([^"]+)"/) || [])[1] || (block.match(/\b(relic|treasure|artifact|holy_relic)\b/i) || [])[1];
        const province = Number((block.match(/province\s*=\s*(\d+)/) || [])[1] || 0) || null;
        res.push({ type: 'artifact', name, owner, province });
    }
    return res;
}

async function extractBattlesStreaming(savePath: string) {
    const res: any[] = [];
    const blocks = await extractBlocksFromStream(savePath, /\bbattle\s*=\s*\{/i);
    for (const block of blocks) {
        const loc = Number((block.match(/province\s*=\s*(\d+)/) || [])[1] || 0) || null;
        const attacker_losses = Number((block.match(/attacker_losses\s*=\s*(\d+)/) || [])[1] || 0);
        const defender_losses = Number((block.match(/defender_losses\s*=\s*(\d+)/) || [])[1] || 0);
        const total = attacker_losses + defender_losses;
        if (total > 1000) {
            res.push({ loc, attacker_losses, defender_losses, total });
        }
    }
    res.sort((a, b) => b.total - a.total);
    return res.slice(0, 10);
}

async function parseLargeTextSaveStreaming(savePath: string) {
    console.log('⚠️ Великий текстовий сейв виявлено — використовується потоковий парсинг для економії пам’яті.');
    const TEMP_COUNTRIES_PATH = './tmp_countries.ndjson';
    try { fs.writeFileSync(TEMP_COUNTRIES_PATH, ''); } catch (_) { }
    await extractCountriesStreaming(savePath, TEMP_COUNTRIES_PATH);
    const wonders = await extractWondersStreaming(savePath);
    const artifacts = await extractArtifactsStreaming(savePath);
    const battles = await extractBattlesStreaming(savePath);

    const tmp = fs.existsSync(TEMP_COUNTRIES_PATH) ? fs.readFileSync(TEMP_COUNTRIES_PATH, 'utf8') : '';
    const countryLines = tmp.split(/\r?\n/).filter(Boolean);
    const countriesData = countryLines.map(l => {
        try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);

    const md = buildMarkdownReport(wonders, artifacts, battles, countriesData, '');
    fs.writeFileSync('./imperator_report.md', md, 'utf8');
    console.log('\n✅ Звіт збережено у imperator_report.md');
}

function scanBinaryGamestate(buffer: Buffer) {
    const tags = TARGET_TAGS.map(tag => {
        const offset = buffer.indexOf(Buffer.from(tag, 'ascii'));
        if (offset === -1) return null;
        return { tag, offset, context: extractAsciiContext(buffer, offset) };
    }).filter(Boolean);

    const labels = ['country', 'countries', 'religion', 'primary_culture', 'owned_provinces', 'tag='];
    const labelHits = labels.map(label => {
        const offset = buffer.indexOf(Buffer.from(label, 'ascii'));
        if (offset === -1) return null;
        return { label, offset, context: extractAsciiContext(buffer, offset) };
    }).filter(Boolean);

    return { tags, labelHits };
}

function buildBinaryFallbackReport(analysis: any, savePath: string) {
    const now = new Date().toISOString();
    let md = `# Imperator Save Analysis Report\n\n_Produced: ${now}_\n\n`;
    md += `## Fallback binary scan for ${savePath}\n\n`;
    md += `⚠️ The save payload appears to be a binary internal gamestate, not a plain text save file.\n\n`;
    if (analysis.tags.length) {
        md += `### Target country tags found:\n`;
        analysis.tags.forEach((hit: any) => {
            md += `- ${hit.tag} @ offset ${hit.offset}\n`;
        });
        md += '\n';
    } else {
        md += '- No target country tags were found in the binary payload.\n\n';
    }
    if (analysis.labelHits.length) {
        md += `### Known label strings found in binary gamestate:\n`;
        analysis.labelHits.forEach((hit: any) => {
            md += `- ${hit.label} @ offset ${hit.offset}\n`;
        });
        md += '\n';
    }
    md += `## Notes\n`;
    md += `- Extracted embedded gamestate data into \`./gamestate.bin\` for offline analysis.\n`;
    md += `- The current parser can handle plain text Imperator save files, but this save uses a binary gamestate inside a .rome container.\n`;
    md += `- Use a dedicated Imperator binary save parser or the extracted gamestate binary to recover country blocks and ledger values.\n`;
    md += '\n---\n_Generated by Imperator save analyzer._\n' + now + '\n';
    return md;
}

async function readSampleHeader(savePath: string, length: number): Promise<Buffer> {
    const fd = await fs.promises.open(savePath, 'r');
    try {
        const buffer = Buffer.alloc(length);
        const { bytesRead } = await fd.read(buffer, 0, length, 0);
        return buffer.slice(0, bytesRead);
    } finally {
        await fd.close();
    }
}

async function parseSave() {
    if (!fs.existsSync(SAVE_FILE_PATH)) {
        console.error(`❌ Файл ${SAVE_FILE_PATH} не знайдено! Перевірте шлях.`);
        return;
    }

    console.log(`🔍 Розпочинаємо аналіз сейву: ${SAVE_FILE_PATH}...`);
    const stats = await fs.promises.stat(SAVE_FILE_PATH);
    const sampleSize = Math.min(64 * 1024, stats.size);
    const headerSlice = await readSampleHeader(SAVE_FILE_PATH, sampleSize);
    const likelyText = isLikelyTextBuffer(headerSlice);

    if (stats.size > STREAM_TEXT_THRESHOLD && likelyText) {
        await parseLargeTextSaveStreaming(SAVE_FILE_PATH);
        return;
    }

    const saveBuffer = await fs.promises.readFile(SAVE_FILE_PATH) as Buffer;
    let payload: Buffer = saveBuffer;
    const embedded: Buffer | null = extractEmbeddedZipEntry(saveBuffer, ZIP_GAMEDSTATE_NAME);
    if (embedded) {
        payload = Buffer.from(embedded);
        try {
            await fs.promises.writeFile('./gamestate.bin', embedded);
            console.log('✅ Вилучено embedded gamestate та збережено як ./gamestate.bin');
        } catch (err: any) {
            console.warn('⚠️ Не вдалося записати ./gamestate.bin:', err?.message || String(err));
        }
    }

    const text = tryDecodeText(payload);
    if (!text) {
        console.warn('⚠️ Сейв містить бінарний gamestate, поточний текстовий парсер не може його повністю розібрати.');
        const analysis = scanBinaryGamestate(payload);
        const md = buildBinaryFallbackReport(analysis, SAVE_FILE_PATH);
        fs.writeFileSync('./imperator_report.md', md, 'utf8');
        console.log('\n✅ Фallback-звіт збережено у imperator_report.md');
        return;
    }

    const full = text;
    const wonders = extractWonders(full);
    const artifacts = extractArtifacts(full);
    const battles = extractBattles(full);
    const TEMP_COUNTRIES_PATH = './tmp_countries.ndjson';
    try { fs.writeFileSync(TEMP_COUNTRIES_PATH, ''); } catch (e) { /* ignore */ }
    extractCountriesFromText(full, TEMP_COUNTRIES_PATH);

    console.log('\n==========================================');
    console.log('🗿 ЗНАЙДЕНІ ВЕЛИКІ ЧУДЕСА ТА АРТЕФАКТИ');
    console.log('==========================================');
    if (wonders.length > 0) {
        wonders.slice(0, 15).forEach((w, i) => console.log(`${i + 1}. 🏛️ Чудо/Споруда: ${w}`));
    } else {
        console.log('⚠️ Не знайдено очевидних записів про чудеса у текстовому сейві.');
    }

    try {
        const tmp = fs.existsSync(TEMP_COUNTRIES_PATH) ? fs.readFileSync(TEMP_COUNTRIES_PATH, 'utf8') : '';
        const countryLines = tmp.split(/\r?\n/).filter(Boolean);
        const countriesData = countryLines.map(l => {
            try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);

        const md = buildMarkdownReport(wonders, artifacts, battles, countriesData, full);
        fs.writeFileSync('./imperator_report.md', md, 'utf8');
        console.log('\n✅ Звіт збережено у imperator_report.md');
    } catch (err) {
        console.error('Помилка при складанні звіту:', err);
    }

}

parseSave().catch(console.error);

async function readWholeSave(savePath: string): Promise<string> {
    const buf = fs.readFileSync(savePath);
    // detect gzip
    if (buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
        try {
            return zlib.gunzipSync(buf).toString('utf8');
        } catch (_) {
            const swapped = Buffer.from(zlib.gunzipSync(buf));
            swapped.swap16();
            return swapped.toString('utf16le').replace(/^\uFEFF/, '');
        }
    }
    // try utf8
    try {
        return buf.toString('utf8').replace(/^\uFEFF/, '');
    } catch (_) {
        const swapped = Buffer.from(buf);
        swapped.swap16();
        return swapped.toString('utf16le').replace(/^\uFEFF/, '');
    }
}

function extractArtifacts(content: string) {
    const res: any[] = [];
    const re = /(relic|treasure|artifact|holy_relic)\s*=\s*\{([\s\S]*?)\}/gi;
    let m;
    while ((m = re.exec(content)) !== null) {
        const block = m[2] ?? '';
        const owner = (block.match(/owner\s*=\s*"?([A-Z0-9_\- ]+)"?/) || [])[1] || null;
        const name = (block.match(/name\s*=\s*"([^"]+)"/) || [])[1] || m[1];
        const province = (block.match(/province\s*=\s*(\d+)/) || [])[1] || null;
        res.push({ type: m[1], name, owner, province });
    }
    return res;
}

function extractBattles(content: string) {
    const res: any[] = [];
    const re = /battle\s*=\s*\{([\s\S]*?)\n\}/gi;
    let m;
    while ((m = re.exec(content)) !== null) {
        const block = m[1] ?? '';
        const loc = Number((block.match(/province\s*=\s*(\d+)/) || [])[1] || 0) || null;
        const attacker_losses = Number((block.match(/attacker_losses\s*=\s*(\d+)/) || [])[1] || 0);
        const defender_losses = Number((block.match(/defender_losses\s*=\s*(\d+)/) || [])[1] || 0);
        const total = attacker_losses + defender_losses;
        if (total > 1000) { // threshold for "large"
            res.push({ loc, attacker_losses, defender_losses, total });
        }
    }
    // sort by total descending
    res.sort((a, b) => b.total - a.total);
    return res.slice(0, 10);
}

function buildMarkdownReport(wonders: string[], artifacts: any[], battles: any[], countries: any[], fullContent: string) {
    const now = new Date().toISOString();
    let md = `# Imperator Save Analysis Report\n\n_Produced: ${now}_\n\n`;
    md += `## Епічний Лор та Артефакти\n\n`;
    if (wonders.length) {
        md += `### 🏛️ Унікальні споруди та Велики Чудеса\n`;
        wonders.forEach((w, i) => md += `- ${w}\n`);
        md += '\n';
    } else md += '- Не знайдено очевидних записів про чудеса.\n\n';

    if (artifacts.length) {
        md += `### 🔱 Артефакти / Реліквії\n`;
        artifacts.forEach(a => md += `- ${a.name || a.type} — owner: ${a.owner || 'unknown'} — province: ${a.province || 'unknown'}\n`);
        md += '\n';
    } else md += '- Артефакти не виявлено.\n\n';

    if (battles.length) {
        md += `### ⚔️ Великі битви / Катастрофи\n`;
        battles.forEach(b => md += `- Province ${b.loc || 'unknown'} — втрати: ${b.total} (atk ${b.attacker_losses}, def ${b.defender_losses})\n`);
        md += '\n';
    } else md += '- Без помітних великих битв за поріг.\n\n';

    md += `### Ідеї для археологічних подій\n`;
    md += `- У системі X знайдено руїни космічного корабля, названого на честь чуда з ${wonders[0] || 'невідомого чуда'}.\n`;
    md += `- Артефакт: Спис першого правителя ${TAG_NAMES['DAC'] || 'Dacia'} — знайдено у провінції ${artifacts[0]?.province || '??'}.\n`;
    md += `- Реліквія: Камінь-посвята з ${wonders[1] || 'забутого святилища'} дає бонуси культурі на сусідні провінції.\n\n`;

    md += `## Ledger (готовий блок для EVENTS.md)\n\n`;
    md += `| Країна (Колишня) | 🏞️ Території | 👥 Населення (Pops) | Religion | 🏛️ Столиця (Pops) | 🔬 Tech (Avg Civ) | 💰 Дохід (Income) | 👑Династія / Правитель |\n`;
    md += `| :--- | :---: | :---: |:---: | :---: | :---: | :---: | :--- |\n`;

    // Include target countries first and enrich with full save content
    const byTag: Record<string, any> = {};
    countries.forEach(c => { if (c.tag) byTag[c.tag] = c; });

    const hasFullText = Boolean(fullContent && fullContent.length > 0);
    const provincePopMap = hasFullText ? extractProvincePopMap(fullContent) : {};
    const rows = Object.keys(TAG_NAMES).map(tag => {
        const c = byTag[tag] || {};
        const name = TAG_NAMES[tag] || tag;
        // territories: prefer explicit owned_provinces_count, else count province owners in full content
        let territories: number | string = c.owned_provinces_count ?? c.num_of_cities ?? 0;
        if ((!territories || territories === 0) && hasFullText) {
            territories = countOwnedProvincesByTag(fullContent, tag);
        }
        if (!territories || territories === 0) {
            territories = 'N/A';
        }
        const pops = c.total_population ?? 'N/A';
        const religion = c.religion ?? c.primary_culture ?? 'N/A';
        // capital population lookup
        let capitalPops: any = 'N/A';
        if (hasFullText && c.capital) {
            capitalPops = provincePopMap[c.capital] ?? 'N/A';
        }
        // tech: prefer category breakdown if available
        let tech: any = c.technology_level ?? 'N/A';
        const techLevels = extractTechLevels(c.raw || '');
        if (Array.isArray(techLevels) && techLevels.length > 0) {
            tech = techLevels.join('/');
        } else if ((tech === 'N/A' || tech === undefined) && c.raw) {
            const t = (c.raw.match(/technology_level\s*=\s*(\d+)/) || [])[1];
            if (t) tech = Number(t);
            else {
                const t2 = (c.raw.match(/technology\s*=\s*\{[\s\S]*?level\s*=\s*(\d+)/) || [])[1];
                if (t2) tech = Number(t2);
            }
        }
        let gold = c.gold ?? 'N/A';
        if ((gold === 'N/A' || gold === undefined) && c.raw) {
            const g = (c.raw.match(/gold\s*=\s*(\d+)/) || [])[1];
            if (g) gold = Number(g);
            else {
                const g2 = (c.raw.match(/currency(?:_data)?\s*=\s*\{[\s\S]*?gold\s*=\s*(\d+)/) || [])[1];
                if (g2) gold = Number(g2);
            }
        }
        const rulerId = c.ruler ?? c.monarch ?? null;
        const rulerName = rulerId ? resolvePersonName(fullContent, rulerId) : 'N/A';
        let dyn = c.dynasty ?? null;
        if (!dyn && c.raw) {
            dyn = (c.raw.match(/dynasty\s*=\s*"([^"]+)"/) || [])[1] || (c.raw.match(/dynasty_name\s*=\s*"([^"]+)"/) || [])[1] || null;
        }
        if (!dyn) dyn = 'N/A';

        return `| 🏛️ **${name}** | ${territories} | ${pops} | ${religion} | ${capitalPops} | Tech ${tech} | ${gold} | ${dyn} / ${rulerName} |\n`;
    });

    md += rows.join('');

    md += '\n---\n_Generated by Imperator save analyzer._\n' + new Date().toISOString() + '\n';
    return md;
}

async function extractCountriesStreaming(savePath: string, outPath: string) {
    const stream = await createTextReadStream(savePath);
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

    let braceDepth = 0;
    let inCountries = false;
    let countriesDepth = 0;
    let collecting = false;
    let collectDepth = 0;
    let buffer: string[] = [];
    let matchedCount = 0;
    let currentCountryId: number | null = null;

    for await (const line of rl) {
        const l = line;
        const opens = (l.match(/{/g) || []).length;
        const closes = (l.match(/}/g) || []).length;

        // detect entering countries section
        if (!inCountries && /\bcountries\s*=\s*\{/.test(l) || /\bcountry\s*=\s*\{/.test(l)) {
            inCountries = true;
            countriesDepth = braceDepth + opens - closes;
        }

        if (inCountries && !collecting) {
            // detect start of a country entry: numeric key = {
            const m = l.match(/^\s*(\d+)\s*=\s*\{/);
            if (m) {
                collecting = true;
                collectDepth = (l.match(/{/g) || []).length - (l.match(/}/g) || []).length;
                buffer = [l];
                currentCountryId = Number(m[1]);
            }
        } else if (collecting) {
            buffer.push(l);
            collectDepth += opens - closes;
            if (collectDepth <= 0) {
                // finished a country block
                const block = buffer.join('\n');
                // find tag
                const tagMatch = block.match(/tag\s*=\s*"([A-Z0-9_]+)"/) || block.match(/tag\s*=\s*([A-Z0-9_]+)/);
                const tag = tagMatch ? tagMatch[1] : null;
                if (tag && TARGET_TAGS.includes(tag)) {
                    const obj: any = { tag };
                    if (currentCountryId) obj.country_id = currentCountryId;
                    const numCities = block.match(/num_of_cities\s*=\s*(\d+)/);
                    if (numCities) obj.num_of_cities = Number(numCities[1]);
                    const totalPop = block.match(/total_population\s*=\s*(\d+)/);
                    if (totalPop) obj.total_population = Number(totalPop[1]);
                    const gold = block.match(/gold\s*=\s*(\d+)/);
                    if (gold) obj.gold = Number(gold[1]);
                    const tech = block.match(/technology_level\s*=\s*(\d+)/);
                    if (tech) obj.technology_level = Number(tech[1]);
                    const monarch = block.match(/monarch\s*=\s*(\d+)/);
                    if (monarch) obj.monarch = Number(monarch[1]);
                    const ruler = block.match(/ruler\s*=\s*(\d+)/);
                    if (ruler) obj.ruler = Number(ruler[1]);
                    const culture = block.match(/primary_culture\s*=\s*"([^"]+)"/);
                    if (culture) obj.primary_culture = culture[1];
                    const religion = block.match(/religion\s*=\s*"([^"]+)"/);
                    if (religion) obj.religion = religion[1];
                    // owned_provinces count
                    const owned = block.match(/owned_provinces\s*=\s*\{([^}]*)\}/s);
                    if (owned) {
                        const nums = (owned[1] ?? '').match(/-?\d+/g) || [];
                        obj.owned_provinces = nums.map(Number);
                        obj.owned_provinces_count = obj.owned_provinces.length;
                    }
                    // capture capital id if present
                    const capital = block.match(/\bcapital\s*=\s*(\d+)/);
                    if (capital) obj.capital = Number(capital[1]);
                    // keep raw block for later enrichment
                    obj.raw = block;
                    fs.appendFileSync(outPath, JSON.stringify(obj) + '\n');
                    matchedCount++;
                }
                collecting = false;
                buffer = [];
                currentCountryId = null;
            }
        }

        braceDepth += opens - closes;
        if (inCountries && braceDepth < countriesDepth) {
            inCountries = false;
        }
    }

    console.log(`Extracted ${matchedCount} matching countries -> ${outPath}`);
}

function getSectionContent(full: string, sectionName: string): string | null {
    const idx = full.search(new RegExp(sectionName + '\\s*=\\s*\\{'));
    if (idx === -1) return null;
    const openIdx = full.indexOf('{', idx);
    let depth = 0;
    let end = -1;
    for (let i = openIdx; i < full.length; i++) {
        const ch = full[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) { end = i; break; }
        }
    }
    if (end === -1) return null;
    return full.slice(openIdx + 1, end);
}

function extractProvincePopMap(full: string): Record<number, number> {
    const map: Record<number, number> = {};
    const sec = getSectionContent(full, 'provinces');
    const text = sec ?? full;
    const re = /(\d+)\s*=\s*\{([\s\S]*?)\}/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        const id = Number(m[1]);
        const block = m[2] ?? '';
        const popMatch = block.match(/total_population\s*=\s*(\d+)/);
        if (popMatch) map[id] = Number(popMatch[1]);
    }
    return map;
}

function countOwnedProvincesByTag(full: string, tag: string): number {
    // Try mapping tag -> numeric country id first
    const tagMap = extractTagToIdMap(full);
    const sec = getSectionContent(full, 'provinces');
    const text = sec ?? full;
    const re = /(\d+)\s*=\s*\{([\s\S]*?)\}/g;
    let m;
    let count = 0;
    if (tagMap[tag]) {
        const cid = tagMap[tag];
        while ((m = re.exec(text)) !== null) {
            const block = m[2] ?? '';
            if (new RegExp('owner\\s*=\\s*' + cid + '\\b', 'i').test(block) || new RegExp('controller\\s*=\\s*' + cid + '\\b', 'i').test(block)) {
                count++;
            }
        }
        return count;
    }
    // fallback: search by tag string
    while ((m = re.exec(text)) !== null) {
        const block = m[2] ?? '';
        if (new RegExp('owner\\s*=\\s*"?' + tag + '"?', 'i').test(block) || new RegExp('controller\\s*=\\s*"?' + tag + '"?', 'i').test(block)) {
            count++;
        }
    }
    return count;
}

function resolvePersonName(full: string, id: number): string {
    // try to find numeric-keyed person block
    const sec = getSectionContent(full, 'people') || getSectionContent(full, 'persons') || full;
    const re = new RegExp('\\b' + id + '\\s*=\\s*\\{([\\s\\S]*?)\\}', 'g');
    let m = re.exec(sec);
    if (m) {
        const block = m[1] ?? '';
        const name = (block.match(/name\s*=\s*"([^"]+)"/) || [])[1] || '';
        if (name) return name;
        const given = (block.match(/given_name\s*=\s*"([^"]+)"/) || [])[1] || '';
        const family = (block.match(/family_name\s*=\s*"([^"]+)"/) || [])[1] || '';
        if (given || family) return `${given || ''} ${family || ''}`.trim();
    }
    // fallback: search entire file for id block
    const re2 = new RegExp('\\b' + id + '\\s*=\\s*\\{([\\s\\S]*?)\\}', 'g');
    m = re2.exec(full);
    if (m) {
        const block = m[1] ?? '';
        const name = (block.match(/name\s*=\s*"([^"]+)"/) || [])[1] || '';
        if (name) return name;
    }
    return String(id);
}

function extractTagToIdMap(full: string): Record<string, number> {
    const map: Record<string, number> = {};
    const sec = getSectionContent(full, 'countries') || getSectionContent(full, 'country') || full;
    const re = /(\d+)\s*=\s*\{([\s\S]*?)\}/g;
    let m;
    while ((m = re.exec(sec)) !== null) {
        const id = Number(m[1]);
        const block = m[2] ?? '';
        const tagMatch = block.match(/tag\s*=\s*"?([A-Z0-9_]+)"?/);
        if (tagMatch && tagMatch[1]) map[tagMatch[1]] = id;
    }
    return map;
}

function extractTechLevels(raw: string): number[] | null {
    if (!raw) return null;
    const techBlock = raw.match(/technology\s*=\s*\{([\s\S]*?)\}/);
    if (!techBlock) return null;
    const inner = techBlock[1] ?? '';
    const re = /(\w+)\s*=\s*(\d+)/g;
    let m: RegExpExecArray | null;
    const values: number[] = [];
    const keys: string[] = [];
    while ((m = re.exec(inner)) !== null) {
        if (!m[1] || !m[2]) continue;
        keys.push(m[1]);
        values.push(Number(m[2]));
    }
    if (values.length === 0) return null;
    return values;
}