from pathlib import Path

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
data = path.read_bytes()
print('len', len(data))
for i in range(0, 120):
    b = data[i]
    ch = chr(b) if 32 <= b < 127 else '.'
    print(f'{i:03d}: {b:02x} {ch}')

print('\n--- ascii run from 32 to 200 ---')
for i in range(32, 200):
    b = data[i]
    if 32 <= b < 127:
        print(chr(b), end='')
    else:
        print('.', end='')
print()

# attempt to interpret header values around offsets 8..40
import struct
for off in range(8, 41, 4):
    if off + 4 <= len(data):
        val_le = struct.unpack_from('<I', data, off)[0]
        val_be = struct.unpack_from('>I', data, off)[0]
        print(f'off {off:02d}: bytes {data[off:off+4].hex()} le {val_le} be {val_be}')

print('\n--- bytes 230-280 ---')
for i in range(230, 280):
    b = data[i]
    ch = chr(b) if 32 <= b < 127 else '.'
    print(f'{i:03d}: {b:02x} {ch}')

print('\n--- PK zip signatures ---')
for sig in [b'PK\x03\x04', b'PK\x05\x06', b'PK\x07\x08']:
    idx = data.find(sig)
    print(sig, idx)
    if idx != -1:
        print(data[idx:idx+32].hex())
