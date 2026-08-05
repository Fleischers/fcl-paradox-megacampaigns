from pathlib import Path
import zipfile
import re
from io import BytesIO

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
with zipfile.ZipFile(path, 'r') as zf:
    names = zf.namelist()
    print('zip entries:', names)
    info = zf.getinfo('gamestate')
    print('gamestate size', info.file_size, 'compressed', info.compress_size)
    raw = zf.read('gamestate')
    print('raw len', len(raw))
    sample = raw[:512]
    print('sample hex', sample.hex())
    print('sample ascii', sample.decode('latin1', errors='replace'))

# search for ascii patterns in first 200k bytes
patterns = [b'countries', b'country', b'tag=', b'primary_culture', b'meta_player_name', b'name=', b'religion', b'province=', b'owned_provinces', b'people']
for pat in patterns:
    idx = raw.find(pat)
    print(pat, idx)
    if idx != -1:
        start = max(0, idx-80)
        print(raw[start:idx+120].decode('latin1', errors='replace'))
        print('---')

# inspect around the first country/countries offsets if found
for key in [b'country', b'countries']:
    idx = raw.find(key)
    if idx != -1:
        print('\n=== inspect', key, 'at', idx)
        region = raw[max(0, idx-200):idx+200]
        print(region.hex())
        print(region.decode('latin1', errors='replace'))
        print('---')

# find printable strings of length >= 8 in first 256k bytes
print('\nprintable runs:')
printable = re.compile(rb'[\x20-\x7e]{8,}')
for m in printable.finditer(raw[:256*1024]):
    if m.start() < 2000:
        print(m.start(), m.group().decode('latin1'))
    else:
        break

# inspect first 200 bytes as little-endian u16 values
import struct
print('\nfirst 80 bytes u16:')
for i in range(0, 80, 2):
    val = struct.unpack_from('<H', raw, i)[0]
    print(i, hex(val), end='; ')
print()