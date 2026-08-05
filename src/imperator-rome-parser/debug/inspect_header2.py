from pathlib import Path
import struct

path = Path('..\..\campaign-2026-07-12-the-first\game-1-imperator-rome\save-games\FCL1-2026-07-26-C.rome')
data = path.read_bytes()
print('len', len(data))
print('magic', data[:7], data[:7].decode('ascii', errors='replace'))
print('header bytes 7-31', data[7:31].hex())
print('header ascii 7-31', data[7:31].decode('latin1', errors='replace'))

# try to parse as big-endian length-prefixed strings
idx = 31
for i in range(10):
    if idx + 2 > len(data):
        break
    length = struct.unpack_from('>H', data, idx)[0]
    idx += 2
    s = data[idx:idx+length]
    print(f'str {i} len {length} @ {idx} ->', s[:80].decode('latin1', errors='replace'))
    idx += length
    if idx >= len(data):
        break

print('\n--- then bytes around idx', idx, data[idx:idx+32].hex(), data[idx:idx+32].decode('latin1',errors='replace'))
