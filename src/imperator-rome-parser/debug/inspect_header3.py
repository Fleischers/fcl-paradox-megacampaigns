from pathlib import Path
import struct

path = Path('../../campaign-2026-07-12-the-first/game-1-imperator-rome/save-games/FCL1-2026-07-26-C.rome')
raw = path.read_bytes()
# find start of printable region after the magic prefix
start = raw.find(b'2.0.5')
print('start at', start)
print(raw[start-16:start+80].hex())

# parse little-endian 16-bit length prefixes into strings
idx = start - 2  # before the string length for 2.0.5 if possible
for i in range(15):
    if idx + 2 > len(raw):
        break
    length = struct.unpack_from('<H', raw, idx)[0]
    print('len at', idx, length)
    idx += 2
    if idx + length > len(raw):
        print('break, string beyond end', idx, length)
        break
    s = raw[idx: idx+length]
    print('str', repr(s[:80]), '>>>', s.decode('latin1', errors='replace'))
    idx += length
    if length == 0:
        break

print('next bytes', raw[idx:idx+32].hex(), raw[idx:idx+32].decode('latin1',errors='replace'))
