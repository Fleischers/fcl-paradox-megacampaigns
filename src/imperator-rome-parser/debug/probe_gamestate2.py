from pathlib import Path
import zipfile
import struct

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
with zipfile.ZipFile(path, 'r') as zf:
    raw = zf.read('gamestate')

# helper to display bytes around an offset with 16-bit little-endian values

def show_ctx(offset, before=40, after=120):
    start = max(0, offset-before)
    end = min(len(raw), offset+after)
    region = raw[start:end]
    print(f'OFFSET {offset} (hex {offset:08x})')
    print('BYTES', region.hex())
    print('TEXT', region.decode('latin1', errors='replace'))
    print('LE16', [hex(struct.unpack_from('<H', region, i)[0]) for i in range(0, min(len(region), 40), 2)])
    print('LE32', [hex(struct.unpack_from('<I', region, i)[0]) for i in range(0, min(len(region), 40), 4)])
    print('---')

for pat in [b'TUS', b'MAC', b'TAR', b'DAC', b'SCY', b'BEL', b'ARM', b'ALB', b'SUI']:
    idx = raw.find(pat)
    print('PAT', pat, 'idx', idx)
    if idx != -1:
        show_ctx(idx)

# find ascii runs longer than 5 and show offsets within the first 1000000 or around tag positions
print('=== ascii runs near tag offsets ===')
for idx in range(len(raw)):
    if idx > 1000000: break
    if 32 <= raw[idx] <= 126:
        # check run length
        run = idx
        while run < len(raw) and 32 <= raw[run] <= 126:
            run += 1
        if run - idx >= 6:
            print('ASCII run', idx, raw[idx:run].decode('latin1'))
            if idx > 600000: break
            idx = run
            continue
        idx = run

print('=== search for country tag strings in entire raw with prefix bytes ===')
for tag in [b'TUS', b'MAC', b'TAR', b'DAC', b'SCY', b'BEL', b'ARM', b'ALB', b'SUI']:
    idx = raw.find(tag)
    print('TAG', tag, idx)
    if idx != -1:
        for bsize in [4, 8, 12, 16, 20]:
            start = max(0, idx-bsize)
            vals = [raw[i] for i in range(start, idx)]
            print(f'PRE{bsize}:', ' '.join(hex(x) for x in vals))
        print('NEXT:', ' '.join(hex(x) for x in raw[idx:idx+20]))
        print('---')

# search for repeated patterns around ascii seeds
for seed in [b'country', b'countries', b'religion', b'primary_culture', b'name', b'owned_provinces']:
    idx = raw.find(seed)
    print('SEED', seed, 'idx', idx)
    if idx != -1:
        show_ctx(idx, before=80, after=200)

# if there are country numeric IDs, show 32-bit ints near tags
print('=== 32-bit ints around tags ===')
for pat in [b'TUS', b'MAC', b'TAR', b'DAC', b'SCY', b'BEL', b'ARM', b'ALB', b'SUI']:
    idx = raw.find(pat)
    if idx != -1:
        for off in range(-24, 0, 4):
            pos = idx + off
            if pos >= 0 and pos+4 <= len(raw):
                val = struct.unpack_from('<I', raw, pos)[0]
                print(pat, 'pos', off, 'u32', val)
        print('---')
