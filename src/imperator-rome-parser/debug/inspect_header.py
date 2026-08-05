from pathlib import Path
import struct

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
data = path.read_bytes()
print('file len', len(data))
print('magic', data[:7], data[:7].decode('ascii', errors='replace'))
print('next 16 bytes hex', data[7:23].hex())
print('next 16 bytes ascii', data[7:23].decode('latin1', errors='replace'))

for i in range(7, 32, 2):
    if i + 2 <= len(data):
        print(f'word @ {i}:', data[i:i+2].hex(), struct.unpack_from('<H', data, i)[0])

print('\n--- dump 0-80 ---')
print(data[:80].hex())
print(data[:80].decode('latin1', errors='replace'))

# find strings of printable ascii
print('\n--- printable runs ---')
printables = []
current = []
for i, b in enumerate(data[:200]):
    if 32 <= b < 127:
        current.append(chr(b))
    else:
        if len(current) >= 4:
            print(''.join(current), 'at', i - len(current))
        current = []
if len(current) >= 4:
    print(''.join(current), 'at', 200 - len(current))
