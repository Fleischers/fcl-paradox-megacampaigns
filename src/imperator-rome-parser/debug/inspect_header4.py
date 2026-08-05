from pathlib import Path
import struct

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
data = path.read_bytes()
start = 32
end = 180
print('slice', start, end)
for i in range(start, end):
    b = data[i]
    ch = chr(b) if 32 <= b < 127 else '.'
    print(f'{i:03d}: {b:02x} {ch}')

print('\n--- interpreting from 32 using 16-bit width ---')
for i in range(start, end, 2):
    v = struct.unpack_from('<H', data, i)[0]
    print(f'{i:03d}: {v:04x}', end='; ')
    if (i - start) % 10 == 8:
        print()

print('\n\n--- parse pattern ---')
idx = 32
while idx < len(data) and idx < 180:
    if idx + 4 > len(data): break
    tag = struct.unpack_from('<H', data, idx)[0]
    length = struct.unpack_from('<H', data, idx+2)[0]
    print('idx', idx, 'tag', hex(tag), 'len', length)
    idx += 4
    s = data[idx: idx+length]
    print(' text', s.decode('latin1', errors='replace'))
    idx += length
    if length == 0:
        break
