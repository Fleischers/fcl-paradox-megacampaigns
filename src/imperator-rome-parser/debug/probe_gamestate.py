from pathlib import Path
import zipfile
import struct

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
with zipfile.ZipFile(path, 'r') as zf:
    raw = zf.read('gamestate')

print('gamestate len', len(raw))

# show first 120 bytes as bytes and as little-endian words
print('FIRST 120 BYTES:')
print(raw[:120].hex())
print('LE16:', [hex(x) for x in struct.unpack_from('<' + 'H'*20, raw, 0)])
print('LE32:', [hex(x) for x in struct.unpack_from('<' + 'I'*10, raw, 0)])
print()

# try to parse a simple length-prefixed string stream from the beginning
pos = 0
for i in range(10):
    if pos + 2 > len(raw):
        break
    length = struct.unpack_from('<H', raw, pos)[0]
    pos += 2
    print(f'string[{i}] len16={length} pos={pos}')
    if pos + length <= len(raw):
        segment = raw[pos:pos+length]
        print('  bytes:', segment.hex())
        print('  text:', segment.decode('latin1', errors='replace'))
    else:
        print('  truncated')
        break
    pos += length
    print('  next bytes', raw[pos:pos+16].hex())
    if pos + 2 <= len(raw):
        nextlen = struct.unpack_from('<H', raw, pos)[0]
        print('  next len16', nextlen)
    print()

# search for known country tags and print context with printable characters
for tag in [b'TUS', b'MAC', b'MAU', b'TAR', b'DAC', b'SCY', b'BEL', b'ARM', b'ALB', b'SUI']:
    idx = raw.find(tag)
    print(tag, 'idx', idx)
    if idx != -1:
        start = max(0, idx - 60)
        end = min(len(raw), idx + 120)
        region = raw[start:end]
        print('  context hex', region.hex())
        print('  context text', region.decode('latin1', errors='replace'))
        print('  nearby lengths', [struct.unpack_from('<H', raw, p)[0] if p+2<=len(raw) else None for p in range(start, min(end, start+20), 2)])
        print()

# search for readable ascii runs around country tags
for tag in [b'country', b'countries', b'owned_provinces', b'primary_culture', b'religion', b'name']:
    idx = raw.find(tag)
    print(tag, 'idx', idx)
    if idx != -1:
        start = max(0, idx - 100)
        end = min(len(raw), idx + 200)
        print(raw[start:end].decode('latin1', errors='replace'))
        print('---')

# show offsets of some repeated patterns
for pat in [b'owner', b'capital', b'religion', b'primary', b'technology', b'total_population', b'num_of_cities']:
    idx = raw.find(pat)
    print(pat, idx)
