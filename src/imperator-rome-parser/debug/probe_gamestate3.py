from pathlib import Path
import zipfile
import struct

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
with zipfile.ZipFile(path, 'r') as zf:
    raw = zf.read('gamestate')

with open('probe_gamestate3_out.txt', 'w', encoding='utf8', errors='replace') as f:
    def show_ctx(offset, before=40, after=120):
        start = max(0, offset-before)
        end = min(len(raw), offset+after)
        region = raw[start:end]
        f.write(f'OFFSET {offset} (hex {offset:08x})\n')
        f.write('BYTES ' + region.hex() + '\n')
        f.write('TEXT ' + repr(region.decode('latin1', errors='replace')) + '\n')
        f.write('LE16 ' + str([hex(struct.unpack_from('<H', region, i)[0]) for i in range(0, min(len(region), 40), 2)]) + '\n')
        f.write('LE32 ' + str([hex(struct.unpack_from('<I', region, i)[0]) for i in range(0, min(len(region), 40), 4)]) + '\n')
        f.write('---\n')

    for pat in [b'TUS', b'MAC', b'TAR', b'DAC', b'SCY', b'BEL', b'ARM', b'ALB', b'SUI']:
        idx = raw.find(pat)
        f.write(f'PAT {pat} idx {idx}\n')
        if idx != -1:
            show_ctx(idx)
    f.write('=== ascii runs near tag offsets ===\n')
    idx = 0
    while idx < len(raw) and idx < 1000000:
        if 32 <= raw[idx] <= 126:
            run = idx
            while run < len(raw) and 32 <= raw[run] <= 126:
                run += 1
            if run - idx >= 6:
                f.write(f'ASCII run {idx} {repr(raw[idx:run].decode("latin1"))}\n')
                idx = run
                continue
            idx = run
        idx += 1
    f.write('=== search for country tag strings prefix bytes ===\n')
    for tag in [b'TUS', b'MAC', b'TAR', b'DAC', b'SCY', b'BEL', b'ARM', b'ALB', b'SUI']:
        idx = raw.find(tag)
        f.write(f'TAG {tag} {idx}\n')
        if idx != -1:
            for bsize in [4, 8, 12, 16, 20]:
                start = max(0, idx-bsize)
                vals = [raw[i] for i in range(start, idx)]
                f.write('PRE{}: '.format(bsize) + ' '.join(hex(x) for x in vals) + '\n')
            f.write('NEXT: ' + ' '.join(hex(x) for x in raw[idx:idx+20]) + '\n')
            f.write('---\n')
    f.write('=== 32-bit ints around tags ===\n')
    for pat in [b'TUS', b'MAC', b'TAR', b'DAC', b'SCY', b'BEL', b'ARM', b'ALB', b'SUI']:
        idx = raw.find(pat)
        if idx != -1:
            for off in range(-24, 0, 4):
                pos = idx + off
                if pos >= 0 and pos+4 <= len(raw):
                    val = struct.unpack_from('<I', raw, pos)[0]
                    f.write(f'{pat} pos {off} u32 {val}\n')
            f.write('---\n')
print('done')
